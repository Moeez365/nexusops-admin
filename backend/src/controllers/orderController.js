import mongoose from "mongoose";
import Order from "../models/orderModel.js";

/**
 * Helper to build an identifier query matching either MongoDB _id or orderNumber.
 *
 * @param {string} identifier - MongoDB ObjectId or order number (e.g., "#VO-8921")
 * @returns {Object} MongoDB query filter
 */
const findOrderQuery = (identifier) => {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return { _id: identifier };
  }
  const formattedCode = identifier.startsWith("#") ? identifier : `#${identifier}`;
  return { orderNumber: { $regex: new RegExp(`^${formattedCode}$`, "i") } };
};

/**
 * @desc    Create a new order (or update if ID is provided)
 * @route   POST /api/orders
 * @access  Public / Admin
 */
export const createOrder = async (req, res) => {
  try {
    const { id, _id, ...orderData } = req.body;
    const orderId = id || _id;

    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      const updatedOrder = await Order.findByIdAndUpdate(orderId, orderData, {
        new: true,
        runValidators: true,
      }).populate("items.product");

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Order updated successfully",
        data: updatedOrder,
      });
    }

    const order = await Order.create(orderData);
    await order.populate("items.product");

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get all orders with optional search, status filtering, and sorting
 * @route   GET /api/orders
 * @access  Public / Admin
 */
export const getOrders = async (req, res) => {
  try {
    const { status, search, sortBy } = req.query;
    const filter = {};

    // Filter by status (e.g. Processing, Shipped, Delivered, Pending)
    if (status && status !== "All") {
      filter.status = status;
    }

    // Search by orderNumber, customer name, email, or product
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      filter.$or = [
        { orderNumber: searchRegex },
        { customer: searchRegex },
        { email: searchRegex },
        { product: searchRegex },
      ];
    }

    // Determine sort order
    let sort = { createdAt: -1 }; // Default: newest first
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

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get single order by ID or orderNumber
 * @route   GET /api/orders/:id
 * @access  Public / Admin
 */
export const getOrderById = async (req, res) => {
  try {
    const query = findOrderQuery(req.params.id);
    const order = await Order.findOne(query).populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Update order details
 * @route   PUT /api/orders/:id
 * @access  Public / Admin
 */
export const updateOrder = async (req, res) => {
  try {
    const query = findOrderQuery(req.params.id);
    const order = await Order.findOneAndUpdate(query, req.body, {
      new: true,
      runValidators: true,
    }).populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Quick status change (Pending, Processing, Shipped, Delivered, Cancelled)
 * @route   PATCH /api/orders/:id/status
 * @access  Public / Admin
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    const query = findOrderQuery(req.params.id);
    const order = await Order.findOneAndUpdate(
      query,
      { status },
      { new: true, runValidators: true },
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete an order
 * @route   DELETE /api/orders/:id
 * @access  Public / Admin
 */
export const deleteOrder = async (req, res) => {
  try {
    const query = findOrderQuery(req.params.id);
    const order = await Order.findOneAndDelete(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get order summary metrics and KPI cards matching the frontend dashboard
 * @route   GET /api/orders/stats
 * @access  Public / Admin
 */
export const getOrderStats = async (req, res) => {
  try {
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

    return res.status(200).json({
      success: true,
      data: {
        summaryCards: [
          { label: "Total Orders", value: totalOrders.toLocaleString(), icon: "shopping_bag" },
          { label: "Pending", value: pendingOrders.toLocaleString(), icon: "schedule" },
          { label: "Completed", value: completedOrders.toLocaleString(), icon: "check_circle" },
        ],
        totalRevenue,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

