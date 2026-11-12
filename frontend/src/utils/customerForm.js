export const CUSTOMER_TIERS = Object.freeze(["VIP", "Active", "New"]);

export const INITIAL_CUSTOMER_FORM = Object.freeze({
  name: "",
  email: "",
  password: "",
  phone: "",
  location: "",
  avatar: "",
  tier: "New",
  isActive: true,
  isEmailVerified: false,
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
});

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Derive up to two uppercase initials from a customer's full name.
 * Falls back to "??" when no non-whitespace characters are present.
 */
export function getCustomerInitials(name = "") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Validate required customer fields aligned with backend userModel.js rules.
 */
export function evaluateCustomerReadiness(
  formData = {},
  { isEditMode = false } = {}
) {
  const trimmedName = String(formData.name || "").trim();
  const trimmedEmail = String(formData.email || "").trim().toLowerCase();
  const rawPassword = String(formData.password || "");

  const hasValidName = trimmedName.length >= 2 && trimmedName.length <= 100;
  const hasValidEmail = EMAIL_REGEX.test(trimmedEmail);
  const hasValidPassword = isEditMode
    ? rawPassword.length === 0 || rawPassword.length >= 6
    : rawPassword.length >= 6;

  return {
    hasValidName,
    hasValidEmail,
    hasValidPassword,
    hasRequiredFields: hasValidName && hasValidEmail && hasValidPassword,
  };
}

/**
 * Transform customer form state into the /api/users request body.
 */
export function buildCustomerPayload(
  formData = {},
  { isEditMode = false } = {}
) {
  const tier = CUSTOMER_TIERS.includes(formData.tier) ? formData.tier : "New";
  const payload = {
    name: String(formData.name || "").trim(),
    email: String(formData.email || "").trim().toLowerCase(),
    phone: String(formData.phone || "").trim(),
    location: String(formData.location || "").trim(),
    avatar: String(formData.avatar || "").trim(),
    tier,
    isActive: Boolean(formData.isActive),
    isEmailVerified: Boolean(formData.isEmailVerified),
  };

  const rawPassword = String(formData.password || "");
  if (rawPassword.length > 0) {
    payload.password = rawPassword;
  }

  const address = {
    street: String(formData.street || "").trim(),
    city: String(formData.city || "").trim(),
    state: String(formData.state || "").trim(),
    postalCode: String(formData.postalCode || "").trim(),
    country: String(formData.country || "").trim(),
  };

  const hasAddress = Object.values(address).some(Boolean);
  if (hasAddress) {
    payload.addresses = [{ ...address, isDefault: true }];
  } else if (isEditMode) {
    payload.addresses = [];
  }

  return payload;
}

/**
 * Map a backend user document into AddCustomer form state.
 */
export function mapUserToForm(user = {}) {
  const addresses = Array.isArray(user?.addresses) ? user.addresses : [];
  const primaryAddress =
    addresses.find((address) => address?.isDefault) || addresses[0] || {};

  return {
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    phone: user?.phone || "",
    location: user?.location || "",
    avatar: user?.avatar || "",
    tier: CUSTOMER_TIERS.includes(user?.tier) ? user.tier : "New",
    isActive: user?.isActive ?? true,
    isEmailVerified: Boolean(user?.isEmailVerified),
    street: primaryAddress?.street || "",
    city: primaryAddress?.city || "",
    state: primaryAddress?.state || "",
    postalCode: primaryAddress?.postalCode || "",
    country: primaryAddress?.country || "",
  };
}

/**
 * Format a customer's display location from top-level location or default address.
 */
export function formatCustomerLocation(customer = {}) {
  const explicitLocation = String(customer?.location || "").trim();
  if (explicitLocation) return explicitLocation;

  const addresses = Array.isArray(customer?.addresses) ? customer.addresses : [];
  const primaryAddress =
    addresses.find((address) => address?.isDefault) || addresses[0] || {};
  const cityCountry = [primaryAddress?.city, primaryAddress?.country]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");

  if (cityCountry) return cityCountry;

  const fallbackPart = [primaryAddress?.state, primaryAddress?.street]
    .map((part) => String(part || "").trim())
    .find(Boolean);

  return fallbackPart || "—";
}

