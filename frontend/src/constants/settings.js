/**
 * Settings Page Constants
 *
 * Summary status cards and logistics transit node configs.
 */

export const SETTINGS_SUMMARY = [
  { label: "Store status", value: "Live", icon: "storefront" },
  { label: "Payments", value: "Verified", icon: "payments" },
  { label: "Shipping zones", value: "12", icon: "local_shipping" },
  { label: "Team access", value: "8 users", icon: "group" },
];

export const TRANSIT_NODES = [
  ["Geneva Operations Hub", "4 active dispatches", "bg-primary"],
  ["Paris Atelier Couriers", "12 active valets", "bg-primary"],
  ["Dubai Customs Gate", "1 clearance pending", "bg-error"],
];

