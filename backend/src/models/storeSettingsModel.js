import mongoose from "mongoose";

/**
 * Currency Sub-Schema
 */
const currencySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    symbol: { type: String, required: true, trim: true },
    name: { type: String, default: "" },
    exchangeRate: { type: Number, default: 1.0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

/**
 * Shipping Zone Sub-Schema
 */
const shippingZoneSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true, trim: true },
    regions: { type: [String], default: [] },
    rate: { type: Number, default: 0, min: 0 },
    freeThreshold: { type: Number, default: 1500, min: 0 },
    estimatedDays: { type: String, default: "2-4 business days" },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

/**
 * Transit Node Sub-Schema (matches frontend Settings logistics cards)
 */
const transitNodeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    detail: { type: String, default: "Active dispatch" },
    statusColor: { type: String, default: "bg-primary" }, // bg-primary, bg-error, etc.
    activeDispatches: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

/**
 * Store Settings Schema
 * 
 * Central collection for all store settings, commerce defaults, payment configurations,
 * fulfillment logistics, notifications, staff security, and analytics baseline targets.
 */
const storeSettingsSchema = new mongoose.Schema(
  {
    // Singleton identifier flag
    singletonId: {
      type: String,
      default: "STORE_CONFIG_PRIMARY",
      unique: true,
      immutable: true,
    },

    // ── 1. Store Profile & Brand Identity ──
    storeProfile: {
      storeName: { type: String, default: "NexaOps Store", trim: true },
      tagline: { type: String, default: "Haute Horlogerie & Bespoke Atelier", trim: true },
      supportEmail: { type: String, default: "support@nexaops.store", trim: true, lowercase: true },
      supportPhone: { type: String, default: "+33 1 42 68 55 00", trim: true },
      country: { type: String, default: "France", trim: true },
      timezone: { type: String, default: "Europe/Paris", trim: true },
      storeStatus: {
        type: String,
        enum: ["Live", "Maintenance", "Private Access", "Draft"],
        default: "Live",
      },
      brandBadge: { type: String, default: "Verified Brand" },
      address: {
        street: { type: String, default: "12 Place Vendôme" },
        city: { type: String, default: "Paris" },
        state: { type: String, default: "Île-de-France" },
        postalCode: { type: String, default: "75001" },
        country: { type: String, default: "France" },
      },
      logoUrl: { type: String, default: "" },
      faviconUrl: { type: String, default: "" },
    },

    // ── 2. Commerce & Pricing Defaults ──
    commerce: {
      defaultCurrency: { type: String, default: "EUR", uppercase: true },
      currencySymbol: { type: String, default: "€" },
      supportedCurrencies: {
        type: [currencySchema],
        default: [
          { code: "EUR", symbol: "€", name: "Euro", exchangeRate: 1.0, isActive: true },
          { code: "USD", symbol: "$", name: "US Dollar", exchangeRate: 1.08, isActive: true },
          { code: "AED", symbol: "AED", name: "UAE Dirham", exchangeRate: 3.97, isActive: true },
          { code: "GBP", symbol: "£", name: "British Pound", exchangeRate: 0.85, isActive: true },
        ],
      },
      taxMode: {
        type: String,
        enum: ["VAT included", "Tax exclusive", "No tax"],
        default: "VAT included",
      },
      defaultTaxRate: { type: Number, default: 20, min: 0 }, // 20% VAT
      defaultShippingFee: { type: Number, default: 0, min: 0 },
      freeShippingThreshold: { type: Number, default: 1500, min: 0 },
      lowStockAlertThreshold: { type: Number, default: 6, min: 1 },
      orderPrefix: { type: String, default: "#VO-", trim: true },
      allowGuestCheckout: { type: Boolean, default: true },
    },

    // ── 3. Payment Methods & Gateways ──
    payments: {
      defaultMethod: { type: String, default: "Credit Card" },
      escrowStatus: {
        type: String,
        enum: ["Verified", "Pending Review", "Configured"],
        default: "Verified",
      },
      gateways: {
        stripe: {
          enabled: { type: Boolean, default: true },
          testMode: { type: Boolean, default: true },
          publishableKey: { type: String, default: "pk_test_sample_nexaops" },
          secretKey: { type: String, default: "" },
          webhookSecret: { type: String, default: "" },
        },
        paypal: {
          enabled: { type: Boolean, default: true },
          mode: { type: String, enum: ["sandbox", "live"], default: "sandbox" },
          clientId: { type: String, default: "sb_client_nexaops" },
          clientSecret: { type: String, default: "" },
        },
        bankTransfer: {
          enabled: { type: Boolean, default: true },
          bankName: { type: String, default: "Banque Privée Edmond de Rothschild" },
          iban: { type: String, default: "FR76 3000 4000 1234 5678 9012 345" },
          bic: { type: String, default: "ROTHFR2PXXX" },
          instructions: {
            type: String,
            default: "Please include your Order ID in the transfer reference for immediate atelier clearing.",
          },
        },
        cashOnDelivery: {
          enabled: { type: Boolean, default: false },
          maxAmount: { type: Number, default: 3000 },
          instructions: { type: String, default: "Available only for metropolitan concierge delivery." },
        },
        cryptoEscrow: {
          enabled: { type: Boolean, default: true },
          network: { type: String, default: "Ethereum / USDT" },
          walletAddress: { type: String, default: "0x71C...NexaOpsVault" },
          instructions: {
            type: String,
            default: "Locked in smart escrow pending physical delivery inspection and valet sign-off.",
          },
        },
      },
    },

    // ── 4. Fulfillment & Transit Logistics ──
    fulfillment: {
      securityReviewRequired: { type: Boolean, default: true },
      ordersNeedingIdentityReview: { type: Number, default: 3 },
      shippingZones: {
        type: [shippingZoneSchema],
        default: [
          {
            name: "Western Europe Atelier Priority",
            regions: ["France", "Switzerland", "Monaco", "Italy", "Germany", "United Kingdom"],
            rate: 0,
            freeThreshold: 1000,
            estimatedDays: "1-2 business days",
            isActive: true,
          },
          {
            name: "North America Armored Courier",
            regions: ["United States", "Canada"],
            rate: 150,
            freeThreshold: 2500,
            estimatedDays: "2-3 business days",
            isActive: true,
          },
          {
            name: "Middle East & GCC Valet",
            regions: ["United Arab Emirates", "Saudi Arabia", "Qatar"],
            rate: 200,
            freeThreshold: 3000,
            estimatedDays: "2-4 business days",
            isActive: true,
          },
          {
            name: "Asia-Pacific Diplomatic Express",
            regions: ["Japan", "Singapore", "Hong Kong"],
            rate: 250,
            freeThreshold: 3500,
            estimatedDays: "3-5 business days",
            isActive: true,
          },
        ],
      },
      transitNodes: {
        type: [transitNodeSchema],
        default: [
          {
            name: "Geneva Operations Hub",
            detail: "4 active dispatches",
            statusColor: "bg-primary",
            activeDispatches: 4,
          },
          {
            name: "Paris Atelier Couriers",
            detail: "12 active valets",
            statusColor: "bg-primary",
            activeDispatches: 12,
          },
          {
            name: "Dubai Customs Gate",
            detail: "1 clearance pending",
            statusColor: "bg-error",
            activeDispatches: 1,
          },
        ],
      },
    },

    // ── 5. Notifications & Staff Security ──
    securityAndAlerts: {
      orderAlerts: { type: Boolean, default: true },
      lowStockAlerts: { type: Boolean, default: true },
      requireTwoFactor: { type: Boolean, default: false },
      staffUsersCount: { type: Number, default: 8 },
      syncStatus: { type: String, default: "NexaOps synced" },
    },

    // ── 6. Analytics Benchmarks & Defaults ──
    analyticsDefaults: {
      defaultTimeRange: { type: String, default: "7D" },
      targets: {
        monthlyRevenueTarget: { type: Number, default: 150000 },
        orderVolumeTarget: { type: Number, default: 1500 },
        activeCustomersTarget: { type: Number, default: 4000 },
        avgOrderValueTarget: { type: Number, default: 120 },
      },
      conversionFunnelBaseline: {
        type: [
          {
            stage: { type: String },
            count: { type: String },
            rate: { type: String },
            delta: { type: String },
          },
        ],
        default: [
          { stage: "Storefront Visits", count: "48,920", rate: "100%", delta: "+18.4%" },
          { stage: "Product Views", count: "19,410", rate: "39.7%", delta: "+11.2%" },
          { stage: "Added to Bag", count: "4,280", rate: "8.7%", delta: "+6.4%" },
          { stage: "Completed Checkout", count: "1,420", rate: "2.9%", delta: "+8.5%" },
        ],
      },
      regionalDemandTargets: {
        type: [
          {
            region: { type: String },
            share: { type: String },
            value: { type: String },
            trend: { type: String },
          },
        ],
        default: [
          { region: "Paris & Western Europe", share: "38%", value: "$48,811", trend: "+16.2%" },
          { region: "New York & North America", share: "31%", value: "$39,820", trend: "+12.8%" },
          { region: "Dubai & GCC Private Clients", share: "19%", value: "$24,405", trend: "+21.5%" },
          { region: "Tokyo & Asia-Pacific", share: "12%", value: "$15,414", trend: "+9.4%" },
        ],
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Static method: Get or initialize singleton StoreSettings document.
 * Guarantees a document always exists with ready-to-use defaults.
 */
storeSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ singletonId: "STORE_CONFIG_PRIMARY" });
  if (!settings) {
    settings = await this.create({ singletonId: "STORE_CONFIG_PRIMARY" });
  }
  return settings;
};

const StoreSettings = mongoose.model("StoreSettings", storeSettingsSchema);

export default StoreSettings;

