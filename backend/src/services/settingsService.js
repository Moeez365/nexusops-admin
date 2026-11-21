import StoreSettings from "../models/storeSettingsModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";

// Mask sensitive credentials before returning to client
export const sanitizeSettings = (settingsDoc) => {
  const obj = settingsDoc.toObject ? settingsDoc.toObject() : JSON.parse(JSON.stringify(settingsDoc));

  if (obj.payments?.gateways) {
    const { stripe, paypal } = obj.payments.gateways;
    if (stripe) {
      stripe.hasSecretKey = Boolean(stripe.secretKey && stripe.secretKey.length > 0);
      stripe.secretKey = stripe.hasSecretKey ? "••••••••••••••••" : "";
      stripe.hasWebhookSecret = Boolean(stripe.webhookSecret && stripe.webhookSecret.length > 0);
      stripe.webhookSecret = stripe.hasWebhookSecret ? "••••••••••••••••" : "";
    }
    if (paypal) {
      paypal.hasClientSecret = Boolean(paypal.clientSecret && paypal.clientSecret.length > 0);
      paypal.clientSecret = paypal.hasClientSecret ? "••••••••••••••••" : "";
    }
  }

  return obj;
};

// Retrieve store settings
export const fetchStoreSettings = async () => {
  const settings = await StoreSettings.getSettings();
  const sanitized = sanitizeSettings(settings);

  return {
    settings: sanitized,
    ...sanitized,
    summaryCards: [
      {
        label: "Store status",
        value: sanitized.storeProfile?.storeStatus || "Live",
        icon: "storefront",
      },
      {
        label: "Payments",
        value: sanitized.payments?.escrowStatus || "Verified",
        icon: "payments",
      },
      {
        label: "Shipping zones",
        value: `${sanitized.fulfillment?.shippingZones?.length || 0} zones`,
        icon: "local_shipping",
      },
      {
        label: "Team access",
        value: `${sanitized.securityAndAlerts?.staffUsersCount || 1} users`,
        icon: "group",
      },
    ],
    transitNodes: (sanitized.fulfillment?.transitNodes || []).map((node) => [
      node.name,
      node.detail || `${node.activeDispatches || 0} active dispatches`,
      node.statusColor || "bg-primary",
    ]),
  };
};

// Update store settings - accepts partial diff or full settings
export const updateStoreSettingsData = async (updates = {}) => {
  const settings = await StoreSettings.getSettings();

  if (updates.storeProfile) {
    settings.storeProfile = {
      ...settings.storeProfile.toObject(),
      ...updates.storeProfile,
      address: {
        ...settings.storeProfile.address?.toObject(),
        ...(updates.storeProfile.address || {}),
      },
    };
  }

  if (updates.commerce) {
    settings.commerce = {
      ...settings.commerce.toObject(),
      ...updates.commerce,
      defaultTaxRate: Number(updates.commerce.defaultTaxRate) || 0,
      defaultShippingFee: Number(updates.commerce.defaultShippingFee) || 0,
      freeShippingThreshold: Number(updates.commerce.freeShippingThreshold) || 0,
      lowStockAlertThreshold: Number(updates.commerce.lowStockAlertThreshold) || 1,
    };
  }

  if (updates.payments) {
    const currentPayments = settings.payments.toObject();
    const currentGateways = currentPayments.gateways || {};
    const incomingGateways = updates.payments.gateways || {};

    const preserveSecret = (incoming, existing) => {
      if (!incoming || incoming.includes("••")) return existing || "";
      return incoming;
    };

    const stripe = incomingGateways.stripe
      ? {
          ...currentGateways.stripe,
          ...incomingGateways.stripe,
          secretKey: preserveSecret(incomingGateways.stripe.secretKey, currentGateways.stripe?.secretKey),
          webhookSecret: preserveSecret(incomingGateways.stripe.webhookSecret, currentGateways.stripe?.webhookSecret),
        }
      : currentGateways.stripe;

    const paypal = incomingGateways.paypal
      ? {
          ...currentGateways.paypal,
          ...incomingGateways.paypal,
          clientSecret: preserveSecret(incomingGateways.paypal.clientSecret, currentGateways.paypal?.clientSecret),
        }
      : currentGateways.paypal;

    settings.payments = {
      ...currentPayments,
      ...updates.payments,
      gateways: {
        ...currentGateways,
        ...incomingGateways,
        stripe,
        paypal,
      },
    };
  }

  if (updates.fulfillment) {
    settings.fulfillment = {
      ...settings.fulfillment.toObject(),
      ...updates.fulfillment,
    };
  }

  if (updates.securityAndAlerts) {
    settings.securityAndAlerts = {
      ...settings.securityAndAlerts.toObject(),
      ...updates.securityAndAlerts,
      staffUsersCount: Number(updates.securityAndAlerts.staffUsersCount) || 1,
    };
  }

  if (updates.analyticsDefaults) {
    settings.analyticsDefaults = {
      ...settings.analyticsDefaults.toObject(),
      ...updates.analyticsDefaults,
      targets: {
        ...settings.analyticsDefaults.targets?.toObject(),
        ...(updates.analyticsDefaults.targets || {}),
      },
    };
  }

  await settings.save();
  return sanitizeSettings(settings);
};

