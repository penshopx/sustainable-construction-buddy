import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { captureOutput, safeDiagnostic } from "./subprocess-diagnostics.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const functionName = "competency-insight";

class PublishStepError extends Error {
  constructor(step, diagnostics) {
    super(step);
    this.step = step;
    this.diagnostics = diagnostics;
  }
}

async function readProjectRef() {
  const configPath = path.join(rootDir, "supabase", "config.toml");
  let config;
  try {
    config = await readFile(configPath, "utf8");
  } catch {
    throw new PublishStepError("configuration", {
      code: "config_unreadable",
      message: "Cannot read supabase/config.toml",
    });
  }
  const match = config.match(/^\s*project_id\s*=\s*["']([^"']+)["']\s*$/m);
  if (!match) throw new PublishStepError("configuration", {
    code: "project_id_missing",
    message: "Missing project_id in supabase/config.toml",
  });
  return process.env.SUPABASE_PROJECT_REF || match[1];
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