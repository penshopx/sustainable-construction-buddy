const { spawn } = require("node:child_process");

const STARTUP_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 250;
const frontendUrl = "http://127.0.0.1:5000/";
const healthUrl = "http://127.0.0.1:3001/api/health";
const apiReadyPattern = /API server running on port 3001/;
const frontendReadyPattern = /Local:\s+http:\/\/localhost:5000\//;

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const devProcess = spawn(npmCommand, ["run", "dev"], {
  cwd: process.cwd(),
  detached: process.platform !== "win32",
  stdio: ["ignore", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";
devProcess.stdout.setEncoding("utf8");
devProcess.stderr.setEncoding("utf8");
devProcess.stdout.on("data", (chunk) => {
  stdout += chunk;
});
devProcess.stderr.on("data", (chunk) => {
  stderr += chunk;
});

function stopDevProcess() {
  if (devProcess.exitCode !== null || devProcess.signalCode !== null) return;

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(devProcess.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  } else {
    try {
      process.kill(-devProcess.pid, "SIGTERM");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
}

async function checkEndpoints() {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let lastError = "servers are still starting";

  while (Date.now() < deadline) {
    if (devProcess.exitCode !== null || devProcess.signalCode !== null) {
      throw new Error("npm run dev exited before both servers became ready");
    }

    try {
      if (!apiReadyPattern.test(stdout) || !frontendReadyPattern.test(stdout)) {
        throw new Error("npm run dev has not confirmed ports 3001 and 5000 yet");
      }

      const [frontendResponse, healthResponse] = await Promise.all([
        fetch(frontendUrl),
        fetch(healthUrl),
      ]);

      if (frontendResponse.status !== 200) {
        throw new Error(`frontend returned HTTP ${frontendResponse.status}`);
      }

      if (healthResponse.status !== 200) {
        throw new Error(`health endpoint returned HTTP ${healthResponse.status}`);
      }

      const healthBody = await healthResponse.json();
      if (healthBody.status !== "ok") {
        throw new Error(`health endpoint returned ${JSON.stringify(healthBody)}`);
      }

      return;
    } catch (error) {
      lastError = error.message;
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  throw new Error(`startup smoke test timed out: ${lastError}`);
}

async function main() {
  try {
    await checkEndpoints();
    console.log("Startup smoke test passed: frontend 200 on port 5000; API health ok on port 3001.");
  } catch (error) {
    console.error(`Startup smoke test failed: ${error.message}`);
    if (stdout.trim()) console.error("\n--- npm run dev stdout ---\n" + stdout.trim());
    if (stderr.trim()) console.error("\n--- npm run dev stderr ---\n" + stderr.trim());
    process.exitCode = 1;
  } finally {
    stopDevProcess();
  }
}

main();