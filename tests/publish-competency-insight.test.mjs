import assert from "node:assert/strict";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import test from "node:test";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publisherPath = path.join(rootDir, "scripts", "publish-competency-insight.mjs");
const packageJsonPath = path.join(rootDir, "package.json");
const replitConfigPath = path.join(rootDir, ".replit");
const projectRef = "publication-gate-test-ref";
const sensitiveValues = [
  "publication-gate-secret",
  '{"identity":"probe-user@example.test","payload":"private-probe-payload"}',
  "probe-user@example.test",
  "https://provider.example.test/recommendations",
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
  printf '%s\\n' "$FAKE_FAILURE_DETAIL" >&2
  exit 17
fi
if [ "$1" = "run" ] && [ "$FAKE_PUBLISH_SCENARIO" = "probe-failure" ]; then
  printf '%s\\n' "$FAKE_FAILURE_DETAIL" >&2
  exit 23
fi
exit 0
`,
    "utf8",
  );
  await chmod(npmPath, 0o755);

  return { directory, npmPath, tracePath };
}

function runPublisher({ npmPath, tracePath, scenario }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [publisherPath], {
      cwd: rootDir,
      env: {
        ...process.env,
        PATH: `${path.dirname(npmPath)}${path.delimiter}${process.env.PATH ?? ""}`,
        PUBLISH_TRACE_FILE: tracePath,
        FAKE_PUBLISH_SCENARIO: scenario,
        FAKE_FAILURE_DETAIL: sensitiveValues.join(" "),
        SUPABASE_PROJECT_REF: projectRef,
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

function assertSanitizedOutput(result) {
  assert.notEqual(result.status, 0);
  assert.equal(result.signal, null);
  const output = result.stdout + result.stderr;
  for (const value of sensitiveValues) {
    assert.equal(output.includes(value), false, `publisher output contains sensitive value: ${value}`);
  }
  assert.equal(output.includes(projectRef), false);
  assert.deepEqual(JSON.parse(result.stderr), {
    status: "failed",
    step: result.expectedStep,
    reason: "competency_insight_publication_not_verified",
  });
  assert.equal(result.stdout, "");
}

test("release configuration keeps the insight publication gate", async () => {
  const [packageJsonSource, replitConfig] = await Promise.all([
    readFile(packageJsonPath, "utf8"),
    readFile(replitConfigPath, "utf8"),
  ]);
  const packageJson = JSON.parse(packageJsonSource);
  const releaseScript = packageJson.scripts?.release;
  const deploymentSection = readTomlSection(replitConfig, "deployment");
  const buildMatch = deploymentSection.match(/^\s*build\s*=\s*(.+?)\s*$/m);
  const releaseSteps = releaseScript?.split("&&").map((step) => step.trim());

  assert.ok(releaseScript, "package.json must define a release script");
  assert.ok(buildMatch, ".replit deployment section must define a build command");
  assert.deepEqual(JSON.parse(buildMatch[1]), ["npm", "run", "release"]);
  assert.deepEqual(
    releaseSteps,
    ["npm run validate:insight", "npm run build", "npm run publish:insight"],
    "the release script must run validation and propagate the insight publication result",
  );
});

test("live probe runs only after a successful deployment", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const result = await runPublisher({ ...fakeNpm, scenario: "success" });

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
  const result = await runPublisher({ ...fakeNpm, scenario: "deployment-failure" });
  result.expectedStep = "deployment";

  assertSanitizedOutput(result);
  assert.deepEqual(await readTrace(fakeNpm.tracePath), [
    `exec --yes -- supabase functions deploy competency-insight --project-ref ${projectRef} --use-api`,
  ]);
});

test("live probe failure fails publication and stays sanitized", async (t) => {
  const fakeNpm = await createFakeNpm(t);
  const result = await runPublisher({ ...fakeNpm, scenario: "probe-failure" });
  result.expectedStep = "live_probe";

  assertSanitizedOutput(result);
  assert.deepEqual(await readTrace(fakeNpm.tracePath), [
    `exec --yes -- supabase functions deploy competency-insight --project-ref ${projectRef} --use-api`,
    "run --silent test:insight:live",
  ]);
});