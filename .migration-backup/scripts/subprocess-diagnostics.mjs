const maxDiagnosticBytes = 16 * 1024;
const sensitiveValues = Object.entries(process.env)
  .filter(([name, value]) =>
    (/(?:SECRET|TOKEN|PASSWORD|PASSWD|KEY|CREDENTIAL|DATABASE_URL|AUTHORIZATION)/i.test(name) ||
      name === "SUPABASE_PROJECT_REF") &&
    value && value.length >= 4)
  .map(([, value]) => value)
  .sort((a, b) => b.length - a.length);
// Retain enough overlap to redact a value crossing the capture cutoff.
const maxSensitiveBytes = Math.max(0, ...sensitiveValues.map((value) => Buffer.byteLength(value)));
const maxCaptureBytes = maxDiagnosticBytes + maxSensitiveBytes;

export function captureOutput(stream) {
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

export function safeDiagnostic({ text, truncated }) {
  // Terminal escapes and control characters should not affect CI logs.
  let output = text.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "").replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
  for (const value of sensitiveValues) {
    output = output.replaceAll(value, "[REDACTED]");
  }
  output = output
    .replace(/(Bearer\s+)[^\s"']+/gi, "$1[REDACTED]")
    .replace(/((?:password|token|secret|api[_-]?key|authorization)\s*[:=]\s*["']?)[^\s"',}]+/gi, "$1[REDACTED]")
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, "$1[REDACTED]@");
  if (truncated) {
    // The buffer may begin inside a sensitive value. Remove the overlap after redaction.
    output = Buffer.from(output).subarray(maxSensitiveBytes).toString("utf8");
  }
  const bytes = Buffer.from(output);
  if (bytes.length > maxDiagnosticBytes) {
    output = bytes.subarray(-maxDiagnosticBytes).toString("utf8");
    truncated = true;
  }
  return `${truncated ? "[earlier output truncated]\n" : ""}${output.trim()}`;
}