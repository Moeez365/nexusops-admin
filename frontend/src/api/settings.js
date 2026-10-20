import api from "./axios.js";

/**
 * Get all store settings, profile, commerce defaults, payments, and transit nodes
 */
export const getStoreSettings = async () => {
  const response = await api.get("/settings");
  return response.data;
};

/**
 * Update store settings (storeProfile, commerce, payments, fulfillment, securityAndAlerts)
 */
export const updateStoreSettings = async (payload) => {
  const response = await api.put("/settings", payload);
  return response.data;
};

/**
 * Get store analytics (KPIs, revenue breakdown, category share, conversion funnel)
 */
export const getStoreAnalytics = async (params = {}) => {
  const response = await api.get("/settings/analytics", { params });
  return response.data;
};

/**
 * Update analytics targets and benchmarks
 */
export const updateAnalyticsTargets = async (payload) => {
  const response = await api.put("/settings/analytics", payload);
  return response.data;
};

/**
 * Get public-safe payment gateways & currencies for checkout & store
 */
export const getPaymentConfig = async () => {
  const response = await api.get("/settings/payment");
  return response.data;
};

/**
 * Update payment configuration and gateway settings
 */
export const updatePaymentConfig = async (payload) => {
  const response = await api.put("/settings/payment", payload);
  return response.data;
};

/**
 * Reset store settings to factory defaults
 */
export const resetDefaultSettings = async () => {
  const response = await api.post("/settings/reset");
  return response.data;
};

