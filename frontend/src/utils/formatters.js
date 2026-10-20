/**
 * @file formatters.js
 * @description Centralized formatting utilities for currency, numbers, and dates.
 */

/**
 * Formats a numeric value or numeric string into a localized currency string.
 *
 * @param {number|string} amount - The amount to format.
 * @param {string} [currency='USD'] - ISO 4217 currency code (e.g., 'USD', 'EUR', 'AED').
 * @returns {string} Formatted currency string (e.g., "$1,250.00").
 */
export function formatCurrency(amount, currency = "USD") {
  const numericValue = typeof amount === "number" ? amount : parseFloat(amount);
  if (Number.isNaN(numericValue)) return "$0.00";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return `$${numericValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  }
}

/**
 * Formats a number with thousands separators for tabular metric display.
 *
 * @param {number|string} value - The number to format.
 * @returns {string} Formatted number string (e.g., "1,420").
 */
export function formatNumber(value) {
  const numericValue = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(numericValue)) return "0";
  return numericValue.toLocaleString("en-US");
}

/**
 * Formats an ISO date or timestamp into a readable date string.
 *
 * @param {string|Date|number} dateInput - The date to format.
 * @param {Object} [options] - Intl.DateTimeFormat options.
 * @returns {string} Formatted date string (e.g., "Oct 16, 2026").
 */
export function formatDate(dateInput, options = {}) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "—";

  const defaultOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat("en-US", defaultOptions).format(date);
}

/**
 * Generates a clean URL slug from arbitrary text.
 *
 * @param {string} text - The input string to convert.
 * @returns {string} A lowercase, hyphen-separated slug.
 */
export function slugify(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}
