import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from "../controllers/userController.js";

const router = express.Router();

// Summary / KPI statistics
router.get("/stats", getUserStats);

// Standard CRUD endpoints
router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;

