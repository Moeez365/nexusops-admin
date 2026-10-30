/**
 * Escape special characters in user input before compiling into regular expressions
 * to prevent ReDoS and regex syntax injection.
 *
 * @param {string} input - Raw string from query or user input
 * @returns {string} Escaped string safe for RegExp
 */
export const escapeRegex = (input = "") => {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export default escapeRegex;

