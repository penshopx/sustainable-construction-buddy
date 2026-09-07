import { spawn } from "node:child_process";

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
  constructor(step) {
    super(step);
    this.step = step;
  }
}

function runNpm(args, step) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", args, {
      stdio: ["ignore", "ignore", "ignore"],
      env: process.env,
    });

    child.on("error", () => reject(new ValidationStepError(step)));
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new ValidationStepError(step));
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
  }));
  process.exitCode = 1;
}