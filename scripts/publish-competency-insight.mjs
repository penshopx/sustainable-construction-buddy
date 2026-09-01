import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const functionName = "competency-insight";

class PublishStepError extends Error {
  constructor(step) {
    super(step);
    this.step = step;
  }
}

async function readProjectRef() {
  const configPath = path.join(rootDir, "supabase", "config.toml");
  const config = await readFile(configPath, "utf8");
  const match = config.match(/^\s*project_id\s*=\s*["']([^"']+)["']\s*$/m);
  if (!match) throw new PublishStepError("configuration");
  return process.env.SUPABASE_PROJECT_REF || match[1];
}

function runQuiet(command, args, step) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      env: process.env,
      stdio: ["ignore", "ignore", "ignore"],
    });

    child.on("error", () => reject(new PublishStepError(step)));
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new PublishStepError(step));
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
  }));
  process.exitCode = 1;
}