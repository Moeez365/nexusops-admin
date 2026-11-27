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
  else if (normalized === "12M" || normalized === "12 MONTHS") days = 365;
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
    const err = new Error(`Invalid dateKey format "${dateKey}". Expected YYYY-MM-DD`);
    err.statusCode = 400;
    throw err;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const dayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  // Verify calendar validity (e.g. reject 2026-02-31 overflowing to 2026-03-03)
  if (
    dayStart.getUTCFullYear() !== year ||
    dayStart.getUTCMonth() !== month - 1 ||
    dayStart.getUTCDate() !== day
  ) {
    const err = new Error(`Invalid calendar date "${dateKey}"`);
    err.statusCode = 400;
    throw err;
  }


  // Run order aggregation and new customer count in parallel
  const [[orderSummary], newCustomers] = await Promise.all([
    Order.aggregate([
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
    ]),
    User.countDocuments({
      createdAt: { $gte: dayStart, $lte: dayEnd },
    }),
  ]);

  const revenue = orderSummary?.totalRevenue || 0;
  const totalOrders = orderSummary?.totalOrders || 0;
  const sales = orderSummary?.totalSales || 0;

  // Compute safe average order value
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
  const todayDate = new Date();
  todayDate.setUTCHours(0, 0, 0, 0);

  const yesterDay = new Date(todayDate);
  yesterDay.setUTCDate(yesterDay.getUTCDate() - 1);

  const [[res], todayCustomers, yesterdayCustomers] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterDay },
          status: { $ne: "Cancelled" },
        },
      },
      {
        $facet: {
          todayStats: [
            { $match: { createdAt: { $gte: todayDate } } },
            {
              $group: {
                _id: { $hour: { date: "$createdAt", timezone: "UTC" } },
                revenue: { $sum: "$total" },
                orders: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          yesterdayStats: [
            { $match: { createdAt: { $gte: yesterDay, $lt: todayDate } } },
            {
              $group: {
                _id: { $hour: { date: "$createdAt", timezone: "UTC" } },
                revenue: { $sum: "$total" },
                orders: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]),
    User.countDocuments({ createdAt: { $gte: todayDate } }),
    User.countDocuments({ createdAt: { $gte: yesterDay, $lt: todayDate } }),
  ]);

  const todayMap = new Map(
    (res?.todayStats || []).map((item) => [item._id, item]),
  );
  const yesterdayMap = new Map(
    (res?.yesterdayStats || []).map((item) => [item._id, item]),
  );
  const currentUtcHour = new Date().getUTCHours();
  const todaysTrends = Array.from({ length: 24 }, (_, hour) => {
    const todayEntry = todayMap.get(hour);
    const yesterdayEntry = yesterdayMap.get(hour);

    return {
      label: String(hour),
      current: hour <= currentUtcHour ? todayEntry?.revenue || 0 : null,
      previous: yesterdayEntry?.revenue || 0,
      todayOrders: hour <= currentUtcHour ? todayEntry?.orders || 0 : null,
      yesterdayOrders: yesterdayEntry?.orders || 0,
    };
  });
  return {
    todayStats: res?.todayStats || [],
    yesterdayStats: res?.yesterdayStats || [],
    todayCustomers,
    yesterdayCustomers,
    todaysTrends,
  };
};

export const fetchAnalytics = async () => {
  const now = new Date();
  const firstDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));

  const [res] = await DailyAnalytics.aggregate([
    {
      $match: {
        date: { $gte: lastMonth },
      },
    },
    {
      $facet: {
        thisMonthStats: [
          {
            $match: {
              date: { $gte: firstDate },
            },
          },
          { $sort: { date: 1 } },
          {
            $project: {
              _id: 0,
              dateKey: 1,
              date: 1,
              revenue: 1,
              totalOrders: 1,
              sales: 1,
              newCustomers: 1,
              averageOrderValue: 1,
            },
          },
        ],
        lastMonthStats: [
          {
            $match: {
              date: { $gte: lastMonth, $lt: firstDate },
            },
          },
          { $sort: { date: 1 } },
          {
            $project: {
              _id: 0,
              dateKey: 1,
              date: 1,
              revenue: 1,
              totalOrders: 1,
              sales: 1,
              newCustomers: 1,
              averageOrderValue: 1,
            },
          },
        ],
      },
    },
  ]);

  return {
    thisMonthStats: res?.thisMonthStats || [],
    lastMonthStats: res?.lastMonthStats || [],
  };
};

/**
 * Builds day-by-day comparison points (1..daysInMonth) from thisMonthStats vs lastMonthStats.
 */
const buildMonthlyTrends = (thisMonthStats = [], lastMonthStats = []) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const currentDay = now.getUTCDate();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const thisMap = new Map(
    thisMonthStats.map((item) => [new Date(item.date).getUTCDate(), item.revenue || 0]),
  );
  const lastMap = new Map(
    lastMonthStats.map((item) => [new Date(item.date).getUTCDate(), item.revenue || 0]),
  );

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return {
      label: String(day),
      current: day <= currentDay ? thisMap.get(day) || 0 : null,
      previous: lastMap.get(day) || 0,
    };
  });
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Aggregates monthly revenue and order counts for this year vs last year (Jan-Dec).
 */
