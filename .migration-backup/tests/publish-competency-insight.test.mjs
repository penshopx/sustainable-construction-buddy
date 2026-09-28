import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import test from "node:test";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publisherPath = path.join(rootDir, "scripts", "publish-competency-insight.mjs");
const packageJsonPath = path.join(rootDir, "package.json");
const replitConfigPath = path.join(rootDir, ".replit");
const projectRef = "abcdefghijklmnopqrst";
const sensitiveValues = [
  "publication-gate-secret",
  '{"identity":"probe-user@example.test","payload":"private-probe-payload"}',
  "probe-user@example.test",
  "https://provider.example.test/recommendations",
  "privileged-service-key-value-123",
];

async function createFakeNpm(t) {
  const directory = await mkdtemp(path.join(tmpdir(), "publish-competency-insight-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  const tracePath = path.join(directory, "trace.log");
  const npmPath = path.join(directory, "npm");
  await writeFile(
    npmPath,
    `#!/bin/sh
printf '%s\\n' "$*" >> "$PUBLISH_TRACE_FILE"
if [ "$1" = "exec" ] && [ "$FAKE_PUBLISH_SCENARIO" = "deployment-failure" ]; then
  printf '%s\\n' "deployment stdout diagnostic" "$FAKE_STDOUT_DETAIL"
  printf '%s\\n' "$FAKE_FAILURE_DETAIL" >&2
  exit 17
fi
if [ "$1" = "run" ] && [ "$FAKE_PUBLISH_SCENARIO" = "probe-failure" ]; then
  printf '%s\\n' "probe stdout diagnostic" "$FAKE_STDOUT_DETAIL"
  printf '%s\\n' "$FAKE_FAILURE_DETAIL" >&2
  exit 23
fi
printf '%s\\n' "successful child output should stay hidden"
printf '%s\\n' "successful child stderr should stay hidden" >&2
exit 0
`,
    "utf8",
  );
  await chmod(npmPath, 0o755);

  return { directory, npmPath, tracePath };
}

function runPublisher({ npmPath, tracePath, scenario, detail = "", stdoutDetail = "", scriptPath = publisherPath, override = projectRef }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: rootDir,
      env: {
        ...process.env,
        PATH: `${path.dirname(npmPath)}${path.delimiter}${process.env.PATH ?? ""}`,
        PUBLISH_TRACE_FILE: tracePath,
        FAKE_PUBLISH_SCENARIO: scenario,
        FAKE_FAILURE_DETAIL: detail,
        FAKE_STDOUT_DETAIL: stdoutDetail,
        ...(override === null ? { SUPABASE_PROJECT_REF: undefined } : { SUPABASE_PROJECT_REF: override }),
        PUBLISH_TEST_SECRET: sensitiveValues[0],
        PUBLISH_TEST_TOKEN: sensitiveValues[1],
        PUBLISH_TEST_PASSWORD: sensitiveValues[2],
        PUBLISH_TEST_CREDENTIAL: sensitiveValues[3],
        PUBLISH_TEST_API_KEY: sensitiveValues[4],
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

async function isolatedPublisher(t, config) {
  const directory = await mkdtemp(path.join(tmpdir(), "publish-config-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, "scripts"));
  const scriptPath = path.join(directory, "scripts", "publish-competency-insight.mjs");
  await writeFile(scriptPath, await readFile(publisherPath));
  await writeFile(
    path.join(directory, "scripts", "subprocess-diagnostics.mjs"),
    await readFile(path.join(rootDir, "scripts", "subprocess-diagnostics.mjs")),
  );
  await symlink(path.join(rootDir, "node_modules"), path.join(directory, "node_modules"), "dir");
  if (config !== undefined) {
    await mkdir(path.join(directory, "supabase"));
    await writeFile(path.join(directory, "supabase", "config.toml"), config);
  }
  return scriptPath;
}

function assertConfigurationFailure(result, code, message) {
  assert.equal(result.status, 1);
  assert.equal(result.signal, null);
  assert.equal(result.stdout, "");
  const output = result.stderr;
  for (const value of [...sensitiveValues, projectRef]) {
    assert.equal(output.includes(value), false, "configuration error must not expose sensitive values");
  }
  assert.deepEqual(JSON.parse(output), {
    status: "failed",
    step: "configuration",
    reason: "competency_insight_publication_not_verified",
    diagnostics: { code, message },
  });
}

function readTomlSection(source, sectionName) {
  const lines = source.split(/\r?\n/);
  const sectionHeader = `[${sectionName}]`;
  const sectionStart = lines.findIndex((line) => line.trim() === sectionHeader);
  assert.notEqual(sectionStart, -1, `${sectionHeader} section is missing`);

  const sectionLines = [];
  for (const line of lines.slice(sectionStart + 1)) {
    if (/^\s*\[[^\]]+\]\s*$/.test(line)) break;
    sectionLines.push(line);
  }
  return sectionLines.join("\n");
}

function assertSanitizedOutput(result, expectedStep, exitCode) {
  assert.notEqual(result.status, 0);
  assert.equal(result.signal, null);
  const output = result.stdout + result.stderr;
  for (const value of sensitiveValues) {
    assert.equal(output.includes(value), false, `publisher output contains sensitive value: ${value}`);
  }
  assert.equal(output.includes(projectRef), false);
  const failure = JSON.parse(result.stderr);
  assert.equal(failure.status, "failed");
  assert.equal(failure.step, expectedStep);
  assert.equal(failure.reason, "competency_insight_publication_not_verified");
  assert.equal(failure.diagnostics.exitCode, exitCode);
  assert.match(failure.diagnostics.stderr, /AssertionError: published function did not respond/);
  assert.match(failure.diagnostics.stderr, /\[REDACTED\]/);
  assert.match(failure.diagnostics.stdout, /stdout diagnostic/);
  assert.match(failure.diagnostics.stdout, /\[REDACTED\]/);
  assert.equal(result.stdout, "");
}

test("release configuration keeps the insight publication gate", async () => {
  const [packageJsonSource, replitConfig] = await Promise.all([
    readFile(packageJsonPath, "utf8"),
    readFile(replitConfigPath, "utf8"),
  ]);
  const packageJson = JSON.parse(packageJsonSource);
  const releaseScript = packageJson.scripts?.release;
  const insightValidationScript = packageJson.scripts?.["test:insight:validate"];
  const validationAlias = packageJson.scripts?.["validate:insight"];
  const deploymentSection = readTomlSection(replitConfig, "deployment");
  const buildMatch = deploymentSection.match(/^\s*build\s*=\s*(.+?)\s*$/m);
  const releaseSteps = releaseScript?.split("&&").map((step) => step.trim());

  assert.ok(releaseScript, "package.json must define a release script");
  assert.equal(
    insightValidationScript,
    "node scripts/validate-competency-insight.mjs",
    "the standard insight validation must run both insight checks and stop on failure",
  );
  assert.equal(
    validationAlias,
    "npm run test:insight:validate",
    "the legacy validation command must point to the standard insight validation",
  );
  assert.ok(buildMatch, ".replit deployment section must define a build command");
  assert.deepEqual(JSON.parse(buildMatch[1]), ["npm", "run", "release"]);
  assert.deepEqual(
    releaseSteps,
    ["npm run test:insight:validate", "npm run build", "npm run publish:insight"],
    "the release script must run validation and propagate the insight publication result",
  );
});

test("unreadable configuration fails before deployment with a safe diagnosis", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const scriptPath = await isolatedPublisher(t);
  const result = await runPublisher({ ...fakeNpm, scriptPath });

  assertConfigurationFailure(result, "config_unreadable", "Cannot read supabase/config.toml");
  await assert.rejects(readFile(fakeNpm.tracePath), { code: "ENOENT" });
});

test("missing project_id fails before deployment without showing configuration contents", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const scriptPath = await isolatedPublisher(t, `other_setting = "${sensitiveValues[0]}"\n# ${sensitiveValues[4]}\n`);
  const result = await runPublisher({ ...fakeNpm, scriptPath });

  assertConfigurationFailure(result, "project_id_missing", "Missing project_id in supabase/config.toml");
  await assert.rejects(readFile(fakeNpm.tracePath), { code: "ENOENT" });
});

test("invalid, duplicate, nested, and damaged project configuration never starts deployment", async (t) => {
  for (const config of [
    'project_id = "invalid-ref"',
    `project_id = "${projectRef}"\nproject_id = "zyxwvutsrqponmlkjihg"`,
    `[other]\nproject_id = "${projectRef}"`,
    `[other.subsection]\nproject_id = "${projectRef}"`,
    `project_id = "${projectRef}"\nnot valid toml`,
    `project_id = "${projectRef}`,
    `project_id = "${projectRef}"\n[other]\nsecret = "${sensitiveValues[0]}"\ninvalid =`,
    `project_id = "${projectRef}"\n[other]\nsecret = "${sensitiveValues[0]}"\nsecret = "duplicate"`,
  ]) {
    const fakeNpm = await createFakeNpm(t);
    const scriptPath = await isolatedPublisher(t, config);
    const result = await runPublisher({ ...fakeNpm, scriptPath });
    assertConfigurationFailure(result, "config_invalid", "Invalid supabase/config.toml; expected one valid project_id");
    await assert.rejects(readFile(fakeNpm.tracePath), { code: "ENOENT" });
  }
});

test("a nested project_id cannot override or supply the deployment destination", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const scriptPath = await isolatedPublisher(t, `[other]\nproject_id = "${projectRef}"\nsecret = "${sensitiveValues[0]}"\n`);
  const result = await runPublisher({ ...fakeNpm, scriptPath, override: null });
  assertConfigurationFailure(result, "config_invalid", "Invalid supabase/config.toml; expected one valid project_id");
  await assert.rejects(readFile(fakeNpm.tracePath), { code: "ENOENT" });
});

test("an override cannot redirect deployment to another project", async (t) => {
  for (const override of ["zyxwvutsrqponmlkjihg", "not-a-valid-project-ref", ""]) {
    const fakeNpm = await createFakeNpm(t);
    const scriptPath = await isolatedPublisher(t, `project_id = "${projectRef}"\n`);
    const result = await runPublisher({ ...fakeNpm, scriptPath, override });
    if (override === "zyxwvutsrqponmlkjihg") {
      assertConfigurationFailure(result, "project_ref_mismatch", "SUPABASE_PROJECT_REF does not match supabase/config.toml");
    } else {
      assertConfigurationFailure(result, "project_ref_invalid", "SUPABASE_PROJECT_REF must be a valid project reference");
    }
    await assert.rejects(readFile(fakeNpm.tracePath), { code: "ENOENT" });
  }
});

test("a valid config deploys to its project without an override", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const scriptPath = await isolatedPublisher(t, `# Publication destination\nproject_id = '${projectRef}' # confirmed\n[api]\nenabled = true\n`);
  const result = await runPublisher({ ...fakeNpm, scriptPath, override: null });
  assert.equal(result.status, 0);
  assert.deepEqual(await readTrace(fakeNpm.tracePath), [
    `exec --yes -- supabase functions deploy competency-insight --project-ref ${projectRef} --use-api`,
    "run --silent test:insight:live",
  ]);
});

test("live probe runs only after a successful deployment", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const scriptPath = await isolatedPublisher(t, `project_id = "${projectRef}"\n`);
  const result = await runPublisher({ ...fakeNpm, scriptPath, scenario: "success" });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.deepEqual(await readTrace(fakeNpm.tracePath), [
    `exec --yes -- supabase functions deploy competency-insight --project-ref ${projectRef} --use-api`,
    "run --silent test:insight:live",
  ]);
  assert.deepEqual(JSON.parse(result.stdout), {
    status: "passed",
    function: "competency-insight",
    deployment: "active",
    liveProbe: "passed",
  });
});

