import { rollupDailyAnalytics, formatDateKey } from "../services/analyticsService.js";
import logger from "../utils/logger.js";

/**
 * Runs a rollup for a target day (defaults to yesterday, since yesterday is closed).
 *
 * @param {string} [targetDateKey] - e.g. "2026-11-12"
 * @returns {Promise<any>}
 */
export const runDailyRollupJob = async (targetDateKey) => {
  let key = targetDateKey;
  if (!key) {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    key = formatDateKey(yesterday);
  }

  logger.info(`[AnalyticsWorker] Starting rollup job for dateKey: ${key}`);

  try {
    const record = await rollupDailyAnalytics(key);
    logger.info(`[AnalyticsWorker] Completed rollup for ${key}. Revenue: ${record.revenue}, Orders: ${record.totalOrders}`);
    return record;
  } catch (error) {
    logger.error(`[AnalyticsWorker] Failed rollup for ${key}: ${error.message}`);
    throw error;
  }
};

/**
 * Backfills rollups across a date range (inclusive).
 * Useful when setting up the store for the first time or re-syncing historical data.
 *
 * @param {string} startDateKey - "YYYY-MM-DD"
 * @param {string} endDateKey - "YYYY-MM-DD"
 * @returns {Promise<{ processed: number, failed: number }>}
 */
export const backfillAnalyticsRange = async (startDateKey, endDateKey) => {
  logger.info(`[AnalyticsWorker] Starting backfill from ${startDateKey} to ${endDateKey}`);

  // ──────────────────────────────────────────────────────────────────────────
  // TODO [YOUR PROBLEM-SOLVING PART 5]: Backfill loop
  //
  // Steps to solve:
  // 1. Iterate day by day from startDateKey to endDateKey:
  //    let current = new Date(startDateKey);
  //    while (formatDateKey(current) <= endDateKey) { ... current.setDate(...) }
  // 2. Call `await rollupDailyAnalytics(formatDateKey(current))` for each day
  // 3. Keep count of processed vs failed days and return summary
  // ──────────────────────────────────────────────────────────────────────────

  return { processed: 0, failed: 0 };
};

/**
 * Lightweight scheduler boilerplate using Node's standard interval/timeout.
 * (Can also be used with node-cron if you install it later: `0 0 * * *` at midnight).
 *
 * @param {{ intervalMs?: number }} options
 * @returns {{ stop: () => void }}
 */
export const startAnalyticsWorker = (options = {}) => {
  // Default to running check every 6 hours, or custom interval
  const intervalMs = options.intervalMs || 6 * 60 * 60 * 1000;

  logger.info(`[AnalyticsWorker] Scheduler active. Checking every ${intervalMs / 1000}s`);

  const timer = setInterval(async () => {
    try {
      await runDailyRollupJob();
    } catch (err) {
      logger.error(`[AnalyticsWorker] Scheduled run error: ${err.message}`);
    }
  }, intervalMs);

  return {
    stop: () => {
      clearInterval(timer);
      logger.info("[AnalyticsWorker] Scheduler stopped");
    },
  };
};

