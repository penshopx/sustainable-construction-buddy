import assert from "node:assert/strict";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import test from "node:test";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validatorPath = path.join(rootDir, "scripts", "validate-competency-insight.mjs");

async function createFakeNpm(t) {
  const directory = await mkdtemp(path.join(tmpdir(), "validate-competency-insight-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  const tracePath = path.join(directory, "trace.log");
  const npmPath = path.join(directory, "npm");
  await writeFile(
    npmPath,
    `#!/bin/sh
printf '%s\\n' "$*" >> "$VALIDATION_TRACE_FILE"
if [ "$FAKE_VALIDATION_SCENARIO" = "publication-failure" ] && [ "$*" = "run --silent test:insight:publish" ]; then
  printf '%s\\n' "private-validation-detail" >&2
  exit 23
fi
exit 0
`,
    "utf8",
  );
  await chmod(npmPath, 0o755);

  return { directory, npmPath, tracePath };
}

function runValidator({ npmPath, tracePath, scenario }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [validatorPath], {
      cwd: rootDir,
      env: {
        ...process.env,
        PATH: `${path.dirname(npmPath)}${path.delimiter}${process.env.PATH ?? ""}`,
        VALIDATION_TRACE_FILE: tracePath,
        FAKE_VALIDATION_SCENARIO: scenario,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];

    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (status, signal) => {
      resolve({
        status,
        signal,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });
}

async function readTrace(tracePath) {
  const trace = await readFile(tracePath, "utf8");
  return trace.trim().split("\n").filter(Boolean);
}

test("standard validator runs every local insight check in order", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const result = await runValidator({ ...fakeNpm, scenario: "success" });

  assert.equal(result.status, 0);
  assert.equal(result.signal, null);
  assert.equal(result.stderr, "");
  assert.deepEqual(await readTrace(fakeNpm.tracePath), [
    "run --silent test:insight",
    "run --silent test:insight:publish",
  ]);
  assert.deepEqual(JSON.parse(result.stdout), {
    status: "passed",
    checks: ["contract", "publication_gate"],
  });
});

test("standard validator stops at the failing check and sanitizes its result", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const result = await runValidator({ ...fakeNpm, scenario: "publication-failure" });

  assert.notEqual(result.status, 0);
  assert.equal(result.signal, null);
  assert.equal(result.stdout, "");
  assert.deepEqual(JSON.parse(result.stderr), {
    status: "failed",
    step: "publication_gate",
    reason: "competency_insight_validation_failed",
  });
  assert.equal(result.stderr.includes("private-validation-detail"), false);
  assert.deepEqual(await readTrace(fakeNpm.tracePath), [
    "run --silent test:insight",
    "run --silent test:insight:publish",
  ]);
});