// Helper to compute range-specific revenue breakdown and velocity telemetry
const getRangeTelemetry = (range = "7D", liveRevenue = 0) => {
  const norm = String(range || "7D").trim().toUpperCase();

  if (norm === "24H" || norm === "1D" || norm === "TODAY") {
    const hourlyRevenue = [
      { label: "00:00", factor: 0.04, orders: 8 },
      { label: "04:00", factor: 0.02, orders: 3 },
      { label: "08:00", factor: 0.12, orders: 24 },
      { label: "12:00", factor: 0.22, orders: 62 },
      { label: "16:00", factor: 0.32, orders: 88, active: true },
      { label: "20:00", factor: 0.20, orders: 54 },
      { label: "23:59", factor: 0.08, orders: 19 },
    ];
    const baseRev = liveRevenue > 0 ? liveRevenue : 58400;
    const revenueBars = hourlyRevenue.map((item) => {
      const val = Math.round(baseRev * item.factor);
      return {
        day: item.label,
        label: item.label,
        revenue: val,
        amount: `$${(val / 1000).toFixed(1)}k`,
        orders: item.orders,
        active: Boolean(item.active),
        shade: item.active ? "bg-primary" : "bg-primary/25",
        height: `${Math.round(item.factor * 260)}%`,
      };
    });
    const velocityData = hourlyRevenue.map((item) => ({
      label: item.label,
      orders: item.orders,
    }));
    return {
      periodLabel: "vs yesterday",
      peakNote: "Peak 16:00 (88 orders/hr)",
      revenueBars,
      velocityData,
    };
  }

  if (norm === "1M" || norm === "30D" || norm === "30 DAYS") {
    const weeklyRevenue = [
      { label: "Week 1", factor: 0.22, orders: 310 },
      { label: "Week 2", factor: 0.27, orders: 380 },
      { label: "Week 3", factor: 0.33, orders: 460, active: true },
      { label: "Week 4", factor: 0.18, orders: 270 },
    ];
    const baseRev = liveRevenue > 0 ? liveRevenue : 128450;
    const revenueBars = weeklyRevenue.map((item) => {
      const val = Math.round(baseRev * item.factor);
      return {
        day: item.label,
        label: item.label,
        revenue: val,
        amount: `$${(val / 1000).toFixed(1)}k`,
        orders: item.orders,
        active: Boolean(item.active),
        shade: item.active ? "bg-primary" : "bg-primary/25",
        height: `${Math.round(item.factor * 250)}%`,
      };
    });
    const velocityData = weeklyRevenue.map((item) => ({
      label: item.label,
      orders: item.orders,
    }));
    return {
      periodLabel: "vs last month",
      peakNote: "Peak Week 3 (460 orders)",
      revenueBars,
      velocityData,
    };
  }

  if (norm === "1Y" || norm === "1 YEAR" || norm === "365D") {
    const monthlyRevenue = [
      { label: "Jan", factor: 0.06, orders: 720 },
      { label: "Feb", factor: 0.05, orders: 680 },
      { label: "Mar", factor: 0.07, orders: 810 },
      { label: "Apr", factor: 0.07, orders: 790 },
      { label: "May", factor: 0.08, orders: 920 },
      { label: "Jun", factor: 0.08, orders: 890 },
      { label: "Jul", factor: 0.09, orders: 960 },
      { label: "Aug", factor: 0.08, orders: 940 },
      { label: "Sep", factor: 0.09, orders: 1050 },
      { label: "Oct", factor: 0.10, orders: 1180 },
      { label: "Nov", factor: 0.11, orders: 1580 },
      { label: "Dec", factor: 0.12, orders: 1820, active: true },
    ];
    const baseRev = liveRevenue > 0 ? liveRevenue * 6 : 845000;
    const revenueBars = monthlyRevenue.map((item) => {
      const val = Math.round(baseRev * item.factor);
      return {
        day: item.label,
        label: item.label,
        revenue: val,
        amount: `$${(val / 1000).toFixed(0)}k`,
        orders: item.orders,
        active: Boolean(item.active),
        shade: item.active ? "bg-primary" : "bg-primary/25",
        height: `${Math.round(item.factor * 700)}%`,
      };
    });
    const velocityData = monthlyRevenue.map((item) => ({
      label: item.label,
      orders: item.orders,
    }));
    return {
      periodLabel: "vs last year",
      peakNote: "Peak Dec (1,820 orders)",
      revenueBars,
      velocityData,
    };
  }

  // Default: 7D
  const dailyRevenue = [
    { label: "Mon", factor: 0.11, amount: "$14.2k", orders: 160 },
    { label: "Tue", factor: 0.15, amount: "$18.9k", orders: 210 },
    { label: "Wed", factor: 0.12, amount: "$15.6k", orders: 175 },
    { label: "Thu", factor: 0.17, amount: "$22.1k", orders: 245 },
    { label: "Fri", factor: 0.23, amount: "$29.4k", orders: 340, active: true },
    { label: "Sat", factor: 0.13, amount: "$17.3k", orders: 190 },
    { label: "Sun", factor: 0.09, amount: "$10.9k", orders: 100 },
  ];
  const baseRev = liveRevenue > 0 ? liveRevenue : 128450;
  const revenueBars = dailyRevenue.map((item) => {
    const val = Math.round(baseRev * item.factor);
    return {
      day: item.label,
      label: item.label,
      revenue: val,
      amount: item.amount || `$${(val / 1000).toFixed(1)}k`,
      orders: item.orders,
      active: Boolean(item.active),
      shade: item.active ? "bg-primary" : "bg-primary/25",
      height: `${Math.round(item.factor * 380)}%`,
    };
  });
  const velocityData = dailyRevenue.map((item) => ({
    label: item.label,
    orders: item.orders,
  }));
  return {
    periodLabel: "vs last week",
    peakNote: "Peak Friday (340 orders)",
    revenueBars,
    velocityData,
  };
};

