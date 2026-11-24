import DailyAnalytics from "../models/dailyAnalyticsModel.js";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";

/**
 * Format a Date object into a canonical "YYYY-MM-DD" string (UTC).
 *
 * @param {Date} date
 * @returns {string} e.g. "2026-11-12"
 */
export const formatDateKey = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Parses user-facing time range strings into UTC start and end bounds.
 *
 * Supported inputs:
 *  - "7D" or "7 days"   -> last 7 days
 *  - "30D" or "30 days" -> last 30 days
 *  - "90D" or "90 days" -> last 90 days
 *  - "today" or "1D"    -> current day
 *
 * @param {string} rangeString
 * @param {Date} [referenceDate=new Date()]
 * @returns {{
 *   range: string,
 *   days: number,
 *   startDate: Date,
 *   endDate: Date,
 *   startKey: string,
 *   endKey: string
 * }}
 */
export const normalizeDateRange = (
  rangeString = "7D",
  referenceDate = new Date(),
) => {
  const normalized = String(rangeString || "7D")
    .trim()
    .toUpperCase();

  let days = 7;
  if (normalized === "30D" || normalized === "30 DAYS") days = 30;
  else if (normalized === "90D" || normalized === "90 DAYS") days = 90;
  else if (normalized === "1D" || normalized === "TODAY") days = 1;
  else if (normalized === "7D" || normalized === "7 DAYS") days = 7;

  const endDate = new Date(referenceDate);
  endDate.setUTCHours(23, 59, 59, 999);

  const startDate = new Date(referenceDate);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  startDate.setUTCHours(0, 0, 0, 0);

  return {
    range: `${days}D`,
    days,
    startDate,
    endDate,
    startKey: formatDateKey(startDate),
    endKey: formatDateKey(endDate),
  };
};

/**
 * Safely computes average order value without division by zero.
 *
 * @param {number} revenue
 * @param {number} totalOrders
 * @returns {number}
 */
export const computeAverageOrderValue = (revenue = 0, totalOrders = 0) => {
  if (!totalOrders || totalOrders <= 0 || !revenue || revenue <= 0) {
    return 0;
  }
  return Number((revenue / totalOrders).toFixed(2));
};

/**
 * Calculates raw metrics for a single calendar day (YYYY-MM-DD).
 * Aggregates revenue, order counts, sales units, and new customer registrations.
 *
 * @param {string} dateKey - "YYYY-MM-DD"
 * @returns {Promise<{
 *   dateKey: string,
 *   date: Date,
 *   revenue: number,
 *   totalOrders: number,
 *   newCustomers: number,
 *   averageOrderValue: number,
 *   sales: number
 * }>}
 */
export const aggregateDayMetrics = async (dateKey) => {
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error(`Invalid dateKey format "${dateKey}". Expected YYYY-MM-DD`);
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  // 1. Aggregate revenue, orders count, and total units sold for this day
  const [orderSummary] = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: dayStart, $lte: dayEnd },
        status: { $ne: "Cancelled" },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$total" },
        totalOrders: { $sum: 1 },
        totalSales: { $sum: { $sum: "$items.quantity" } },
      },
    },
  ]);

  const revenue = orderSummary?.totalRevenue || 0;
  const totalOrders = orderSummary?.totalOrders || 0;
  const sales = orderSummary?.totalSales || 0;

  // 2. Count new customer accounts registered on this day
  const newCustomers = await User.countDocuments({
    createdAt: { $gte: dayStart, $lte: dayEnd },
  });

  // 3. Compute safe average order value
  const averageOrderValue = computeAverageOrderValue(revenue, totalOrders);

  return {
    dateKey,
    date: dayStart,
    revenue,
    totalOrders,
    newCustomers,
    averageOrderValue,
    sales,
  };
};

/**
 * Idempotently computes and persists one day's snapshot into `DailyAnalytics`.
 *
 * Using `findOneAndUpdate` with `upsert: true` ensures that re-running
 * this worker multiple times updates the existing record instead of creating duplicates.
 *
 * @param {string} dateKey - "YYYY-MM-DD"
 * @returns {Promise<any>} The saved DailyAnalytics document
 */
