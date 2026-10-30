import test from "node:test";
import assert from "node:assert/strict";
import { formatCurrency, formatNumber, formatDate, slugify } from "../formatters.js";

test("formatCurrency formats standard USD currency", () => {
  assert.strictEqual(formatCurrency(1250), "$1,250.00");
  assert.strictEqual(formatCurrency(0), "$0.00");
});

test("formatCurrency handles NaN or invalid inputs with fallback", () => {
  assert.strictEqual(formatCurrency("invalid_number"), "$0.00");
});

test("formatNumber adds thousands separators", () => {
  assert.strictEqual(formatNumber(1420), "1,420");
  assert.strictEqual(formatNumber("1000000"), "1,000,000");
  assert.strictEqual(formatNumber("abc"), "0");
});

test("slugify produces SEO-friendly URL slugs with ampersand conversion", () => {
  assert.strictEqual(slugify("Haute Horlogerie 2026!"), "haute-horlogerie-2026");
  assert.strictEqual(slugify("  Special   Characters & Co.  "), "special-characters-and-co");
});

test("formatDate returns dash placeholder for empty input", () => {
  assert.strictEqual(formatDate(null), "—");
  assert.strictEqual(formatDate(undefined), "—");
});