export const fetchYearlyAnalytics = async () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth(); // 0..11
  const thisYearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const lastYearStart = new Date(Date.UTC(year - 1, 0, 1, 0, 0, 0, 0));

  const [[res], thisYearCustomers, lastYearCustomers] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: lastYearStart },
          status: { $ne: "Cancelled" },
        },
      },
      {
        $facet: {
          thisYearStats: [
            { $match: { createdAt: { $gte: thisYearStart } } },
            {
              $group: {
                _id: { $month: { date: "$createdAt", timezone: "UTC" } },
                revenue: { $sum: "$total" },
                orders: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          lastYearStats: [
            { $match: { createdAt: { $gte: lastYearStart, $lt: thisYearStart } } },
            {
              $group: {
                _id: { $month: { date: "$createdAt", timezone: "UTC" } },
                revenue: { $sum: "$total" },
                orders: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]),
    User.countDocuments({ createdAt: { $gte: thisYearStart } }),
    User.countDocuments({ createdAt: { $gte: lastYearStart, $lt: thisYearStart } }),
  ]);

  const thisMap = new Map((res?.thisYearStats || []).map((m) => [m._id, m]));
  const lastMap = new Map((res?.lastYearStats || []).map((m) => [m._id, m]));

  const yearlyTrends = MONTH_LABELS.map((label, idx) => {
    const monthNum = idx + 1;
    return {
      label,
      current: idx <= currentMonth ? thisMap.get(monthNum)?.revenue || 0 : null,
      previous: lastMap.get(monthNum)?.revenue || 0,
    };
  });

  const yearlyVelocity = MONTH_LABELS.map((label, idx) => ({
    label,
    orders: thisMap.get(idx + 1)?.orders || 0,
  }));

  return {
    thisYearStats: res?.thisYearStats || [],
    lastYearStats: res?.lastYearStats || [],
    thisYearCustomers,
    lastYearCustomers,
    yearlyTrends,
    yearlyVelocity,
  };
};

/**
 * Aggregates revenue and order counts by product category.
 */
export const fetchCategoryShare = async () => {
  const rows = await Order.aggregate([
    { $match: { status: { $ne: "Cancelled" } } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productDoc",
      },
    },
    {
      $group: {
        _id: {
          $ifNull: [{ $arrayElemAt: ["$productDoc.category", 0] }, "General"],
        },
        rawRevenue: {
          $sum: {
            $multiply: [
              { $ifNull: ["$items.price", 0] },
              { $ifNull: ["$items.quantity", 1] },
            ],
          },
        },
        orders: { $sum: 1 },
      },
    },
    { $sort: { rawRevenue: -1 } },
  ]);

  const totalRev = rows.reduce((sum, r) => sum + (r.rawRevenue || 0), 0);

  return rows.map((r) => ({
    name: r._id || "General",
    revenue: `$${Math.round(r.rawRevenue || 0).toLocaleString()}`,
    share: totalRev > 0 ? Math.round(((r.rawRevenue || 0) / totalRev) * 100) : 0,
    orders: r.orders || 0,
  }));
};

/**
 * Computes store conversion & fulfillment funnel from Users and Orders.
 */
export const fetchConversionFunnel = async () => {
  const [registeredPatrons, ordersPlaced, confirmedOrders, deliveredOrders] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments({ status: { $ne: "Cancelled" } }),
    Order.countDocuments({
      $or: [
        { paymentStatus: "Paid" },
        { status: { $in: ["Processing", "Shipped", "Delivered"] } },
      ],
    }),
    Order.countDocuments({ status: "Delivered" }),
  ]);

  const baseline = Math.max(registeredPatrons, ordersPlaced, 1);
  const pct = (count) => `${((count / baseline) * 100).toFixed(1)}%`;

  return [
    { stage: "Registered Patrons", count: registeredPatrons.toLocaleString(), rate: "100%", delta: "Accounts" },
    { stage: "Orders Placed", count: ordersPlaced.toLocaleString(), rate: pct(ordersPlaced), delta: "Active" },
    { stage: "Paid / Processing+", count: confirmedOrders.toLocaleString(), rate: pct(confirmedOrders), delta: "Confirmed" },
    { stage: "Delivered Orders", count: deliveredOrders.toLocaleString(), rate: pct(deliveredOrders), delta: "Fulfilled" },
  ];
};

