import asyncHandler from "../utils/asyncHandler.js";
import {
  getOrdersList,
  getOrderById as fetchOrderById,
  createOrUpdateOrder,
  updateOrderDetails,
  changeOrderStatus,
  removeOrder,
  getOrderStatsMetrics,
} from "../services/orderService.js";

/**
 * @desc    Create a new order (or update if ID is provided)
 * @route   POST /api/orders
 * @access  Public / Admin
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { id, _id, ...orderPayload } = req.body;
  const targetId = id || _id;

  const { order, isNew } = await createOrUpdateOrder(orderPayload, targetId);

  return res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew ? "Order created successfully" : "Order updated successfully",
    data: order,
  });
});

/**
 * @desc    Get all orders with optional search, status filtering, and sorting
 * @route   GET /api/orders
 * @access  Public / Admin
 */
export const getOrders = asyncHandler(async (req, res) => {
  const { status, search, sortBy } = req.query;
  const orders = await getOrdersList({ status, search, sortBy });

  return res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

/**
 * @desc    Get single order by ID or orderNumber
 * @route   GET /api/orders/:id
 * @access  Public / Admin
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await fetchOrderById(req.params.id);

  return res.status(200).json({
    success: true,
    data: order,
  });
});

/**
 * @desc    Update order details
 * @route   PUT /api/orders/:id
 * @access  Public / Admin
 */
export const updateOrder = asyncHandler(async (req, res) => {
  const updatedOrder = await updateOrderDetails(req.params.id, req.body);

  return res.status(200).json({
    success: true,
    message: "Order updated successfully",
    data: updatedOrder,
  });
});

/**
 * @desc    Quick status change (Pending, Processing, Shipped, Delivered, Cancelled)
 * @route   PATCH /api/orders/:id/status
 * @access  Public / Admin
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updatedOrder = await changeOrderStatus(req.params.id, status);

  return res.status(200).json({
    success: true,
    message: `Order status updated to ${status}`,
    data: updatedOrder,
  });
});

/**
 * @desc    Delete an order
 * @route   DELETE /api/orders/:id
 * @access  Public / Admin
 */
export const deleteOrder = asyncHandler(async (req, res) => {
  await removeOrder(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});

/**
 * @desc    Get order summary metrics and KPI cards matching the frontend dashboard
 * @route   GET /api/orders/stats
 * @access  Public / Admin
 */
export const getOrderStats = asyncHandler(async (req, res) => {
  const stats = await getOrderStatsMetrics();

  return res.status(200).json({
    success: true,
    data: stats,
  });
});
