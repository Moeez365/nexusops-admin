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

// Get complete store settings
export const getStoreSettings = asyncHandler(async (req, res) => {
  const data = await fetchStoreSettings();

  return res.status(200).json({
    success: true,
    data,
  });
});

// Update store settings (accepts full or partial diff updates)
export const updateStoreSettings = asyncHandler(async (req, res) => {
  const updatedSettings = await updateStoreSettingsData(req.body);

  return res.status(200).json({
    success: true,
    message: "Store settings updated successfully",
    data: updatedSettings,
  });
});

// Get store analytics
export const getStoreAnalytics = asyncHandler(async (req, res) => {
  const analyticsData = await computeStoreAnalytics(req.query.range);

  return res.status(200).json({
    success: true,
    data: analyticsData,
  });
});

// Update analytics baseline targets
export const updateAnalyticsTargets = asyncHandler(async (req, res) => {
  const updatedDefaults = await updateStoreAnalyticsTargets(req.body);

  return res.status(200).json({
    success: true,
    message: "Analytics targets updated successfully",
    data: updatedDefaults,
  });
});

// Get public payment configuration
export const getPaymentConfig = asyncHandler(async (req, res) => {
  const config = await fetchPublicPaymentConfig();

  return res.status(200).json({
    success: true,
    data: config,
  });
});

// Update payment gateways
export const updatePaymentConfig = asyncHandler(async (req, res) => {
  const updatedPayments = await updatePaymentGatewaysConfig(req.body);

  return res.status(200).json({
    success: true,
    message: "Payment settings updated successfully",
    data: updatedPayments,
  });
});

// Reset store settings to factory defaults
export const resetDefaultSettings = asyncHandler(async (req, res) => {
  const defaultSettings = await resetStoreSettingsToDefaults();

  return res.status(200).json({
    success: true,
    message: "Store settings reset to defaults successfully",
    data: defaultSettings,
  });
});
