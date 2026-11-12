import mongoose from "mongoose";

/**
 * Shared factory for non-negative numeric metric fields.
 * Returns a fresh schema definition object per field.
 */
const nonNegativeNumber = (defaultValue = 0) => ({
  type: Number,
  default: defaultValue,
  min: [0, "Metric value cannot be negative"],
});

/**
 * Compact Order Snapshot Sub-Schema
 * Stores summary details for up to the last 5 orders of the day.
 */
const recentOrderSummarySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    orderNumber: {
      type: String,
      trim: true,
      default: "",
    },
    customer: {
      type: String,
      trim: true,
      default: "",
    },
    total: nonNegativeNumber(),
    status: {
      type: String,
      trim: true,
      default: "Pending",
    },
    createdAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

/**
 * Daily Analytics Schema
 *
 * Minimal pre-aggregated daily snapshot tracking core store KPIs
 * and the last 5 orders for a single YYYY-MM-DD calendar day.
 */
const dailyAnalyticsSchema = new mongoose.Schema(
  {
    dateKey: {
      type: String,
      required: [true, "dateKey is required"],
      unique: true,
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "dateKey must follow YYYY-MM-DD format"],
    },
    date: {
      type: Date,
      required: [true, "date is required"],
      index: true,
    },
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      default: "EUR",
    },

    // Core Daily Metrics
    revenue: nonNegativeNumber(),
    totalOrders: nonNegativeNumber(),
    newCustomers: nonNegativeNumber(),
    averageOrderValue: nonNegativeNumber(),
    sales: nonNegativeNumber(), // Total units/items sold (or completed sales) for the day

    // Up to 5 most recent orders for the day
    lastFiveOrders: {
      type: [recentOrderSummarySchema],
      default: [],
      validate: {
        validator: (orders) => orders.length <= 5,
        message: "lastFiveOrders cannot contain more than 5 items",
      },
    },

    lastAggregatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const DailyAnalytics = mongoose.model("DailyAnalytics", dailyAnalyticsSchema);

export default DailyAnalytics;
