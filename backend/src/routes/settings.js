import express from "express";
import {
  getStoreSettings,
  updateStoreSettings,
  getPaymentConfig,
  updatePaymentConfig,
  resetDefaultSettings,
} from "../controllers/settingsController.js";

const router = express.Router();

/**
 * ── General Store Settings & Profile ──
 * GET  /api/settings           - Get all store settings, profile, commerce & transit configs
 * PUT  /api/settings           - Update store settings
 * PATCH /api/settings          - Partial update store settings
 */
router.route("/")
  .get(getStoreSettings)
  .put(updateStoreSettings)
  .patch(updateStoreSettings);

/**
 * ── Payment Config & Gateways ──
 * GET  /api/settings/payment   - Safe public payment gateways & currencies for checkout
 * PUT  /api/settings/payment   - Update payment gateways, credentials & escrow rules
 */
router.route("/payment")
  .get(getPaymentConfig)
  .put(updatePaymentConfig);

/**
 * ── Factory Reset ──
 * POST /api/settings/reset     - Reset all store settings to default template
 */
router.post("/reset", resetDefaultSettings);

export default router;

