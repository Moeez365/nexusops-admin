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
 * Daily Analytics Schema
 * Minimal pre-aggregated daily snapshot tracking core store KPIs
 * (revenue, totalOrders, newCustomers, averageOrderValue, sales)
 * for a single YYYY-MM-DD calendar day.
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
    sales: nonNegativeNumber(), // Total units/items sold for the day

    lastAggregatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const DailyAnalytics = mongoose.model("DailyAnalytics", dailyAnalyticsSchema);

export default DailyAnalytics;
