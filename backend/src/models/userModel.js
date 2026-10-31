import mongoose from "mongoose";

/**
 * Address Sub-Schema
 * Represents delivery and billing addresses for customer accounts.
 */
const addressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    postalCode: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

/**
 * User Roles & Customer Tiers Constants
 */
export const USER_ROLES = Object.freeze(["admin", "manager", "staff", "customer"]);
export const CUSTOMER_TIERS = Object.freeze(["VIP", "Active", "New"]);

/**
 * User Schema
 *
 * Designed to handle both administrative staff and luxury storefront patrons.
 * Includes security protection (password excluded by default on queries),
 * e-commerce telemetry (total spent, orders count, tiers), and address profiles.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Hidden by default from queries for security
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: "{VALUE} is not a valid user role",
      },
      default: "customer",
      index: true,
    },
    avatar: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    // E-Commerce Patron & Customer Profile
    tier: {
      type: String,
      enum: {
        values: CUSTOMER_TIERS,
        message: "{VALUE} is not a valid customer tier",
      },
      default: "New",
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: "", // e.g. "Paris, France" or "Geneva, Switzerland"
    },
    ordersCount: {
      type: Number,
      default: 0,
      min: [0, "Orders count cannot be negative"],
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: [0, "Total spent cannot be negative"],
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
    // Account Security & Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtual: Generates 2-letter uppercase initials from user name (e.g., "SL" for "Sophia Laurent")
 */
userSchema.virtual("initials").get(function () {
  if (!this.name) return "";
  return this.name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
});

/**
 * Text search index across name, email, and location for fast customer lookups
 */
userSchema.index({ name: "text", email: "text", location: "text" });

const User = mongoose.model("User", userSchema);

export default User;

