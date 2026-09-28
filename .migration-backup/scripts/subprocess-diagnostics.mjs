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
  // Remove whole terminal control sequences, including OSC hyperlinks and titles.
  let output = text
    .replace(/\x1b\][\s\S]*?(?:\x07|\x1b\\|$)/g, "")
    .replace(/\x1b[P^_X][\s\S]*?(?:\x07|\x1b\\|$)/g, "")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\x1b[@-_]/g, "")
    .replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g, "");
  if (truncated) {
    // Drop the overlap on raw bytes, then the incomplete first token. This
    // protects unknown URL credentials too, without losing a later assertion
    // on the same line.
    output = Buffer.from(output).subarray(maxSensitiveBytes).toString("utf8");
    const nextBoundary = output.search(/\s/);
    output = nextBoundary === -1 ? "" : output.slice(nextBoundary + 1);
  }
  for (const value of sensitiveValues) {
    output = output.replaceAll(value, "[REDACTED]");
  }
  output = output
    .replace(/(Bearer\s+)[^\s"']+/gi, "$1[REDACTED]")
    .replace(/((?:password|token|secret|api[_-]?key|authorization)\s*[:=]\s*["']?)[^\s"',}&#]+/gi, "$1[REDACTED]")
    .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, "$1[REDACTED]@");
  // A child process may print a URL with a credential not present in our environment.
  // Preserve the URL and harmless parameters so the failure remains actionable.
  output = output.replace(/https?:\/\/[^\s"'<>]+/gi, (url) =>
    url.replace(
      /([?&#](?:access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|password|passwd|secret|client[_-]?secret|authorization|auth[_-]?code|code)=)[^&#\s"'<>]*/gi,
      "$1[REDACTED]",
    ));
  const bytes = Buffer.from(output);
  if (bytes.length > maxDiagnosticBytes) {
    output = bytes.subarray(-maxDiagnosticBytes).toString("utf8");
    truncated = true;
  }
  return `${truncated ? "[earlier output truncated]\n" : ""}${output.trim()}`;
}