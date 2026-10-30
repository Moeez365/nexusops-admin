import asyncHandler from "../utils/asyncHandler.js";
import {
  fetchStoreSettings,
  updateStoreSettingsData,
  computeStoreAnalytics,
  updateStoreAnalyticsTargets,
  fetchPublicPaymentConfig,
  updatePaymentGatewaysConfig,
  resetStoreSettingsToDefaults,
} from "../services/settingsService.js";

/**
 * @desc    Get complete store settings, default rules, and logistics nodes
 * @route   GET /api/settings
 * @access  Public / Admin
 */
export const getStoreSettings = asyncHandler(async (req, res) => {
  const data = await fetchStoreSettings();

  return res.status(200).json({
    success: true,
    data,
  });
});

/**
 * @desc    Update store settings (profile, commerce defaults, logistics, security)
 * @route   PUT /api/settings
 * @access  Admin
 */
export const updateStoreSettings = asyncHandler(async (req, res) => {
  const updatedSettings = await updateStoreSettingsData(req.body);

  return res.status(200).json({
    success: true,
    message: "Store settings updated successfully",
    data: updatedSettings,
  });
});

/**
 * @desc    Get store analytics (live database stats merged with targets & telemetry)
 * @route   GET /api/settings/analytics
 * @access  Public / Admin
 */
export const getStoreAnalytics = asyncHandler(async (req, res) => {
  const analyticsData = await computeStoreAnalytics(req.query.range);

  return res.status(200).json({
    success: true,
    data: analyticsData,
  });
});

/**
 * @desc    Update analytics baseline targets
 * @route   PUT /api/settings/analytics
 * @access  Admin
 */
export const updateAnalyticsTargets = asyncHandler(async (req, res) => {
  const updatedDefaults = await updateStoreAnalyticsTargets(req.body);

  return res.status(200).json({
    success: true,
    message: "Analytics targets updated successfully",
    data: updatedDefaults,
  });
});

/**
 * @desc    Get safe public payment configuration for checkout & store
 * @route   GET /api/settings/payment
 * @access  Public
 */
export const getPaymentConfig = asyncHandler(async (req, res) => {
  const config = await fetchPublicPaymentConfig();

  return res.status(200).json({
    success: true,
    data: config,
  });
});

/**
 * @desc    Update payment gateways and escrow settings
 * @route   PUT /api/settings/payment
 * @access  Admin
 */
export const updatePaymentConfig = asyncHandler(async (req, res) => {
  const updatedPayments = await updatePaymentGatewaysConfig(req.body);

  return res.status(200).json({
    success: true,
    message: "Payment settings updated successfully",
    data: updatedPayments,
  });
});

/**
 * @desc    Reset store settings to factory defaults
 * @route   POST /api/settings/reset
 * @access  Admin
 */
export const resetDefaultSettings = asyncHandler(async (req, res) => {
  const defaultSettings = await resetStoreSettingsToDefaults();

  return res.status(200).json({
    success: true,
    message: "Store settings reset to defaults successfully",
    data: defaultSettings,
  });
});
