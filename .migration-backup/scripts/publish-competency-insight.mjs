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
  // This publication gate expects a minimal config with one top-level
  // project_id. Do not guess a destination from a partial or malformed file.
  const entries = config.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
  const projectEntries = entries.filter((line) => /^\s*project_id(?:\s|=)/.test(line));
  if (projectEntries.length === 0) {
    throw new PublishStepError("configuration", {
      code: "project_id_missing",
      message: "Missing project_id in supabase/config.toml",
    });
  }
  const match = entries.length === 1 &&
    projectEntries.length === 1 &&
    projectEntries[0].match(/^\s*project_id\s*=\s*(["'])([a-z0-9]{20})\1\s*(?:#.*)?$/);
  if (!match) {
    throw new PublishStepError("configuration", {
      code: "config_invalid",
      message: "Invalid supabase/config.toml; expected one valid project_id",
    });
  }

  const projectRef = match[2];
  const override = process.env.SUPABASE_PROJECT_REF;
  if (override !== undefined && !/^[a-z0-9]{20}$/.test(override)) {
    throw new PublishStepError("configuration", {
      code: "project_ref_invalid",
      message: "SUPABASE_PROJECT_REF must be a valid project reference",
    });
  }
  if (override !== undefined && override !== projectRef) {
    throw new PublishStepError("configuration", {
      code: "project_ref_mismatch",
      message: "SUPABASE_PROJECT_REF does not match supabase/config.toml",
    });
  }
  return projectRef;
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