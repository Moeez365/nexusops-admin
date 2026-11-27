import StoreSettings from "../models/storeSettingsModel.js";

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

  await settings.save();
  return sanitizeSettings(settings);
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
