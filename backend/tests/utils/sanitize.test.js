import test from "node:test";
import assert from "node:assert/strict";
import { escapeRegex } from "../../src/utils/sanitize.js";

test("escapeRegex escapes special regex characters", () => {
  const unsafe = "hello [world] (test) * + ? ^ $ { } | \\";
  const escaped = escapeRegex(unsafe);
  assert.strictEqual(
    escaped,
    "hello \\[world\\] \\(test\\) \\* \\+ \\? \\^ \\$ \\{ \\} \\| \\\\"
  );
});

test("escapeRegex handles null, undefined, or empty strings gracefully", () => {
  assert.strictEqual(escapeRegex(""), "");
  assert.strictEqual(escapeRegex(null), "null");
  assert.strictEqual(escapeRegex(undefined), "");
});

