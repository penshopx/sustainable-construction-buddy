import assert from "node:assert/strict";

// These values deliberately do not exist in the subprocess environment as secrets.
const parameters = [
  "X-Amz-Signature", "x-amz-credential", "X-Amz-Security-Token",
  "X-Goog-Signature", "X-Goog-Credential", "GoogleAccessId", "AWSAccessKeyId",
  "Signature", "sig", "Policy", "Key-Pair-Id", "token", "signed_token",
  "access_token", "refresh-token", "id_token", "jwt", "X%2DAmz%2DSignature",
  "SIGNATURE", "sig",
];
const secrets = parameters.map((_, index) => `signed-value-${index}-private%2Fpart%3D`);
export const signedUrl = `https://storage.example.test/private/video.mp4?mode=debug&${parameters.map((name, index) => `${name}=${secrets[index]}`).join("&")}&expires=3600#sig=fragment-private-value&section=details`;
export const signedAssertion = "AssertionError: signed URL request failed";

export const jsonUrlEncoders = [
  (url) => url.replaceAll("/", "\\/"),
  (url) => url.replaceAll("&", "\\u0026"),
  (url) => url.replaceAll("/", "\\/").replaceAll("&", "\\u0026"),
  (url) => url.replace(/[:/?=&#]/g, (character) =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`),
];

export function signedUrlDetail(truncated, overlap, encode) {
  const suffix = encode
    ? ` {"url":"${encode(signedUrl)}"} ${signedAssertion}`
    : ` ${signedUrl} ${signedAssertion}`;
  if (!truncated) return suffix.trimStart();
  const rawPrefix = "https://cutoff.example.test/video?X-Amz-Signature=cutoff-private-value";
  const prefix = encode ? `{"url":"${encode(rawPrefix)}` : rawPrefix;
  const cutoff = prefix.indexOf("cutoff-private-value") + 7;
  const captureBytes = 16 * 1024 + overlap;
  const padding = captureBytes - (prefix.length - cutoff) - suffix.length - 1;
  assert.ok(padding > 0);
  const detail = `${prefix}${"x".repeat(padding)}${suffix}`;
  // Force the raw capture boundary into a signature absent from the environment.
  assert.equal(Buffer.byteLength(`${detail}\n`) - captureBytes, cutoff);
  return detail;
}

export function assertSignedUrlDiagnostics(result, truncated) {
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  const failure = JSON.parse(result.stderr);
  for (const diagnostic of [failure.diagnostics.stdout, failure.diagnostics.stderr]) {
    assert.equal(diagnostic.includes("https://storage.example.test/private/video.mp4?mode=debug&"), true);
    for (const name of parameters) {
      assert.equal(diagnostic.includes(`${name}=[REDACTED]`), true, `${name} must be redacted`);
    }
    assert.equal(diagnostic.includes("&expires=3600#sig=[REDACTED]&section=details"), true);
    assert.equal(diagnostic.endsWith(signedAssertion), true);
    assert.equal(diagnostic.startsWith("[earlier output truncated]"), truncated);
    assert.ok(Buffer.byteLength(diagnostic) < 17 * 1024);
  }
  for (const secret of [...secrets, "fragment-private-value", "cutoff-private-value", "private-value", "cutoff.example.test"]) {
    assert.equal(result.stderr.includes(secret), false, `${secret} must not appear in the JSON log`);
  }
  return failure;
}
