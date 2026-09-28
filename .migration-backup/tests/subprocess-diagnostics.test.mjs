import assert from "node:assert/strict";
import test from "node:test";
import { safeDiagnostic } from "../scripts/subprocess-diagnostics.mjs";

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