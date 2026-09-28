import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const functionName = "competency-insight";
const maxDiagnosticBytes = 16 * 1024;
const sensitiveValues = Object.entries(process.env)
  .filter(([name, value]) =>
    (/(?:SECRET|TOKEN|PASSWORD|PASSWD|KEY|CREDENTIAL|DATABASE_URL|AUTHORIZATION)/i.test(name) ||
      name === "SUPABASE_PROJECT_REF") &&
    value && value.length >= 4)
  .map(([, value]) => value)
  .sort((a, b) => b.length - a.length);
// Retain enough overlap to redact a value that crosses the capture cutoff.
const maxSensitiveBytes = Math.max(0, ...sensitiveValues.map((value) => Buffer.byteLength(value)));
const maxCaptureBytes = maxDiagnosticBytes + maxSensitiveBytes;

class PublishStepError extends Error {
  constructor(step, diagnostics) {
    super(step);
    this.step = step;
    this.diagnostics = diagnostics;
  }
}

async function readProjectRef() {
  const configPath = path.join(rootDir, "supabase", "config.toml");
  const config = await readFile(configPath, "utf8");
  const match = config.match(/^\s*project_id\s*=\s*["']([^"']+)["']\s*$/m);
  if (!match) throw new PublishStepError("configuration");
  return process.env.SUPABASE_PROJECT_REF || match[1];
}

function captureOutput(stream) {
  const chunks = [];
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
  let output = text.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "").replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
  for (const value of sensitiveValues) {
    output = output.replaceAll(value, "[REDACTED]");
  }
  output = output
    .replace(/(Bearer\s+)[^\s"']+/gi, "$1[REDACTED]")
    .replace(/((?:password|token|secret|api[_-]?key|authorization)\s*[:=]\s*["']?)[^\s"',}]+/gi, "$1[REDACTED]")
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, "$1[REDACTED]@");
  if (truncated) {
    // The first bytes may start inside a sensitive value; discard the overlap.
    output = Buffer.from(output).subarray(maxSensitiveBytes).toString("utf8");
  }
  const bytes = Buffer.from(output);
  if (bytes.length > maxDiagnosticBytes) {
    output = bytes.subarray(-maxDiagnosticBytes).toString("utf8");
    truncated = true;
  }
  return `${truncated ? "[earlier output truncated]\n" : ""}${output.trim()}`;
}

function runQuiet(command, args, step) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = captureOutput(child.stdout);
    const stderr = captureOutput(child.stderr);

    child.on("error", (error) => reject(new PublishStepError(step, {
      spawnError: error.code ?? "unknown",
    })));
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new PublishStepError(step, {
          exitCode: code,
          ...(signal ? { signal } : {}),
          stdout: safeDiagnostic(stdout()),
          stderr: safeDiagnostic(stderr()),
        }));
      }
    });
  });
}

async function publishAndVerify() {
  const projectRef = await readProjectRef();

  await runQuiet(
    "npm",
    [
      "exec",
      "--yes",
      "--",
      "supabase",
      "functions",
      "deploy",
      functionName,
      "--project-ref",
      projectRef,
      "--use-api",
    ],
    "deployment",
  );

  await runQuiet(
    "npm",
    ["run", "--silent", "test:insight:live"],
    "live_probe",
  );
}

try {
  await publishAndVerify();
  console.log(JSON.stringify({
    status: "passed",
    function: functionName,
    deployment: "active",
    liveProbe: "passed",
  }));
} catch (error) {
  const step = error instanceof PublishStepError ? error.step : "configuration";
  console.error(JSON.stringify({
    status: "failed",
    step,
    reason: "competency_insight_publication_not_verified",
    ...(error instanceof PublishStepError ? { diagnostics: error.diagnostics } : {}),
  }));
  process.exitCode = 1;
}