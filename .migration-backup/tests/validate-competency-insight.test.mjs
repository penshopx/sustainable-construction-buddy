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
  printf '%s\\n' "not ok 1 - publication gate assertion" "AssertionError: expected published function" >&2
  printf '%s\\n' "token=$VALIDATION_TEST_SECRET" "Bearer $VALIDATION_TEST_SECRET" >&2
  printf '%s\\n' "publication stdout diagnostic" "secret: $VALIDATION_TEST_SECRET"
  exit 23
fi
if [ "$FAKE_VALIDATION_SCENARIO" = "contract-failure" ] && [ "$*" = "run --silent test:insight" ]; then
  printf '%s\\n' "not ok 1 - contract assertion" "at contract.test.mjs:42:7" >&2
  exit 17
fi
if [ "$FAKE_VALIDATION_SCENARIO" = "long-failure" ] && [ "$*" = "run --silent test:insight" ]; then
  count=0
  while [ "$count" -lt 1000 ]; do
    printf '%s\\n' "repeated diagnostic line with lots of output" >&2
    count=$((count + 1))
  done
  printf '%s\\n' "AssertionError: final useful detail" >&2
  exit 17
fi
if [ "$FAKE_VALIDATION_SCENARIO" = "key-failure" ] && [ "$*" = "run --silent test:insight" ]; then
  printf '%s\\n' "AssertionError: $SUPABASE_SERVICE_ROLE_KEY did not match" >&2
  exit 17
fi
if [ "$FAKE_VALIDATION_SCENARIO" = "cutoff-failure" ] && [ "$*" = "run --silent test:insight" ]; then
  printf '%s' "$SUPABASE_SERVICE_ROLE_KEY" >&2
  printf '%16375s' '' | tr ' ' 'x' >&2
  printf '%s\\n' " final assertion" >&2
  exit 17
fi
if [ "$FAKE_VALIDATION_SCENARIO" = "repeated-key-failure" ] && [ "$*" = "run --silent test:insight" ]; then
  count=0
  while [ "$count" -lt 1000 ]; do
    printf '%s\\n' "$SUPABASE_SERVICE_ROLE_KEY" >&2
    count=$((count + 1))
  done
  printf '%s\\n' "AssertionError: repeated key output" >&2
  exit 17
fi
if [ "$FAKE_VALIDATION_SCENARIO" = "success" ]; then
  printf '%s\\n' "passing test output"
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
        PATH: `${path.dirname(npmPath)}${path.delimiter}${process.env.PATH ?? ""}`,
        VALIDATION_TRACE_FILE: tracePath,
        FAKE_VALIDATION_SCENARIO: scenario,
        VALIDATION_TEST_SECRET: "sensitive-test-value-123",
        SUPABASE_SERVICE_ROLE_KEY: "privileged-service-key-value-123",
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

test("publication failure includes bounded, sanitized subprocess diagnostics", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const result = await runValidator({ ...fakeNpm, scenario: "publication-failure" });

  assert.notEqual(result.status, 0);
  assert.equal(result.signal, null);
  assert.equal(result.stdout, "");
  const failure = JSON.parse(result.stderr);
  assert.equal(failure.status, "failed");
  assert.equal(failure.step, "publication_gate");
  assert.equal(failure.reason, "competency_insight_validation_failed");
  assert.equal(failure.diagnostics.exitCode, 23);
  assert.match(failure.diagnostics.stderr, /not ok 1 - publication gate assertion/);
  assert.match(failure.diagnostics.stderr, /AssertionError: expected published function/);
  assert.match(failure.diagnostics.stdout, /publication stdout diagnostic/);
  assert.match(failure.diagnostics.stdout, /\[REDACTED\]/);
  assert.match(failure.diagnostics.stderr, /\[REDACTED\]/);
  assert.equal(result.stderr.includes("sensitive-test-value-123"), false);
  assert.deepEqual(await readTrace(fakeNpm.tracePath), [
    "run --silent test:insight",
    "run --silent test:insight:publish",
  ]);
});

test("contract failure reports its assertion and skips publication gate", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const result = await runValidator({ ...fakeNpm, scenario: "contract-failure" });

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  const failure = JSON.parse(result.stderr);
  assert.equal(failure.step, "contract");
  assert.equal(failure.diagnostics.exitCode, 17);
  assert.match(failure.diagnostics.stderr, /not ok 1 - contract assertion/);
  assert.match(failure.diagnostics.stderr, /at contract\.test\.mjs:42:7/);
  assert.deepEqual(await readTrace(fakeNpm.tracePath), ["run --silent test:insight"]);
});

test("long failures keep the final assertion without flooding logs", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const result = await runValidator({ ...fakeNpm, scenario: "long-failure" });

  assert.notEqual(result.status, 0);
  const { diagnostics } = JSON.parse(result.stderr);
  assert.match(diagnostics.stderr, /^\[earlier output truncated\]/);
  assert.match(diagnostics.stderr, /AssertionError: final useful detail$/);
  assert.ok(Buffer.byteLength(diagnostics.stderr) < 17 * 1024);
});

test("a service role key in plain assertion output is redacted", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const result = await runValidator({ ...fakeNpm, scenario: "key-failure" });

  assert.notEqual(result.status, 0);
  assert.match(JSON.parse(result.stderr).diagnostics.stderr, /AssertionError: \[REDACTED\] did not match/);
  assert.equal(result.stderr.includes("privileged-service-key-value-123"), false);
});

test("a service role key crossing the output cutoff cannot leak its suffix", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const result = await runValidator({ ...fakeNpm, scenario: "cutoff-failure" });

  assert.notEqual(result.status, 0);
  const diagnostic = JSON.parse(result.stderr).diagnostics.stderr;
  assert.match(diagnostic, /final assertion$/);
  assert.equal(diagnostic.includes("service-key-value-123"), false);
  assert.equal(diagnostic.includes("privileged-service-key-value-123"), false);
});

test("repeated credentials cannot expose a fragment from the capture boundary", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const result = await runValidator({ ...fakeNpm, scenario: "repeated-key-failure" });

  assert.notEqual(result.status, 0);
  const diagnostic = JSON.parse(result.stderr).diagnostics.stderr;
  assert.match(diagnostic, /AssertionError: repeated key output$/);
  assert.equal(diagnostic.includes("service-key-value-123"), false);
  assert.equal(diagnostic.includes("privileged-service-key-value-123"), false);
  assert.match(diagnostic, /\[REDACTED\]/);
});