test("deployment failure stops before the live probe and stays sanitized", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const scriptPath = await isolatedPublisher(t, `project_id = "${projectRef}"\n`);
  const result = await runPublisher({
    ...fakeNpm,
    scriptPath,
    scenario: "deployment-failure",
    detail: `AssertionError: published function did not respond ${sensitiveValues.join(" ")} ${projectRef}`,
    stdoutDetail: `Bearer ${sensitiveValues[4]} ${sensitiveValues[0]}`,
  });

  assertSanitizedOutput(result, "deployment", 17);
  assert.deepEqual(await readTrace(fakeNpm.tracePath), [
    `exec --yes -- supabase functions deploy competency-insight --project-ref ${projectRef} --use-api`,
  ]);
});

test("live probe failure fails publication and stays sanitized", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const scriptPath = await isolatedPublisher(t, `project_id = "${projectRef}"\n`);
  const result = await runPublisher({
    ...fakeNpm,
    scriptPath,
    scenario: "probe-failure",
    detail: `AssertionError: published function did not respond ${sensitiveValues.join(" ")} ${projectRef}`,
    stdoutDetail: `authorization: ${sensitiveValues[4]} ${sensitiveValues[0]}`,
  });

  assertSanitizedOutput(result, "live_probe", 23);
  assert.deepEqual(await readTrace(fakeNpm.tracePath), [
    `exec --yes -- supabase functions deploy competency-insight --project-ref ${projectRef} --use-api`,
    "run --silent test:insight:live",
  ]);
});

test("long failure output preserves final details without leaking a secret across the capture cutoff", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const scriptPath = await isolatedPublisher(t, `project_id = "${projectRef}"\n`);
  const result = await runPublisher({
    ...fakeNpm,
    scriptPath,
    scenario: "probe-failure",
    detail: `${"x".repeat(18_000)}${sensitiveValues[4]}${"y".repeat(16_380)}\nAssertionError: published function did not respond`,
    stdoutDetail: sensitiveValues[4].repeat(2_000),
  });

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  const output = result.stderr;
  for (const value of sensitiveValues) {
    assert.equal(output.includes(value), false);
  }
  assert.equal(output.includes("service-key-value-123"), false);
  const { diagnostics } = JSON.parse(output);
  assert.equal(diagnostics.exitCode, 23);
  assert.match(diagnostics.stderr, /^\[earlier output truncated\]/);
  assert.match(diagnostics.stderr, /AssertionError: published function did not respond$/);
  assert.ok(Buffer.byteLength(diagnostics.stderr) < 17 * 1024);
  assert.ok(Buffer.byteLength(diagnostics.stdout) < 17 * 1024);
});