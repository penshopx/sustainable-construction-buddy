import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { safeDiagnostic } from "../scripts/subprocess-diagnostics.mjs";

// The module snapshots sensitive environment values on import. A fresh process
// makes overlap sizes deterministic without inheriting real workspace secrets.
for (const credential of [
  "ENVHEAD-private-middle-ENVTAIL",
  `ENVHEAD-${"private-middle-".repeat(40)}ENVTAIL`,
  "ENVHEAD-rahasia-密碼-🔐-ENVTAIL",
]) {
  test(`controlled stream boundaries with ${Buffer.byteLength(credential)} bytes of secret overlap`, () => {
    const result = spawnSync(process.execPath, [
      "--test",
      fileURLToPath(new URL("./fixtures/subprocess-diagnostics-stream.mjs", import.meta.url)),
    ], {
      env: { DIAGNOSTIC_TEST_API_KEY: credential },
      encoding: "utf8",
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    });
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  });
}

test("redacts URL credentials without hiding harmless query parameters", () => {
  const text = [
    "GET https://example.test/path?view=summary&access_token=unlisted-credential-1&apikey=unlisted-credential-2#code=unlisted-credential-3",
    "GET https://example.test/next?PASSWORD=unlisted-credential-4&refresh_token=unlisted-credential-5",
  ].join("\n");
  const result = safeDiagnostic({ text, truncated: false });

  for (const value of ["unlisted-credential-1", "unlisted-credential-2", "unlisted-credential-3", "unlisted-credential-4", "unlisted-credential-5"]) {
    assert.equal(result.includes(value), false);
  }
  assert.match(result, /path\?view=summary&access_token=\[REDACTED\]&apikey=\[REDACTED\]#code=\[REDACTED\]/);
  assert.match(result, /next\?PASSWORD=\[REDACTED\]&refresh_token=\[REDACTED\]/);
});

test("strips terminal hyperlink, title, and color controls", () => {
  const text = "\x1b]8;;https://example.test/?access_token=hidden-in-control\x07click\x1b]8;;\x07 " +
    "\x1b]0;secret-title\x1b\\\x1b[31mAssertionError: safe message\x1b[0m";
  const result = safeDiagnostic({ text, truncated: false });

  assert.equal(result, "click AssertionError: safe message");
  assert.equal(result.includes("\x1b"), false);
  assert.equal(result.includes("hidden-in-control"), false);
  assert.equal(result.includes("secret-title"), false);
});

test("bounded nested URL decoding preserves harmless values and encoding boundaries", () => {
  const inner = "https://inner.example.test/video?view=summary&X-Amz-Signature=unlisted-nested-value&label=caf%C3%A9";
  const sanitized = inner.replace("unlisted-nested-value", "[REDACTED]");
  const encode = (value, layers) => {
    for (let layer = 0; layer < layers; layer += 1) value = encodeURIComponent(value);
    return value;
  };
  for (const layers of [1, 2, 3, 4]) {
    const text = `https://outer.example.test/error?url=${encode(inner, layers)}&label=a%20b&next=${encodeURIComponent("https://safe.example.test/path?view=summary")}`;
    assert.equal(
      safeDiagnostic({ text, truncated: false }),
      text.replace(encode(inner, layers), encode(sanitized, layers)),
    );
  }
  const tooDeep = `https://outer.example.test/error?url=${encode(inner, 5)}&view=summary`;
  assert.equal(
    safeDiagnostic({ text: tooDeep, truncated: false }),
    "https://outer.example.test/error?url=[REDACTED]&view=summary",
  );
});

test("nested destinations cannot decode controls or quotes into the surrounding diagnostic", () => {
  const inner = "https://inner.example.test/video?sig=unlisted-nested-value&label=%22%0A%1B";
  const text = `{"url":"https://outer.example.test/?redirect=${encodeURIComponent(inner)}","message":"keep this error"}`;
  const result = safeDiagnostic({ text, truncated: false });
  const parsed = JSON.parse(result);
  assert.equal(parsed.message, "keep this error");
  assert.equal(parsed.url.includes(encodeURIComponent(inner.replace("unlisted-nested-value", "[REDACTED]"))), true);
  assert.equal(result.includes("unlisted-nested-value"), false);
  assert.doesNotMatch(result, /[\x00-\x1f]/);
});

test("inspects the complete decoded URL even with quotes or whitespace before the signature", () => {
  for (const path of ["owner's", 'owner"s', "owner s", "owner<s", "owner\ns"]) {
    const inner = `https://storage.example.test/${path}/video?X-Amz-Signature=private-value&mode=debug`;
    const text = `https://gateway.example.test/error?redirect=${encodeURIComponent(inner).replaceAll("'", "%27")}&view=summary`;
    const result = safeDiagnostic({ text, truncated: false });
    assert.equal(decodeURIComponent(result).includes("private-value"), false);
    assert.equal(result, `https://gateway.example.test/error?redirect=${encodeURIComponent(inner.replace("private-value", "[REDACTED]"))}&view=summary`);
  }
});

test("literal apostrophes from encodeURIComponent do not hide a nested signature or consume surrounding log text", () => {
  for (const path of ["owner's", "owner''s", "owner'", "'s"]) {
    const inner = `https://storage.example.test/${path}/video?X-Amz-Signature=private-value&mode=debug`;
    const url = `https://gateway.example.test/error?redirect=${encodeURIComponent(inner)}&view=summary`;
    const expected = url.replace(encodeURIComponent(inner), encodeURIComponent(inner.replace("private-value", "[REDACTED]")));
    for (const [prefix, suffix] of [
      ["", " AssertionError: keep this error"],
      ['{"url":"', '","message":"keep this error"}'],
      ["{'url':'", "','message':'keep this error'}"],
      ["request '", "' AssertionError: keep this error"],
    ]) {
      const result = safeDiagnostic({ text: `${prefix}${url}${suffix}`, truncated: false });
      assert.equal(decodeURIComponent(result).includes("private-value"), false);
      assert.equal(result, `${prefix}${expected}${suffix}`);
    }
  }
});

test("drops a partial URL at a truncated capture boundary but keeps the final error", () => {
  const result = safeDiagnostic({
    text: "partial-unknown-credential".repeat(1000) + "\nGET https://example.test/?access_token=another-unknown-credential\nAssertionError: final detail",
    truncated: true,
  });
  assert.match(result, /^\[earlier output truncated\]/);
  assert.match(result, /AssertionError: final detail$/);
  assert.equal(result.includes("partial-unknown-credential"), false);
  assert.equal(result.includes("another-unknown-credential"), false);
});