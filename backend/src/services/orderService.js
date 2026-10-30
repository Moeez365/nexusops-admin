import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import { escapeRegex } from "../utils/sanitize.js";

export const ORDER_STATUS_LIST = Object.freeze([
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
]);

/**
 * Builds MongoDB filter querying either _id or orderNumber
 *
 * @param {string} identifier - MongoDB ObjectId or order number (e.g., "#VO-8921")
 * @returns {Object} MongoDB query filter
 */
export const buildOrderIdentifierQuery = (identifier) => {
  if (!identifier) {
    const error = new Error("Order identifier is required");
    error.statusCode = 400;
    throw error;
  }

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return { _id: identifier };
  }

  const trimmed = String(identifier).trim();
  const formattedCode = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return { orderNumber: { $regex: new RegExp(`^${escapeRegex(formattedCode)}$`, "i") } };
};

/**
 * Fetch orders list with query filters
 */
export const getOrdersList = async ({ status, search, sortBy } = {}) => {
  const filter = {};

  if (status && status !== "All") {
    filter.status = status;
  }

  if (search && search.trim()) {
    const safeRegex = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [
      { orderNumber: safeRegex },
      { customer: safeRegex },
      { email: safeRegex },
      { product: safeRegex },
    ];
  }

  let sort = { createdAt: -1 };
  if (sortBy === "oldest") {
    sort = { createdAt: 1 };
  } else if (sortBy === "total_desc") {
    sort = { total: -1 };
  } else if (sortBy === "total_asc") {
    sort = { total: 1 };
  } else if (sortBy === "customer_asc") {
    sort = { customer: 1 };
  }

  const orders = await Order.find(filter)
    .sort(sort)
    .populate("items.product");

  return orders;
};

/**
 * Fetch single order by ID or orderNumber
 */
export const getOrderById = async (identifier) => {
  const query = buildOrderIdentifierQuery(identifier);
  const order = await Order.findOne(query).populate("items.product");

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  return order;
};

/**
 * Create a new order or update existing if ID is provided
 */
export const createOrUpdateOrder = async (orderPayload, orderId) => {
  if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
    const updatedOrder = await Order.findByIdAndUpdate(orderId, orderPayload, {
      new: true,
      runValidators: true,
    }).populate("items.product");

    if (!updatedOrder) {
      const error = new Error("Order not found");
      error.statusCode = 404;
      throw error;
    }

    return { order: updatedOrder, isNew: false };
  }

  const newOrder = await Order.create(orderPayload);
  await newOrder.populate("items.product");

  return { order: newOrder, isNew: true };
};

/**
 * Update order details
 */
export const updateOrderDetails = async (identifier, updatePayload) => {
  const query = buildOrderIdentifierQuery(identifier);
  const order = await Order.findOneAndUpdate(query, updatePayload, {
    new: true,
    runValidators: true,
  }).populate("items.product");

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  return order;
};

/**
 * Update order status with validation
 */
export const changeOrderStatus = async (identifier, newStatus) => {
  if (!newStatus || !ORDER_STATUS_LIST.includes(newStatus)) {
    const error = new Error(`Invalid status. Allowed values: ${ORDER_STATUS_LIST.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  const query = buildOrderIdentifierQuery(identifier);
  const order = await Order.findOneAndUpdate(
    query,
    { status: newStatus },
    { new: true, runValidators: true }
  ).populate("items.product");

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  return order;
};

/**
 * Delete an order
 */
export const removeOrder = async (identifier) => {
  const query = buildOrderIdentifierQuery(identifier);
  const order = await Order.findOneAndDelete(query);

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  return order;
};

/**
 * Aggregate summary KPIs and revenue metrics
 */
export const getOrderStatsMetrics = async () => {
  const [totalOrders, pendingOrders, completedOrders, revenueAggregate] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: "Pending" }),
    Order.countDocuments({ status: "Delivered" }),
    Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
    ]),
  ]);

  const totalRevenue = revenueAggregate[0]?.totalRevenue || 0;

  return {
    summaryCards: [
      { label: "Total Orders", value: totalOrders.toLocaleString(), icon: "shopping_bag" },
      { label: "Pending", value: pendingOrders.toLocaleString(), icon: "schedule" },
      { label: "Completed", value: completedOrders.toLocaleString(), icon: "check_circle" },
    ],
    totalRevenue,
    totalOrders,
    pendingOrders,
    completedOrders,
  };
};

