import express from "express";
import {
  getAnalyticsOverview,
  triggerDailyRollup,
} from "../controllers/analyticsController.js";

const router = express.Router();

/**
 * ── Analytics Overview ──
 * GET /api/analytics?range=7D   - Get KPI metrics, sales, and last 5 orders
 */
router.get("/", getAnalyticsOverview);

/**
 * ── Manual / Worker Rollup Trigger ──
 * POST /api/analytics/rollup    - Trigger rollup for a dateKey (body: { dateKey: "YYYY-MM-DD" })
 */
router.post("/rollup", triggerDailyRollup);

export default router;

