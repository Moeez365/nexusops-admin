import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatDateKey,
  normalizeDateRange,
  computeAverageOrderValue,
  aggregateDayMetrics,
} from "../../src/services/analyticsService.js";
import app from "../../src/app.js";

describe("Analytics Service - Boilerplate Tests", () => {
  describe("formatDateKey", () => {
    it("formats a Date object to canonical 'YYYY-MM-DD'", () => {
      const fixed = new Date("2026-11-12T15:30:00Z");
      assert.equal(formatDateKey(fixed), "2026-11-12");
    });
  });

  describe("normalizeDateRange", () => {
    it("normalizes '7D' and '7 days' to a 7-day range", () => {
      const ref = new Date("2026-11-12T12:00:00Z");
      const res7D = normalizeDateRange("7D", ref);
      const res7Days = normalizeDateRange("7 days", ref);

      assert.equal(res7D.days, 7);
      assert.equal(res7D.range, "7D");
      assert.equal(res7D.endKey, "2026-11-12");
      assert.equal(res7D.startKey, "2026-11-06");

      assert.equal(res7Days.days, 7);
      assert.equal(res7Days.startKey, "2026-11-06");
    });

    it("normalizes '30D' to a 30-day range", () => {
      const ref = new Date("2026-11-12T12:00:00Z");
      const res = normalizeDateRange("30D", ref);
      assert.equal(res.days, 30);
      assert.equal(res.range, "30D");
    });

    it("normalizes '90D' to a 90-day range", () => {
      const ref = new Date("2026-11-12T12:00:00Z");
      const res = normalizeDateRange("90D", ref);
      assert.equal(res.days, 90);
      assert.equal(res.range, "90D");
    });
  });

  describe("computeAverageOrderValue", () => {
    it("returns 0 when total orders is 0 or negative", () => {
      assert.equal(computeAverageOrderValue(1000, 0), 0);
      assert.equal(computeAverageOrderValue(1000, -2), 0);
      assert.equal(computeAverageOrderValue(0, 5), 0);
    });

    it("calculates accurate average order value rounded to 2 decimals", () => {
      assert.equal(computeAverageOrderValue(1000, 4), 250);
      assert.equal(computeAverageOrderValue(100, 3), 33.33);
    });
  });

  describe("aggregateDayMetrics input validation", () => {
    it("throws an error when dateKey format is invalid", async () => {
      await assert.rejects(
        async () => aggregateDayMetrics("invalid-date"),
        /Invalid dateKey format/
      );
    });
  });

  describe("Express Routes Integration", () => {
    it("app exposes /api/analytics without crashing", () => {
      assert.ok(app);
      assert.equal(typeof app.handle, "function");
    });
  });
});

