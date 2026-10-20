import express from "express";
import {
  createOrder,
  getOrders,
  getOrderStats,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

// Order statistics / KPI metrics
router.get("/stats", getOrderStats);

// Standard CRUD endpoints
router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.put("/:id", updateOrder);
router.patch("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

export default router;

