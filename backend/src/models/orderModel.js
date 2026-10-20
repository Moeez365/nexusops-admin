import mongoose from "mongoose";

/**
 * Order Item Sub-Schema
 * Represents individual products included within an order.
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true },
);

/**
 * Order Schema
 *
 * Modeled to match frontend requirements across Orders and Dashboard views:
 * - orderNumber / id: e.g. "#VO-8921"
 * - customer: Customer full name (e.g. "Sophia Laurent")
 * - email: Customer email (e.g. "s.laurent@paris.luxury")
 * - product: Primary product display label (e.g. "Chronos Elite MK II")
 * - status: Order lifecycle state ("Pending", "Processing", "Shipped", "Delivered", "Cancelled")
 * - total: Numeric monetary total
 */
const orderSchema = new mongoose.Schema(
  {
    // Order Identifier (e.g. "#VO-8921")
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Customer Information (matches frontend order.customer & order.email)
    customer: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },

    // Primary Product Title / Summary (matches frontend order.product)
    product: {
      type: String,
      default: "",
      trim: true,
    },

    // Detailed Line Items
    items: {
      type: [orderItemSchema],
      default: [],
    },

    // Order Lifecycle Status
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
      trim: true,
    },

    // Financial Totals
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
    },

    // Payment Details
    paymentMethod: {
      type: String,
      default: "Credit Card",
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    // Fulfillment & Shipping Details
    shippingAddress: {
      street: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      postalCode: { type: String, default: "", trim: true },
      country: { type: String, default: "", trim: true },
    },
    trackingNumber: {
      type: String,
      default: "",
      trim: true,
    },

    // Additional Notes
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * Virtual: id alias for orderNumber
 * Allows frontend to consume `order.id` (e.g. "#VO-8921") seamlessly.
 */
orderSchema.virtual("id").get(function () {
  return this.orderNumber;
});

/**
 * Virtual: totalItems
 * Sum of all quantities across items.
 */
orderSchema.virtual("totalItems").get(function () {
  if (!this.items || this.items.length === 0) return 1;
  return this.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
});

/**
 * Pre-validation Hook
 * Auto-generates orderNumber and derives primary product name if omitted.
 */
orderSchema.pre("validate", function (next) {
  // Auto-generate orderNumber if not provided (e.g., "#VO-8921")
  if (!this.orderNumber) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `#VO-${randomSuffix}`;
  }

  // Derive primary product summary from items if not explicitly set
  if (!this.product && this.items && this.items.length > 0) {
    const firstItemName = this.items[0].name;
    const additionalCount = this.items.length - 1;
    this.product =
      additionalCount > 0
        ? `${firstItemName} (+${additionalCount} more)`
        : firstItemName;
  }

  // If total is 0 and subtotal is set, calculate total
  if ((!this.total || this.total === 0) && this.subtotal > 0) {
    this.total = this.subtotal + (this.tax || 0) + (this.shippingFee || 0) - (this.discount || 0);
  }

  next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;