/**
 * Aggregates top 4 valid shipping countries by revenue.
 */
export const fetchRegionalDemand = async () => {
  const rows = await Order.aggregate([
    { $match: { status: { $ne: "Cancelled" } } },
    {
      $group: {
        _id: { $trim: { input: { $ifNull: ["$shippingAddress.country", ""] } } },
        rawRevenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { rawRevenue: -1 } },
  ]);

  // Exclude blank or numeric-only test placeholders
  const validRows = rows.filter((r) => r._id && !/^\d+$/.test(r._id));
  const totalRev = validRows.reduce((sum, r) => sum + (r.rawRevenue || 0), 0);

  return validRows.slice(0, 4).map((r) => ({
    region: r._id,
    share: totalRev > 0 ? `${Math.round((r.rawRevenue / totalRev) * 100)}%` : "0%",
    value: `$${Math.round(r.rawRevenue || 0).toLocaleString()}`,
    trend: `${r.orders} order${r.orders === 1 ? "" : "s"}`,
  }));
};

export const fetchAnalyticsOverview = async (range = "1M") => {
  const bounds = normalizeDateRange(range);
  
  // Run all analytics queries concurrently
  const [
    [pastDays],
    dailyAnalytics,
    monthlyRaw,
    yearlyAnalytics,
    categoryShare,
    conversionFunnel,
    regionalDemand,
  ] = await Promise.all([
    DailyAnalytics.aggregate([
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
    ]),
    fetchDailyAnalytics(),
    fetchAnalytics(),
    fetchYearlyAnalytics(),
    fetchCategoryShare(),
    fetchConversionFunnel(),
    fetchRegionalDemand(),
  ]);

  const orderTotals = pastDays || {
    totalRevenue: 0,
    totalSales: 0,
    totalOrders: 0,
    newCustomers: 0,
  };

  // Accurately compute Average Order Value for the entire range (never sum daily AOVs)
  const averageOrderValue = computeAverageOrderValue(
    orderTotals.totalRevenue,
    orderTotals.totalOrders,
  );

  return {
    generatedAt: new Date().toISOString(),
    timeRange: bounds.range,
    startDate: bounds.startDate,
    endDate: bounds.endDate,
    revenue: orderTotals.totalRevenue,
    totalOrders: orderTotals.totalOrders,
    newCustomers: orderTotals.newCustomers,
    averageOrderValue,
    sales: orderTotals.totalSales,
    dailyAnalytics,
    monthlyAnalytics: {
      ...monthlyRaw,
      monthlyTrends: buildMonthlyTrends(monthlyRaw.thisMonthStats, monthlyRaw.lastMonthStats),
    },
    yearlyAnalytics,
    categoryShare,
    conversionFunnel,
    regionalDemand,
  };
};
