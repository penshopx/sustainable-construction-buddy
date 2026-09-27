import { spawn } from "node:child_process";

const maxDiagnosticBytes = 16 * 1024;
const sensitiveValues = Object.entries(process.env)
  .filter(([name, value]) =>
    /(?:SECRET|TOKEN|PASSWORD|PASSWD|KEY|CREDENTIAL|DATABASE_URL|AUTHORIZATION)/i.test(name) &&
    value && value.length >= 4)
  .map(([, value]) => value)
  .sort((a, b) => b.length - a.length);
// Keep enough overlap to redact credentials that cross the final output cutoff.
const maxSensitiveBytes = Math.max(0, ...sensitiveValues.map((value) => Buffer.byteLength(value)));
const maxCaptureBytes = maxDiagnosticBytes + maxSensitiveBytes;
const validationSteps = [
  {
    name: "contract",
    args: ["run", "--silent", "test:insight"],
  },
  {
    name: "publication_gate",
    args: ["run", "--silent", "test:insight:publish"],
  },
];

class ValidationStepError extends Error {
  constructor(step, diagnostics) {
    super(step);
    this.step = step;
    this.diagnostics = diagnostics;
  }
}

function captureOutput(stream) {
  let chunks = [];
  let size = 0;
  let truncated = false;

  stream.on("data", (chunk) => {
    chunks.push(chunk);
    size += chunk.length;
    while (size > maxCaptureBytes) {
      const excess = size - maxCaptureBytes;
      if (chunks[0].length <= excess) {
        size -= chunks.shift().length;
      } else {
        chunks[0] = chunks[0].subarray(excess);
        size -= excess;
      }
      truncated = true;
    }
  });

  return () => ({ text: Buffer.concat(chunks).toString("utf8"), truncated });
}

function safeDiagnostic({ text, truncated }) {
  // Terminal escapes and control characters should not affect CI logs.
  let output = text.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "").replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
  for (const value of sensitiveValues) {
    output = output.replaceAll(value, "[REDACTED]");
  }
  output = output
    .replace(/(Bearer\s+)[^\s"']+/gi, "$1[REDACTED]")
    .replace(/((?:password|token|secret|api[_-]?key|authorization)\s*[:=]\s*["']?)[^\s"',}]+/gi, "$1[REDACTED]")
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, "$1[REDACTED]@");
  if (truncated) {
    // The captured buffer may start inside a credential; its unmatched suffix
    // cannot be safely redacted. Discard that entire overlap after redaction.
    output = Buffer.from(output).subarray(maxSensitiveBytes).toString("utf8");
  }
  const bytes = Buffer.from(output);
  if (bytes.length > maxDiagnosticBytes) {
    output = bytes.subarray(-maxDiagnosticBytes).toString("utf8");
    truncated = true;
  }
  return `${truncated ? "[earlier output truncated]\n" : ""}${output.trim()}`;
}

function runNpm(args, step) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    const stdout = captureOutput(child.stdout);
    const stderr = captureOutput(child.stderr);

    child.on("error", (error) => reject(new ValidationStepError(step, {
      spawnError: error.code ?? "unknown",
    })));
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new ValidationStepError(step, {
          exitCode: code,
          ...(signal ? { signal } : {}),
          stdout: safeDiagnostic(stdout()),
          stderr: safeDiagnostic(stderr()),
        }));
      }
    });
  });
}

try {
  for (const step of validationSteps) {
    await runNpm(step.args, step.name);
  }

  console.log(JSON.stringify({
    status: "passed",
    checks: validationSteps.map(({ name }) => name),
  }));
} catch (error) {
  console.error(JSON.stringify({
    status: "failed",
    step: error instanceof ValidationStepError ? error.step : "configuration",
    reason: "competency_insight_validation_failed",
    ...(error instanceof ValidationStepError ? { diagnostics: error.diagnostics } : {}),
  }));
  process.exitCode = 1;
}