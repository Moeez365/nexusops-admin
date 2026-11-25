import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TIME_RANGES,
  RANGE_TELEMETRY,
  TODAYS_ANALYTICS_DATA,
  ANALYTICS_PERIODS,
  ANALYTICS_DATA_BY_PERIOD,
} from "../../constants/analytics.js";

describe("Analytics Range Telemetry", () => {
  it("exports required range options", () => {
    assert.deepEqual(TIME_RANGES, ["24H", "7D", "1M", "1Y"]);
  });

  it("configures 24H range with hourly breakdown and peak", () => {
    const data24H = RANGE_TELEMETRY["24H"];
    assert.ok(data24H);
    assert.equal(data24H.period, "vs yesterday");
    assert.equal(data24H.revenueBars.length, 7);
    assert.equal(data24H.revenueBars[0].label, "00:00");
    assert.equal(data24H.revenueBars[data24H.revenueBars.length - 1].label, "23:59");
    assert.ok(data24H.revenueBars.some((b) => b.active));
    assert.ok(data24H.velocityPoints.length >= 7);
  });

  it("configures 7D range with daily breakdown", () => {
    const data7D = RANGE_TELEMETRY["7D"];
    assert.ok(data7D);
    assert.equal(data7D.period, "vs last week");
    assert.equal(data7D.revenueBars.length, 7);
    assert.equal(data7D.revenueBars[0].label, "Mon");
    assert.equal(data7D.revenueBars[data7D.revenueBars.length - 1].label, "Sun");
  });

  it("configures 1M range with 4-day interval daily breakdown", () => {
    const data1M = RANGE_TELEMETRY["1M"];
    assert.ok(data1M);
    assert.equal(data1M.period, "vs last month");
    assert.equal(data1M.revenueBars.length, 8);
    assert.equal(data1M.revenueBars[0].label, "Day 04");
    assert.equal(data1M.revenueBars[data1M.revenueBars.length - 1].label, "Day 30");
    assert.ok(data1M.revenueBars.some((b) => b.active));
    assert.equal(data1M.velocityPoints.length, 8);
  });

  it("configures 1Y range with 12 monthly intervals", () => {
    const data1Y = RANGE_TELEMETRY["1Y"];
    assert.ok(data1Y);
    assert.equal(data1Y.period, "vs last year");
    assert.equal(data1Y.revenueBars.length, 12);
    assert.equal(data1Y.revenueBars[0].label, "Jan");
    assert.equal(data1Y.revenueBars[11].label, "Dec");
  });

  it("exports backend-shaped TODAYS_ANALYTICS_DATA with 24 hourly trend points", () => {
    assert.ok(TODAYS_ANALYTICS_DATA);
    assert.equal(TODAYS_ANALYTICS_DATA.kpiCards.length, 4);
    assert.equal(TODAYS_ANALYTICS_DATA.todaysTrends.length, 24);
    assert.equal(TODAYS_ANALYTICS_DATA.todaysTrends[0].hour, "0");
    assert.equal(TODAYS_ANALYTICS_DATA.todaysTrends[23].hour, "23");
    assert.equal(typeof TODAYS_ANALYTICS_DATA.todaysTrends[0].today, "number");
    assert.equal(TODAYS_ANALYTICS_DATA.todaysTrends[23].today, null);
    assert.equal(typeof TODAYS_ANALYTICS_DATA.todaysTrends[23].yesterday, "number");
    assert.ok(TODAYS_ANALYTICS_DATA.orderVelocity.length >= 6);
  });

  it("exports ANALYTICS_DATA_BY_PERIOD for Today, This Month, and This Year", () => {
    assert.deepEqual(
      ANALYTICS_PERIODS.map((p) => p.id),
      ["today", "this_month", "this_year"]
    );
    assert.equal(ANALYTICS_DATA_BY_PERIOD.today.trends.length, 24);
    assert.equal(ANALYTICS_DATA_BY_PERIOD.this_month.trends.length, 30);
    assert.equal(ANALYTICS_DATA_BY_PERIOD.this_year.trends.length, 12);

    for (const period of ANALYTICS_PERIODS) {
      const payload = ANALYTICS_DATA_BY_PERIOD[period.id];
      assert.equal(payload.kpiCards.length, 4);
      assert.ok(payload.orderVelocity.length >= 6);
    }
  });
});

