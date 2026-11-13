import asyncHandler from "../utils/asyncHandler.js";
import {
  fetchAnalyticsOverview,
  rollupDailyAnalytics,
  formatDateKey,
} from "../services/analyticsService.js";

/**
 * @desc    Get store analytics overview (revenue, totalOrders, newCustomers, averageOrderValue, sales)
 * @route   GET /api/analytics
 * @access  Public / Admin
 */
export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const range = req.query.range || "7D";
  const data = await fetchAnalyticsOverview(range);

  return res.status(200).json({
    success: true,
    data,
  });
});

/**
 * @desc    Trigger a daily analytics rollup for a specific day or yesterday
 * @route   POST /api/analytics/rollup
 * @access  Admin / Internal Worker
 */
export const triggerDailyRollup = asyncHandler(async (req, res) => {
  let targetDateKey = req.body?.dateKey;

  // If no dateKey passed, default to yesterday (since yesterday is fully closed)
  if (!targetDateKey) {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    targetDateKey = formatDateKey(yesterday);
  }

  const result = await rollupDailyAnalytics(targetDateKey);

  return res.status(200).json({
    success: true,
    message: `Analytics snapshot for ${targetDateKey} processed successfully`,
    data: result,
  });
});

