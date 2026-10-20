/**
 * @file navigation.js
 * @description Centralized navigation item definitions for sidebar and mobile drawer.
 */

export const NAV_ITEMS = [
  { label: "Dashboard", to: "/", icon: "dashboard" },
  { label: "Inventory", to: "/inventory", icon: "inventory_2" },
  { label: "Collections", to: "/collections", icon: "collections_bookmark" },
  { label: "Media Gallery", to: "/media-gallery", icon: "photo_library" },
  { label: "Orders", to: "/orders", icon: "shopping_cart" },
  { label: "Customers", to: "/customers", icon: "group" },
  { label: "Analytics", to: "/analytics", icon: "insights" },
  { label: "Settings", to: "/settings", icon: "settings" },
];

export const DESKTOP_NAV_STORAGE_KEY = "nexaops_desktop_nav_collapsed";
export const LEGACY_NAV_STORAGE_KEY = "vaultos_desktop_nav_collapsed";

