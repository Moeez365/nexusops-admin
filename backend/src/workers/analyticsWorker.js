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
 * Backfills rollups across a date range (inclusive) in UTC.
 *
 * @param {string} startDateKey - "YYYY-MM-DD"
 * @param {string} endDateKey - "YYYY-MM-DD"
 * @returns {Promise<{ processed: number, failed: number }>}
 */
export const backfillAnalyticsRange = async (startDateKey, endDateKey) => {
  if (!startDateKey || !endDateKey || startDateKey > endDateKey) {
    throw new Error(`Invalid backfill range "${startDateKey}" to "${endDateKey}"`);
  }

  logger.info(`[AnalyticsWorker] Starting backfill from ${startDateKey} to ${endDateKey}`);

  let processed = 0;
  let failed = 0;
  const [y, m, d] = startDateKey.split("-").map(Number);
  const current = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  while (formatDateKey(current) <= endDateKey) {
    const key = formatDateKey(current);
    try {
      await rollupDailyAnalytics(key);
      processed += 1;
    } catch (err) {
      failed += 1;
      logger.error(`[AnalyticsWorker] Backfill failed for ${key}: ${err.message}`);
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  logger.info(`[AnalyticsWorker] Backfill finished. Processed: ${processed}, Failed: ${failed}`);
  return { processed, failed };
};

/**
 * Runs rollups for both yesterday (closed day) and today (live day),
 * guarded against overlapping executions.
 *
 * @param {{ intervalMs?: number }} options
 * @returns {{ stop: () => void }}
 */
export const startAnalyticsWorker = (options = {}) => {
  const intervalMs = options.intervalMs || 6 * 60 * 60 * 1000;
  let isRunning = false;

  const executeCycle = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      const todayKey = formatDateKey(new Date());
      await runDailyRollupJob(); // Yesterday
      await runDailyRollupJob(todayKey); // Today
    } catch (err) {
      logger.error(`[AnalyticsWorker] Scheduled run error: ${err.message}`);
    } finally {
      isRunning = false;
    }
  };

  logger.info(`[AnalyticsWorker] Scheduler active. Checking every ${intervalMs / 1000}s`);
  executeCycle();

  const timer = setInterval(executeCycle, intervalMs);

  return {
    stop: () => {
      clearInterval(timer);
      logger.info("[AnalyticsWorker] Scheduler stopped");
    },
  };
};