export const rollupDailyAnalytics = async (dateKey) => {
  const metrics = await aggregateDayMetrics(dateKey);

  const savedRecord = await DailyAnalytics.findOneAndUpdate(
    { dateKey: metrics.dateKey },
    {
      $set: {
        ...metrics,
        lastAggregatedAt: new Date(),
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  return savedRecord;
};

/**
 * Fetch overview analytics across a requested time range (e.g. "7D", "30D", "90D").
 *
 * Combines pre-aggregated historical days with live data for today so the
 * dashboard is always up to the minute.
 *
 * @param {string} [range="7D"] - "7D", "30D", "90D", "today"
 * @returns {Promise<{
 *   timeRange: string,
 *   startDate: Date,
 *   endDate: Date,
 *   revenue: number,
 *   totalOrders: number,
 *   newCustomers: number,
 *   averageOrderValue: number,
 *   sales: number
 * }>}
 */

export const fetchDailyAnalytics = async () => {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 1. Fetch non-cancelled orders from the last 24 hours
  const orders = await Order.find({
    createdAt: { $gte: last24Hours },
    status: { $ne: "Cancelled" },
  })
    .select("total items createdAt")
    .lean();

  // 2. Prepare the time slots matching the frontend revenueBars format
  const buckets = [
    { day: "00:00", label: "00:00", revenue: 0, amount: "$0", orders: 0, active: false },
    { day: "04:00", label: "04:00", revenue: 0, amount: "$0", orders: 0, active: false },
    { day: "08:00", label: "08:00", revenue: 0, amount: "$0", orders: 0, active: false },
    { day: "12:00", label: "12:00", revenue: 0, amount: "$0", orders: 0, active: false },
    { day: "16:00", label: "16:00", revenue: 0, amount: "$0", orders: 0, active: false },
    { day: "20:00", label: "20:00", revenue: 0, amount: "$0", orders: 0, active: false },
    { day: "23:59", label: "23:59", revenue: 0, amount: "$0", orders: 0, active: false },
  ];

  let totalRevenue = 0;
  let totalUnits = 0;

  // 3. Add each order into the overall totals and its matching bucket
  for (const order of orders) {
    const orderTotal = order.total || 0;
    const orderUnits = Array.isArray(order.items)
      ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
      : 0;

    totalRevenue += orderTotal;
    totalUnits += orderUnits;

    const hour = new Date(order.createdAt).getUTCHours();
    const bucketIndex = hour === 23 ? 6 : Math.floor(hour / 4);

    if (buckets[bucketIndex]) {
      buckets[bucketIndex].revenue += orderTotal;
      buckets[bucketIndex].orders += 1;
    }
  }

  // 4. Format amount labels and mark the highest-revenue bucket as active
  let peakRevenue = 0;
  let peakIndex = -1;

  buckets.forEach((bucket, index) => {
    bucket.amount =
      bucket.revenue >= 1000
        ? `$${(bucket.revenue / 1000).toFixed(1)}k`
        : `$${bucket.revenue}`;

    if (bucket.revenue > peakRevenue) {
      peakRevenue = bucket.revenue;
      peakIndex = index;
    }
  });

  if (peakIndex !== -1) {
    buckets[peakIndex].active = true;
  }

  return {
    timeRange: "24H",
    totalRevenue,
    totalOrders: orders.length,
    totalUnits,
    buckets,
  };
};


export const fetchAnalyticsOverview = async (range = "7D") => {
  const bounds = normalizeDateRange(range);

  // 1. Fetch pre-aggregated snapshots for past closed days
  const [pastDays] = await DailyAnalytics.aggregate([
    {
      $match: {
        dateKey: {
          $lte: bounds.endKey,
          $gte: bounds.startKey,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$revenue" },
        totalSales: { $sum: "$sales" },
        totalOrders: { $sum: "$totalOrders" },
        newCustomers: { $sum: "$newCustomers" },
      },
    },
    {
      $project: {
        _id: 0, // Strip _id: null from the final object
        totalRevenue: 1,
        totalSales: 1,
        totalOrders: 1,
        newCustomers: 1,
      },
    },
  ]);

  const orderTotals = pastDays || {
    totalRevenue: 0,
    totalSales: 0,
    totalOrders: 0,
    newCustomers: 0,
  };

  // 2. Accurately compute Average Order Value for the entire range (never sum daily AOVs)
  const averageOrderValue = computeAverageOrderValue(
    orderTotals.totalRevenue,
    orderTotals.totalOrders,
  );

  return {
    timeRange: bounds.range,
    startDate: bounds.startDate,
    endDate: bounds.endDate,
    revenue: orderTotals.totalRevenue,
    totalOrders: orderTotals.totalOrders,
    newCustomers: orderTotals.newCustomers,
    averageOrderValue,
    sales: orderTotals.totalSales,
  };
};