// Compute store analytics for intelligence dashboard
export const computeStoreAnalytics = async (requestedRange) => {
  const settings = await StoreSettings.getSettings();
  const analyticsDefaults = settings.analyticsDefaults || {};
  const timeRange = requestedRange || analyticsDefaults.defaultTimeRange || "7D";

  const [totalOrders, completedOrders, revenueResult, distinctCustomers] = await Promise.all([
    Order.countDocuments().catch(() => 0),
    Order.countDocuments({ status: "Delivered" }).catch(() => 0),
    Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
    ]).catch(() => []),
    Order.distinct("email").catch(() => []),
  ]);

  const liveRevenue = revenueResult[0]?.totalRevenue || 0;
  const liveCustomerCount = distinctCustomers?.length || 0;
  const liveAvgOrderValue = totalOrders > 0 ? (liveRevenue / totalOrders).toFixed(2) : 0;

  const products = await Product.find().select("category price stock").catch(() => []);
  const categoryMap = {};
  products.forEach((p) => {
    const cat = p.category || "General";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categoryShare = Object.entries(categoryMap).map(([name, count]) => ({
    name,
    orders: count,
    share: products.length > 0 ? Math.round((count / products.length) * 100) : 0,
    revenue: `$${(count * 450).toLocaleString()}`,
  }));

  const { periodLabel, peakNote, revenueBars, velocityData } = getRangeTelemetry(
    timeRange,
    liveRevenue
  );

  const kpiCards = [
    {
      label: "Total revenue",
      value: `$${(liveRevenue || 0).toLocaleString()}`,
      change: "14.2%",
      period: periodLabel,
      icon: "payments",
      numericValue: liveRevenue || 0,
    },
    {
      label: "Order volume",
      value: (totalOrders || 0).toLocaleString(),
      change: "8.5%",
      period: `${completedOrders || 0} completed`,
      icon: "shopping_bag",
      numericValue: totalOrders || 0,
    },
    {
      label: "Active customers",
      value: (liveCustomerCount || 0).toLocaleString(),
      change: "12.1%",
      period: "registered",
      icon: "group",
      numericValue: liveCustomerCount || 0,
    },
    {
      label: "Average order",
      value: `$${liveAvgOrderValue > 0 ? liveAvgOrderValue : "0.00"}`,
      change: "3.8%",
      period: "per cart",
      icon: "monitoring",
      numericValue: Number(liveAvgOrderValue) || 0,
    },
  ];

  return {
    timeRange,
    kpiCards,
    revenueBars,
    velocityData,
    peakNote,
    categoryShare,
    conversionFunnel: analyticsDefaults.conversionFunnelBaseline || [],
    regionalDemand: analyticsDefaults.regionalDemandTargets || [],
    targets: analyticsDefaults.targets || {},
  };
};

// Update analytics targets
export const updateStoreAnalyticsTargets = async (payload = {}) => {
  const settings = await StoreSettings.getSettings();

  if (payload.targets) {
    settings.analyticsDefaults.targets = {
      ...settings.analyticsDefaults.targets,
      ...payload.targets,
    };
  }
  if (payload.conversionFunnelBaseline) {
    settings.analyticsDefaults.conversionFunnelBaseline = payload.conversionFunnelBaseline;
  }
  if (payload.regionalDemandTargets) {
    settings.analyticsDefaults.regionalDemandTargets = payload.regionalDemandTargets;
  }
  if (payload.defaultTimeRange) {
    settings.analyticsDefaults.defaultTimeRange = payload.defaultTimeRange;
  }

  await settings.save();
  return settings.analyticsDefaults;
};

// Public payment gateway configs for frontend checkout/store
export const fetchPublicPaymentConfig = async () => {
  const settings = await StoreSettings.getSettings();
  const payments = settings.payments || {};
  const commerce = settings.commerce || {};

  const publicGateways = {
    stripe: {
      enabled: payments.gateways?.stripe?.enabled || false,
      testMode: payments.gateways?.stripe?.testMode || false,
      publishableKey: payments.gateways?.stripe?.publishableKey || "",
    },
    paypal: {
      enabled: payments.gateways?.paypal?.enabled || false,
      mode: payments.gateways?.paypal?.mode || "sandbox",
      clientId: payments.gateways?.paypal?.clientId || "",
    },
    bankTransfer: {
      enabled: payments.gateways?.bankTransfer?.enabled || false,
      bankName: payments.gateways?.bankTransfer?.bankName || "",
      iban: payments.gateways?.bankTransfer?.iban || "",
      bic: payments.gateways?.bankTransfer?.bic || "",
      instructions: payments.gateways?.bankTransfer?.instructions || "",
    },
    cashOnDelivery: {
      enabled: payments.gateways?.cashOnDelivery?.enabled || false,
      maxAmount: payments.gateways?.cashOnDelivery?.maxAmount || 0,
      instructions: payments.gateways?.cashOnDelivery?.instructions || "",
    },
    cryptoEscrow: {
      enabled: payments.gateways?.cryptoEscrow?.enabled || false,
      network: payments.gateways?.cryptoEscrow?.network || "",
      walletAddress: payments.gateways?.cryptoEscrow?.walletAddress || "",
      instructions: payments.gateways?.cryptoEscrow?.instructions || "",
    },
  };

  return {
    defaultMethod: payments.defaultMethod || "Credit Card",
    escrowStatus: payments.escrowStatus || "Verified",
    defaultCurrency: commerce.defaultCurrency || "EUR",
    currencySymbol: commerce.currencySymbol || "€",
    supportedCurrencies: commerce.supportedCurrencies || [],
    gateways: publicGateways,
  };
};

// Update payment configuration
export const updatePaymentGatewaysConfig = async ({ defaultMethod, escrowStatus, gateways } = {}) => {
  return updateStoreSettingsData({
    payments: {
      defaultMethod,
      escrowStatus,
      gateways,
    },
  });
};

// Reset settings to initial factory defaults
export const resetStoreSettingsToDefaults = async () => {
  await StoreSettings.deleteOne({ singletonId: "STORE_CONFIG_PRIMARY" });
  const freshSettings = await StoreSettings.getSettings();
  return sanitizeSettings(freshSettings);
};
