import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import PageHeader from "../components/PageHeader";
import NexaOpsLogo from "../components/NexaOpsLogo";
import { getStoreSettings, updateStoreSettings, resetDefaultSettings } from "../api/settings";

const cardClass =
  "rounded-2xl border border-outline-variant/60 bg-surface-container/70 shadow-[0_16px_45px_rgba(50,35,75,0.08)] backdrop-blur-xl p-6 transition-all";
const inputClass =
  "mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all";

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
          {label}
        </span>
        {hint && (
          <span className="text-[11px] text-on-surface-variant font-label-mono">
            {hint}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  hint: PropTypes.string,
  children: PropTypes.node.isRequired,
};

function ToggleRow({ title, detail, enabled = true, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-low/70 p-4 transition-all hover:border-primary/30">
      <div className="min-w-0">
        <p className="text-sm font-medium text-on-surface">{title}</p>
        <p className="mt-0.5 text-xs text-on-surface-variant">{detail}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${
          enabled ? "bg-primary" : "bg-surface-container-highest"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

ToggleRow.propTypes = {
  title: PropTypes.string.isRequired,
  detail: PropTypes.string.isRequired,
  enabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
};

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-outline-variant/60 bg-surface-container-highest p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <h3 className="font-title-md text-lg font-semibold text-on-surface">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-1 text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const TABS = [
  { id: "profile", label: "Store Profile", icon: "storefront" },
  { id: "commerce", label: "Commerce & Tax", icon: "shopping_cart" },
  { id: "payments", label: "Payments & Escrow", icon: "payments" },
  { id: "fulfillment", label: "Shipping & Transit", icon: "local_shipping" },
  { id: "security", label: "Security & Team", icon: "shield" },
  { id: "analytics", label: "Analytics Targets", icon: "monitoring" },
];

const DEFAULT_SETTINGS = {
  storeProfile: {
    storeName: "NexaOps Store",
    tagline: "Haute Horlogerie & Bespoke Atelier",
    supportEmail: "support@nexaops.store",
    supportPhone: "+33 1 42 68 55 00",
    country: "France",
    timezone: "Europe/Paris",
    storeStatus: "Live",
    brandBadge: "Verified Brand",
    address: {
      street: "12 Place Vendôme",
      city: "Paris",
      state: "Île-de-France",
      postalCode: "75001",
      country: "France",
    },
  },
  commerce: {
    defaultCurrency: "EUR",
    currencySymbol: "€",
    taxMode: "VAT included",
    defaultTaxRate: 20,
    defaultShippingFee: 0,
    freeShippingThreshold: 1500,
    lowStockAlertThreshold: 6,
    orderPrefix: "#VO-",
    allowGuestCheckout: true,
    supportedCurrencies: [
      { code: "EUR", symbol: "€", name: "Euro", exchangeRate: 1.0, isActive: true },
      { code: "USD", symbol: "$", name: "US Dollar", exchangeRate: 1.08, isActive: true },
      { code: "AED", symbol: "AED", name: "UAE Dirham", exchangeRate: 3.97, isActive: true },
      { code: "GBP", symbol: "£", name: "British Pound", exchangeRate: 0.85, isActive: true },
    ],
  },
  payments: {
    defaultMethod: "Credit Card",
    escrowStatus: "Verified",
    gateways: {
      stripe: {
        enabled: true,
        testMode: true,
        publishableKey: "",
        secretKey: "",
        webhookSecret: "",
      },
      paypal: {
        enabled: true,
        mode: "sandbox",
        clientId: "",
        clientSecret: "",
      },
      bankTransfer: {
        enabled: true,
        bankName: "",
        iban: "",
        bic: "",
        instructions: "",
      },
      cashOnDelivery: {
        enabled: false,
        maxAmount: 0,
        instructions: "",
      },
      cryptoEscrow: {
        enabled: true,
        network: "Ethereum / USDT",
        walletAddress: "",
        instructions: "",
      },
    },
  },
  fulfillment: {
    securityReviewRequired: true,
    ordersNeedingIdentityReview: 0,
    shippingZones: [],
    transitNodes: [],
  },
  securityAndAlerts: {
    orderAlerts: true,
    lowStockAlerts: true,
    requireTwoFactor: false,
    staffUsersCount: 1,
    syncStatus: "NexaOps synced",
  },
  analyticsDefaults: {
    defaultTimeRange: "7D",
    targets: {
      monthlyRevenueTarget: 0,
      orderVolumeTarget: 0,
      activeCustomersTarget: 0,
      avgOrderValueTarget: 0,
    },
  },
};

// Calculate changed sections to only send modified data to the backend
const getChangedSettings = (current, baseline) => {
  if (!baseline) return current;
  const changed = {};

  for (const section of Object.keys(current)) {
    if (JSON.stringify(current[section]) !== JSON.stringify(baseline[section])) {
      changed[section] = current[section];
    }
  }

  return changed;
};

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Unified settings state and baseline for diff tracking
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState(null);

  // Modals
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showAddCurrencyModal, setShowAddCurrencyModal] = useState(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);

  // Modal form states
  const [newZone, setNewZone] = useState({
    name: "",
    regions: "",
    rate: 0,
    freeThreshold: 1500,
    estimatedDays: "2-4 business days",
  });

  const [newCurrency, setNewCurrency] = useState({
    code: "",
    symbol: "",
    name: "",
    exchangeRate: 1.0,
  });

  const [newNode, setNewNode] = useState({
    name: "",
    detail: "Active dispatch",
    statusColor: "bg-primary",
    activeDispatches: 1,
  });

  // Apply loaded database settings and store baseline
  const applyLoadedSettings = (raw) => {
    if (!raw) return;
    const data = raw.settings || raw;

    const merged = {
      storeProfile: { ...DEFAULT_SETTINGS.storeProfile, ...(data.storeProfile || {}) },
      commerce: {
        ...DEFAULT_SETTINGS.commerce,
        ...(data.commerce || {}),
        supportedCurrencies: data.commerce?.supportedCurrencies || DEFAULT_SETTINGS.commerce.supportedCurrencies,
      },
      payments: {
        ...DEFAULT_SETTINGS.payments,
        ...(data.payments || {}),
        gateways: {
          ...DEFAULT_SETTINGS.payments.gateways,
          ...(data.payments?.gateways || {}),
        },
      },
      fulfillment: {
        ...DEFAULT_SETTINGS.fulfillment,
        ...(data.fulfillment || {}),
        shippingZones: data.fulfillment?.shippingZones || [],
        transitNodes: data.fulfillment?.transitNodes || [],
      },
      securityAndAlerts: {
        ...DEFAULT_SETTINGS.securityAndAlerts,
        ...(data.securityAndAlerts || {}),
      },
      analyticsDefaults: {
        ...DEFAULT_SETTINGS.analyticsDefaults,
        ...(data.analyticsDefaults || {}),
        targets: {
          ...DEFAULT_SETTINGS.analyticsDefaults.targets,
          ...(data.analyticsDefaults?.targets || {}),
        },
      },
    };

    setSettings(merged);
    setInitialSettings(JSON.parse(JSON.stringify(merged)));
  };

  // Load store settings on mount
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const res = await getStoreSettings();
        if (!ignore && res?.data) {
          applyLoadedSettings(res.data);
        }
      } catch (err) {
        console.warn("Using offline settings defaults:", err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Update helpers for clean state changes
  const updateField = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateAddress = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      storeProfile: {
        ...prev.storeProfile,
        address: {
          ...prev.storeProfile?.address,
          [field]: value,
        },
      },
    }));
  };

  const updateGateway = (gateway, updates) => {
    setSettings((prev) => ({
      ...prev,
      payments: {
        ...prev.payments,
        gateways: {
          ...prev.payments?.gateways,
          [gateway]: {
            ...prev.payments?.gateways?.[gateway],
            ...updates,
          },
        },
      },
    }));
  };

  const updateTarget = (target, value) => {
    setSettings((prev) => ({
      ...prev,
      analyticsDefaults: {
        ...prev.analyticsDefaults,
        targets: {
          ...prev.analyticsDefaults?.targets,
          [target]: Number(value) || 0,
        },
      },
    }));
  };

  // Compute diff of changed sections
  const changedSettings = useMemo(() => {
    return getChangedSettings(settings, initialSettings);
  }, [settings, initialSettings]);

  const changedSections = Object.keys(changedSettings);
  const hasChanges = changedSections.length > 0;

  // Save only changed sections to backend
  const handleSave = async () => {
    if (!hasChanges) {
      setNotification({
        type: "info",
        message: "No changes detected. Everything is already up to date.",
      });
      return;
    }

    try {
      setSaving(true);
      setNotification(null);

      const res = await updateStoreSettings(changedSettings);
      if (res?.success) {
        applyLoadedSettings(res.data);
        setNotification({
          type: "success",
          message: `Saved ${changedSections.length} modified section${changedSections.length > 1 ? "s" : ""} to database.`,
        });
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err?.response?.data?.message || "Failed to save settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Factory reset
  const handleResetDefaults = async () => {
    try {
      setResetting(true);
      setShowResetModal(false);
      setNotification(null);
      const res = await resetDefaultSettings();
      if (res?.success && res.data) {
        applyLoadedSettings(res.data);
        setNotification({
          type: "success",
          message: "Store configuration has been reset to factory defaults successfully.",
        });
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err?.response?.data?.message || "Failed to reset settings.",
      });
    } finally {
      setResetting(false);
    }
  };

  // Add and remove shipping zones
  const handleAddZone = (e) => {
    e.preventDefault();
    if (!newZone.name.trim()) return;

    const zoneToAdd = {
      id: `zone-${Date.now()}`,
      name: newZone.name.trim(),
      regions: newZone.regions
        ? newZone.regions.split(",").map((r) => r.trim()).filter(Boolean)
        : [],
      rate: Number(newZone.rate) || 0,
      freeThreshold: Number(newZone.freeThreshold) || 0,
      estimatedDays: newZone.estimatedDays.trim() || "2-4 business days",
      isActive: true,
    };

    setSettings((prev) => ({
      ...prev,
      fulfillment: {
        ...prev.fulfillment,
        shippingZones: [...prev.fulfillment.shippingZones, zoneToAdd],
      },
    }));

    setNewZone({
      name: "",
      regions: "",
      rate: 0,
      freeThreshold: 1500,
      estimatedDays: "2-4 business days",
    });
    setShowAddZoneModal(false);
  };

  const handleToggleZone = (id) => {
    setSettings((prev) => ({
      ...prev,
      fulfillment: {
        ...prev.fulfillment,
        shippingZones: prev.fulfillment.shippingZones.map((z) =>
          z.id === id ? { ...z, isActive: !z.isActive } : z
        ),
      },
    }));
  };

  const handleRemoveZone = (id) => {
    setSettings((prev) => ({
      ...prev,
      fulfillment: {
        ...prev.fulfillment,
        shippingZones: prev.fulfillment.shippingZones.filter((z) => z.id !== id),
      },
    }));
  };

  // Add and remove currencies
  const handleAddCurrency = (e) => {
    e.preventDefault();
    if (!newCurrency.code.trim()) return;

    const currToAdd = {
      code: newCurrency.code.trim().toUpperCase(),
      symbol: newCurrency.symbol.trim() || "$",
      name: newCurrency.name.trim() || newCurrency.code.trim().toUpperCase(),
      exchangeRate: Number(newCurrency.exchangeRate) || 1.0,
      isActive: true,
    };

    setSettings((prev) => ({
      ...prev,
      commerce: {
        ...prev.commerce,
        supportedCurrencies: [
          ...prev.commerce.supportedCurrencies.filter((c) => c.code !== currToAdd.code),
          currToAdd,
        ],
      },
    }));

    setNewCurrency({ code: "", symbol: "", name: "", exchangeRate: 1.0 });
    setShowAddCurrencyModal(false);
  };

  const handleRemoveCurrency = (code) => {
    setSettings((prev) => ({
      ...prev,
      commerce: {
        ...prev.commerce,
        supportedCurrencies: prev.commerce.supportedCurrencies.filter((c) => c.code !== code),
      },
    }));
  };

  // Add and remove transit nodes
  const handleAddNode = (e) => {
    e.preventDefault();
    if (!newNode.name.trim()) return;

    const nodeToAdd = {
      name: newNode.name.trim(),
      detail: newNode.detail.trim() || "Active dispatch",
      statusColor: newNode.statusColor || "bg-primary",
      activeDispatches: Number(newNode.activeDispatches) || 0,
    };

    setSettings((prev) => ({
      ...prev,
      fulfillment: {
        ...prev.fulfillment,
        transitNodes: [...prev.fulfillment.transitNodes, nodeToAdd],
      },
    }));

    setNewNode({
      name: "",
      detail: "Active dispatch",
      statusColor: "bg-primary",
      activeDispatches: 1,
    });
    setShowAddNodeModal(false);
  };

  const handleRemoveNode = (name) => {
    setSettings((prev) => ({
      ...prev,
      fulfillment: {
        ...prev.fulfillment,
        transitNodes: prev.fulfillment.transitNodes.filter((n) => n.name !== name),
      },
    }));
  };

  const {
    storeProfile,
    commerce,
    payments,
    fulfillment,
    securityAndAlerts,
    analyticsDefaults,
  } = settings;

  // Dynamic KPI summary cards matching current state
  const summaryCards = [
    { label: "Store status", value: storeProfile.storeStatus, icon: "storefront" },
    { label: "Payments", value: payments.escrowStatus, icon: "payments" },
    { label: "Shipping zones", value: `${fulfillment.shippingZones.length} zones`, icon: "local_shipping" },
    { label: "Team access", value: `${securityAndAlerts.staffUsersCount} users`, icon: "group" },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        buttonLabel={
          saving
            ? "Saving..."
            : hasChanges
            ? `Save Changes (${changedSections.length})`
            : "Save Settings"
        }
        buttonIcon={saving ? "sync" : "save"}
        buttonDisabled={saving || resetting}
        onButtonClick={handleSave}
        secondaryButtonLabel="Reset Defaults"
        secondaryButtonIcon="restart_alt"
        onSecondaryButtonClick={() => setShowResetModal(true)}
      />

      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-12">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">

          {/* Section: Header title & sync status */}
          <section className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-label-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                NexaOps Store Control Center
              </p>
              <h1 className="mt-1 font-headline-lg text-2xl tracking-tight text-on-surface md:text-headline-lg">
                Store Settings &amp; Configuration
              </h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                Configure profile, pricing, multi-currency defaults, payment gateways, armored fulfillment, and staff security.
              </p>
            </div>
            <div className="flex items-center gap-2 font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
              <span
                className={`h-2 w-2 rounded-full ${
                  loading
                    ? "bg-amber-500 animate-ping"
                    : hasChanges
                    ? "bg-amber-500 animate-pulse"
                    : "bg-primary animate-pulse"
                }`}
              />
              {loading
                ? "Syncing database..."
                : hasChanges
                ? `${changedSections.length} unsaved change${changedSections.length > 1 ? "s" : ""}`
                : securityAndAlerts.syncStatus || "NexaOps synced"}
            </div>
          </section>

          {/* Toast Notification */}
          {notification && (
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm transition-all shadow-md backdrop-blur-md ${
                notification.type === "error"
                  ? "bg-rose-500/10 text-rose-700 border-rose-500/30"
                  : notification.type === "info"
                  ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">
                  {notification.type === "error"
                    ? "error"
                    : notification.type === "info"
                    ? "info"
                    : "check_circle"}
                </span>
                <span>{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="cursor-pointer text-xs font-semibold hover:opacity-75"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Summary Metric Cards */}
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => (
              <article key={item.label} className={cardClass}>
                <div className="flex items-center justify-between">
                  <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {item.label}
                  </span>
                  <span className="material-symbols-outlined rounded-2xl bg-primary-container p-2 text-primary text-[20px]">
                    {item.icon}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight text-on-surface">
                  {item.value}
                </p>
              </article>
            ))}
          </section>

          {/* Category Tabs */}
          <nav
            aria-label="Settings categories"
            className="flex flex-wrap items-center gap-2 border-b border-outline-variant/40 pb-3"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`cursor-pointer inline-flex items-center gap-2 rounded-xl px-4 py-2 font-label-mono text-xs uppercase tracking-wider font-semibold transition-all ${
                    active
                      ? "bg-primary text-on-primary shadow-[0_4px_14px_rgba(109,59,215,0.22)]"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Main Tab Content Grid */}
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
            <div className="space-y-8 xl:col-span-8">

              {/* TAB 1: Store Profile */}
              {activeTab === "profile" && (
                <div className="space-y-6 animate-in fade-in">
                  <section className={cardClass}>
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
                      <div>
                        <h2 className="font-title-md text-xl font-semibold text-on-surface">
                          Brand Identity &amp; Storefront
                        </h2>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Public profile, support channels, and storefront operational status.
                        </p>
                      </div>
                      <NexaOpsLogo size="sm" subtitle={storeProfile.brandBadge} />
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                      <Field label="Store name">
                        <input
                          type="text"
                          value={storeProfile.storeName}
                          onChange={(e) => updateField("storeProfile", "storeName", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Brand tagline">
                        <input
                          type="text"
                          value={storeProfile.tagline}
                          onChange={(e) => updateField("storeProfile", "tagline", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Support email">
                        <input
                          type="email"
                          value={storeProfile.supportEmail}
                          onChange={(e) => updateField("storeProfile", "supportEmail", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Support phone">
                        <input
                          type="tel"
                          value={storeProfile.supportPhone}
                          onChange={(e) => updateField("storeProfile", "supportPhone", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Store status">
                        <select
                          value={storeProfile.storeStatus}
                          onChange={(e) => updateField("storeProfile", "storeStatus", e.target.value)}
                          className={inputClass}
                        >
                          <option value="Live">Live (Storefront Accessible)</option>
                          <option value="Maintenance">Maintenance Mode</option>
                          <option value="Private Access">Private Access (VIP Only)</option>
                          <option value="Draft">Draft (Staging)</option>
                        </select>
                      </Field>

                      <Field label="Brand badge label">
                        <input
                          type="text"
                          value={storeProfile.brandBadge}
                          onChange={(e) => updateField("storeProfile", "brandBadge", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Country">
                        <select
                          value={storeProfile.country}
                          onChange={(e) => updateField("storeProfile", "country", e.target.value)}
                          className={inputClass}
                        >
                          <option value="France">France</option>
                          <option value="United States">United States</option>
                          <option value="United Arab Emirates">United Arab Emirates</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Switzerland">Switzerland</option>
                          <option value="Japan">Japan</option>
                          <option value="Singapore">Singapore</option>
                        </select>
                      </Field>

                      <Field label="Timezone">
                        <select
                          value={storeProfile.timezone}
                          onChange={(e) => updateField("storeProfile", "timezone", e.target.value)}
                          className={inputClass}
                        >
                          <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                          <option value="America/New_York">America/New_York (UTC-5)</option>
                          <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                          <option value="Europe/London">Europe/London (UTC+0)</option>
                          <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                        </select>
                      </Field>
                    </div>
                  </section>

                  {/* Physical Address */}
                  <section className={cardClass}>
                    <div className="border-b border-outline-variant/40 pb-4">
                      <h2 className="font-title-md text-xl font-semibold text-on-surface">
                        Atelier Physical Address
                      </h2>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Primary headquarters used on customer invoices, customs declarations, and packing slips.
                      </p>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-3">
                      <div className="md:col-span-3">
                        <Field label="Street address">
                          <input
                            type="text"
                            value={storeProfile.address?.street || ""}
                            onChange={(e) => updateAddress("street", e.target.value)}
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <Field label="City">
                        <input
                          type="text"
                          value={storeProfile.address?.city || ""}
                          onChange={(e) => updateAddress("city", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="State / Region">
                        <input
                          type="text"
                          value={storeProfile.address?.state || ""}
                          onChange={(e) => updateAddress("state", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Postal code">
                        <input
                          type="text"
                          value={storeProfile.address?.postalCode || ""}
                          onChange={(e) => updateAddress("postalCode", e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 2: Commerce & Tax */}
              {activeTab === "commerce" && (
                <div className="space-y-6 animate-in fade-in">
                  <section className={cardClass}>
                    <div className="border-b border-outline-variant/40 pb-4">
                      <h2 className="font-title-md text-xl font-semibold text-on-surface">
                        Pricing, Tax &amp; Checkout Rules
                      </h2>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Currency defaults, tax inclusion rules, and inventory threshold parameters.
                      </p>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-3">
                      <Field label="Default currency">
                        <select
                          value={commerce.defaultCurrency}
                          onChange={(e) => {
                            const code = e.target.value;
                            const matched = commerce.supportedCurrencies.find((c) => c.code === code);
                            setSettings((prev) => ({
                              ...prev,
                              commerce: {
                                ...prev.commerce,
                                defaultCurrency: code,
                                currencySymbol: matched ? matched.symbol : "€",
                              },
                            }));
                          }}
                          className={inputClass}
                        >
                          {commerce.supportedCurrencies.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} ({c.symbol}) - {c.name}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field label="Currency symbol">
                        <input
                          type="text"
                          value={commerce.currencySymbol}
                          onChange={(e) => updateField("commerce", "currencySymbol", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Tax mode">
                        <select
                          value={commerce.taxMode}
                          onChange={(e) => updateField("commerce", "taxMode", e.target.value)}
                          className={inputClass}
                        >
                          <option value="VAT included">VAT included (European standard)</option>
                          <option value="Tax exclusive">Tax exclusive (Calculated at checkout)</option>
                          <option value="No tax">No tax (Duty-free or exempt)</option>
                        </select>
                      </Field>

                      <Field label="Default tax rate (%)">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={commerce.defaultTaxRate}
                          onChange={(e) => updateField("commerce", "defaultTaxRate", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Free shipping threshold ($)">
                        <input
                          type="number"
                          min="0"
                          value={commerce.freeShippingThreshold}
                          onChange={(e) => updateField("commerce", "freeShippingThreshold", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Default shipping fee ($)">
                        <input
                          type="number"
                          min="0"
                          value={commerce.defaultShippingFee}
                          onChange={(e) => updateField("commerce", "defaultShippingFee", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Low-stock alert threshold">
                        <input
                          type="number"
                          min="1"
                          value={commerce.lowStockAlertThreshold}
                          onChange={(e) => updateField("commerce", "lowStockAlertThreshold", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Order ID prefix">
                        <input
                          type="text"
                          value={commerce.orderPrefix}
                          onChange={(e) => updateField("commerce", "orderPrefix", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <div className="flex items-end">
                        <div className="w-full">
                          <ToggleRow
                            title="Allow guest checkout"
                            detail="Let clients purchase without registration."
                            enabled={commerce.allowGuestCheckout}
                            onChange={(val) => updateField("commerce", "allowGuestCheckout", val)}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Multi-Currency Matrix */}
                  <section className={cardClass}>
                    <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
                      <div>
                        <h2 className="font-title-md text-xl font-semibold text-on-surface">
                          Supported Currencies &amp; Exchange Rates
                        </h2>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Real-time multi-currency conversions available to international patrons.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddCurrencyModal(true)}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 font-label-mono text-xs uppercase font-semibold text-on-primary hover:bg-primary/90"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Add Currency</span>
                      </button>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[500px]">
                        <thead className="bg-surface-container-low font-label-mono text-[10px] uppercase text-on-surface-variant">
                          <tr>
                            <th className="px-3 py-2.5">Code</th>
                            <th className="px-3 py-2.5">Symbol</th>
                            <th className="px-3 py-2.5">Name</th>
                            <th className="px-3 py-2.5">Exchange Rate</th>
                            <th className="px-3 py-2.5 text-center">Status</th>
                            <th className="px-3 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                          {commerce.supportedCurrencies.map((curr) => (
                            <tr key={curr.code} className="hover:bg-primary/5 transition-colors">
                              <td className="px-3 py-3 font-label-mono font-semibold text-primary">
                                {curr.code} {curr.code === commerce.defaultCurrency && "(Default)"}
                              </td>
                              <td className="px-3 py-3 font-semibold text-on-surface">{curr.symbol}</td>
                              <td className="px-3 py-3 text-on-surface-variant">{curr.name}</td>
                              <td className="px-3 py-3 font-label-mono text-on-surface">
                                1 {commerce.defaultCurrency} = {curr.exchangeRate} {curr.code}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 font-label-mono text-[9px] font-semibold ${
                                    curr.isActive
                                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                      : "bg-surface-container-high text-on-surface-variant"
                                  }`}
                                >
                                  {curr.isActive ? "Active" : "Disabled"}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-right">
                                {curr.code !== commerce.defaultCurrency && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCurrency(curr.code)}
                                    className="cursor-pointer text-rose-500 hover:text-rose-700 p-1"
                                    title="Remove currency"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      delete
                                    </span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 3: Payments & Escrow */}
              {activeTab === "payments" && (
                <div className="space-y-6 animate-in fade-in">
                  <section className={cardClass}>
                    <div className="border-b border-outline-variant/40 pb-4">
                      <h2 className="font-title-md text-xl font-semibold text-on-surface">
                        Payment &amp; Escrow Governance
                      </h2>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        High-value transaction gateways, cryptographic smart escrow, and bank clearing parameters.
                      </p>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                      <Field label="Default payment method">
                        <select
                          value={payments.defaultMethod}
                          onChange={(e) => updateField("payments", "defaultMethod", e.target.value)}
                          className={inputClass}
                        >
                          <option value="Credit Card">Credit Card (Stripe)</option>
                          <option value="Bank Wire Transfer">Bank Wire Transfer</option>
                          <option value="PayPal">PayPal</option>
                          <option value="Crypto Escrow">Crypto Smart Escrow</option>
                          <option value="Cash on Delivery">Cash on Concierge Delivery</option>
                        </select>
                      </Field>

                      <Field label="Escrow verification status">
                        <select
                          value={payments.escrowStatus}
                          onChange={(e) => updateField("payments", "escrowStatus", e.target.value)}
                          className={inputClass}
                        >
                          <option value="Verified">Verified &amp; Insured</option>
                          <option value="Pending Review">Pending Review</option>
                          <option value="Configured">Configured (Sandbox)</option>
                        </select>
                      </Field>
                    </div>
                  </section>

                  {/* Stripe Card */}
                  <section className={cardClass}>
                    <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          credit_card
                        </span>
                        <div>
                          <h3 className="font-semibold text-on-surface">Stripe Payments</h3>
                          <p className="text-xs text-on-surface-variant">
                            Visa, Mastercard, American Express, Apple Pay &amp; Google Pay
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-label-mono text-on-surface-variant">
                          Test Mode
                        </span>
                        <input
                          type="checkbox"
                          checked={payments.gateways?.stripe?.testMode || false}
                          onChange={(e) =>
                            updateGateway("stripe", { testMode: e.target.checked })
                          }
                          className="h-4 w-4 rounded accent-primary cursor-pointer"
                        />
                        <button
                          type="button"
                          role="switch"
                          aria-checked={payments.gateways?.stripe?.enabled}
                          onClick={() =>
                            updateGateway("stripe", {
                              enabled: !payments.gateways?.stripe?.enabled,
                            })
                          }
                          className={`relative h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer ${
                            payments.gateways?.stripe?.enabled ? "bg-primary" : "bg-surface-container-highest"
                          }`}
                        >
                          <span
                            className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                              payments.gateways?.stripe?.enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label="Publishable key">
                        <input
                          type="text"
                          value={payments.gateways?.stripe?.publishableKey || ""}
                          onChange={(e) =>
                            updateGateway("stripe", { publishableKey: e.target.value })
                          }
                          className={inputClass}
                          placeholder="pk_test_..."
                        />
                      </Field>

                      <Field label="Secret key" hint="Masked for security">
                        <input
                          type="password"
                          value={payments.gateways?.stripe?.secretKey || ""}
                          onChange={(e) =>
                            updateGateway("stripe", { secretKey: e.target.value })
                          }
                          className={inputClass}
                          placeholder="sk_test_••••••••••••"
                        />
                      </Field>
                    </div>
                  </section>

                  {/* Bank Wire Transfer Card */}
                  <section className={cardClass}>
                    <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          account_balance
                        </span>
                        <div>
                          <h3 className="font-semibold text-on-surface">Bank Wire Transfer</h3>
                          <p className="text-xs text-on-surface-variant">
                            Direct clearing for high-ticket pieces and private collection reserves
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={payments.gateways?.bankTransfer?.enabled}
                        onClick={() =>
                          updateGateway("bankTransfer", {
                            enabled: !payments.gateways?.bankTransfer?.enabled,
                          })
                        }
                        className={`relative h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer ${
                          payments.gateways?.bankTransfer?.enabled ? "bg-primary" : "bg-surface-container-highest"
                        }`}
                      >
                        <span
                          className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            payments.gateways?.bankTransfer?.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <Field label="Bank institution">
                        <input
                          type="text"
                          value={payments.gateways?.bankTransfer?.bankName || ""}
                          onChange={(e) =>
                            updateGateway("bankTransfer", { bankName: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="IBAN">
                        <input
                          type="text"
                          value={payments.gateways?.bankTransfer?.iban || ""}
                          onChange={(e) =>
                            updateGateway("bankTransfer", { iban: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="BIC / SWIFT">
                        <input
                          type="text"
                          value={payments.gateways?.bankTransfer?.bic || ""}
                          onChange={(e) =>
                            updateGateway("bankTransfer", { bic: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <div className="md:col-span-3">
                        <Field label="Transfer instructions for client">
                          <input
                            type="text"
                            value={payments.gateways?.bankTransfer?.instructions || ""}
                            onChange={(e) =>
                              updateGateway("bankTransfer", { instructions: e.target.value })
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    </div>
                  </section>

                  {/* Crypto Escrow Card */}
                  <section className={cardClass}>
                    <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          currency_bitcoin
                        </span>
                        <div>
                          <h3 className="font-semibold text-on-surface">Smart Crypto Escrow</h3>
                          <p className="text-xs text-on-surface-variant">
                            Smart contract custody released upon verified physical valet handoff
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={payments.gateways?.cryptoEscrow?.enabled}
                        onClick={() =>
                          updateGateway("cryptoEscrow", {
                            enabled: !payments.gateways?.cryptoEscrow?.enabled,
                          })
                        }
                        className={`relative h-6 w-11 rounded-full p-0.5 transition-colors cursor-pointer ${
                          payments.gateways?.cryptoEscrow?.enabled ? "bg-primary" : "bg-surface-container-highest"
                        }`}
                      >
                        <span
                          className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            payments.gateways?.cryptoEscrow?.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label="Settlement network">
                        <input
                          type="text"
                          value={payments.gateways?.cryptoEscrow?.network || ""}
                          onChange={(e) =>
                            updateGateway("cryptoEscrow", { network: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Escrow vault address">
                        <input
                          type="text"
                          value={payments.gateways?.cryptoEscrow?.walletAddress || ""}
                          onChange={(e) =>
                            updateGateway("cryptoEscrow", { walletAddress: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 4: Shipping & Transit */}
              {activeTab === "fulfillment" && (
                <div className="space-y-6 animate-in fade-in">
                  <section className={cardClass}>
                    <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
                      <div>
                        <h2 className="font-title-md text-xl font-semibold text-on-surface">
                          Armored Shipping Zones
                        </h2>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Territorial couriers, delivery SLAs, and regional flat rate thresholds.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddZoneModal(true)}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 font-label-mono text-xs uppercase font-semibold text-on-primary hover:bg-primary/90"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Add Shipping Zone</span>
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {fulfillment.shippingZones.map((zone) => (
                        <div
                          key={zone.id || zone.name}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low/70 p-4 transition-all hover:border-primary/40"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-on-surface">
                                {zone.name}
                              </span>
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 font-label-mono text-[9px] font-semibold ${
                                  zone.isActive
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                    : "bg-surface-container-high text-on-surface-variant"
                                }`}
                              >
                                {zone.isActive ? "Active" : "Paused"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {zone.regions && zone.regions.length > 0
                                ? zone.regions.join(", ")
                                : "All territories"}
                            </p>
                            <p className="mt-1 font-label-mono text-[11px] text-primary">
                              Fee: {zone.rate === 0 ? "Complimentary" : `$${zone.rate}`} · Free over ${zone.freeThreshold} · {zone.estimatedDays}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleZone(zone.id)}
                              className="cursor-pointer text-xs font-label-mono text-on-surface-variant hover:text-primary"
                            >
                              {zone.isActive ? "Pause" : "Activate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveZone(zone.id)}
                              className="cursor-pointer p-1 text-rose-500 hover:text-rose-700"
                              title="Delete zone"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Transit Nodes */}
                  <section className={cardClass}>
                    <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
                      <div>
                        <h2 className="font-title-md text-xl font-semibold text-on-surface">
                          Transit Nodes &amp; Valet Hubs
                        </h2>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Physical courier checkpoints managing customs and armored dispatch.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddNodeModal(true)}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 font-label-mono text-xs uppercase font-semibold text-on-primary hover:bg-primary/90"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Add Hub</span>
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {fulfillment.transitNodes.map((node) => (
                        <div
                          key={node.name}
                          className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low/60 p-3.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${node.statusColor || "bg-primary"}`}
                            />
                            <div>
                              <p className="font-medium text-sm text-on-surface">{node.name}</p>
                              <p className="text-xs text-on-surface-variant">{node.detail}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveNode(node.name)}
                            className="cursor-pointer p-1 text-rose-500 hover:text-rose-700"
                            title="Remove node"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 5: Security & Team */}
              {activeTab === "security" && (
                <div className="space-y-6 animate-in fade-in">
                  <section className={cardClass}>
                    <div className="border-b border-outline-variant/40 pb-4">
                      <h2 className="font-title-md text-xl font-semibold text-on-surface">
                        Notifications &amp; Staff Access Security
                      </h2>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        High-value transaction alerts, staff two-factor rules, and active seats.
                      </p>
                    </div>

                    <div className="mt-6 space-y-4">
                      <ToggleRow
                        title="Order review alerts"
                        detail="Email staff immediately when high-value bespoke orders enter manual escrow verification."
                        enabled={securityAndAlerts.orderAlerts}
                        onChange={(val) => updateField("securityAndAlerts", "orderAlerts", val)}
                      />

                      <ToggleRow
                        title="Low-stock inventory alerts"
                        detail="Notify atelier inventory managers before items drop below configured safety threshold."
                        enabled={securityAndAlerts.lowStockAlerts}
                        onChange={(val) => updateField("securityAndAlerts", "lowStockAlerts", val)}
                      />

                      <ToggleRow
                        title="Require two-factor authentication (2FA)"
                        detail="Enforce cryptographic or authenticator verification for all staff accounts accessing order data."
                        enabled={securityAndAlerts.requireTwoFactor}
                        onChange={(val) => updateField("securityAndAlerts", "requireTwoFactor", val)}
                      />

                      <div className="pt-2">
                        <Field label="Active staff users count">
                          <input
                            type="number"
                            min="1"
                            value={securityAndAlerts.staffUsersCount}
                            onChange={(e) =>
                              updateField("securityAndAlerts", "staffUsersCount", Number(e.target.value) || 1)
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    </div>
                  </section>

                  {/* Danger Zone: Factory Reset */}
                  <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 backdrop-blur-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="font-title-md text-lg font-semibold text-rose-600">
                          Reset Store to Factory Defaults
                        </h3>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Restores initial luxury atelier configuration, standard currencies, default shipping zones, and security baselines.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowResetModal(true)}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 font-label-mono text-xs uppercase font-semibold text-rose-600 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shrink-0"
                      >
                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                        <span>Reset Defaults</span>
                      </button>
                    </div>
                  </section>
                </div>
              )}

              {/* TAB 6: Analytics Targets */}
              {activeTab === "analytics" && (
                <div className="space-y-6 animate-in fade-in">
                  <section className={cardClass}>
                    <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
                      <div>
                        <h2 className="font-title-md text-xl font-semibold text-on-surface">
                          Analytics Targets &amp; Performance Baselines
                        </h2>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Configure monthly KPI targets used across the NexaOps intelligence dashboard.
                        </p>
                      </div>
                      <Link
                        to="/analytics"
                        className="cursor-pointer inline-flex items-center gap-1 font-label-mono text-xs uppercase font-semibold text-primary hover:underline"
                      >
                        <span>View Live Analytics</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                      <Field label="Default analytics timeframe">
                        <select
                          value={analyticsDefaults.defaultTimeRange}
                          onChange={(e) => updateField("analyticsDefaults", "defaultTimeRange", e.target.value)}
                          className={inputClass}
                        >
                          <option value="7D">Last 7 Days (7D)</option>
                          <option value="30D">Last 30 Days (30D)</option>
                          <option value="90D">Last 3 Months (90D)</option>
                          <option value="1Y">Last 12 Months (1Y)</option>
                        </select>
                      </Field>

                      <Field label="Monthly revenue target ($)">
                        <input
                          type="number"
                          min="0"
                          value={analyticsDefaults.targets?.monthlyRevenueTarget ?? ""}
                          onChange={(e) => updateTarget("monthlyRevenueTarget", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Order volume target (units)">
                        <input
                          type="number"
                          min="0"
                          value={analyticsDefaults.targets?.orderVolumeTarget ?? ""}
                          onChange={(e) => updateTarget("orderVolumeTarget", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Active customers target">
                        <input
                          type="number"
                          min="0"
                          value={analyticsDefaults.targets?.activeCustomersTarget ?? ""}
                          onChange={(e) => updateTarget("activeCustomersTarget", e.target.value)}
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Average order value target ($)">
                        <input
                          type="number"
                          min="0"
                          value={analyticsDefaults.targets?.avgOrderValueTarget ?? ""}
                          onChange={(e) => updateTarget("avgOrderValueTarget", e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </section>
                </div>
              )}
            </div>

            {/* Right Aside: Fulfillment Focus & Transit Network */}
            <aside aria-label="Fulfillment details" className="space-y-6 xl:col-span-4">
              <section className={cardClass}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label-mono text-[10px] uppercase tracking-widest text-primary">
                      Fulfillment focus
                    </p>
                    <h3 className="mt-1 font-title-md text-xl font-semibold text-on-surface">
                      Secure Escrow Release
                    </h3>
                  </div>
                  <span className="material-symbols-outlined rounded-2xl bg-primary-container p-2 text-primary text-[20px]">
                    lock_open
                  </span>
                </div>

                <p className="mt-3 text-xs text-on-surface-variant leading-relaxed">
                  High-ticket bespoke watches undergo biometric identity review before valet dispatch.
                  Currently <span className="font-semibold text-primary">{fulfillment.ordersNeedingIdentityReview || 0} orders</span> awaiting atelier release.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : hasChanges ? `Save (${changedSections.length})` : "Saved"}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="cursor-pointer rounded-xl border border-outline-variant/60 bg-surface-container-low px-4 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container transition-all active:scale-95"
                  >
                    Print Pack
                  </button>
                </div>
              </section>

              <section className={cardClass}>
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                  <h3 className="font-semibold text-base text-on-surface">
                    Transit Network
                  </h3>
                  <span className="rounded-full bg-primary-container px-2.5 py-0.5 font-label-mono text-[10px] font-semibold text-primary">
                    Nominal
                  </span>
                </div>

                <ul className="mt-4 space-y-3">
                  {fulfillment.transitNodes.map((node) => (
                    <li key={node.name} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${node.statusColor || "bg-primary"}`} />
                        <span className="truncate font-medium text-on-surface">{node.name}</span>
                      </div>
                      <span className="shrink-0 font-label-mono text-on-surface-variant">{node.detail}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </div>
      </main>

      {/* MODAL: Reset Store Settings to Defaults */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Store Settings"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Are you sure you want to restore the default store configuration? This will reset all profile info, supported currencies, shipping zones, and security preferences back to initial factory settings.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="cursor-pointer rounded-xl border border-outline-variant/60 px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={resetting}
              onClick={handleResetDefaults}
              className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 active:scale-95 disabled:opacity-50"
            >
              {resetting ? "Resetting..." : "Confirm Factory Reset"}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Add Shipping Zone */}
      <Modal
        isOpen={showAddZoneModal}
        onClose={() => setShowAddZoneModal(false)}
        title="Add Shipping Zone"
      >
        <form onSubmit={handleAddZone} className="space-y-4">
          <Field label="Zone name">
            <input
              type="text"
              required
              placeholder="e.g. Scandinavia Armored Express"
              value={newZone.name}
              onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Regions (comma separated)">
            <input
              type="text"
              placeholder="e.g. Sweden, Norway, Denmark, Finland"
              value={newZone.regions}
              onChange={(e) => setNewZone({ ...newZone, regions: e.target.value })}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Flat rate ($)">
              <input
                type="number"
                min="0"
                value={newZone.rate}
                onChange={(e) => setNewZone({ ...newZone, rate: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="Free shipping threshold ($)">
              <input
                type="number"
                min="0"
                value={newZone.freeThreshold}
                onChange={(e) => setNewZone({ ...newZone, freeThreshold: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Estimated delivery time">
            <input
              type="text"
              placeholder="e.g. 2-3 business days"
              value={newZone.estimatedDays}
              onChange={(e) => setNewZone({ ...newZone, estimatedDays: e.target.value })}
              className={inputClass}
            />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
            <button
              type="button"
              onClick={() => setShowAddZoneModal(false)}
              className="cursor-pointer rounded-xl border border-outline-variant/60 px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary/90"
            >
              Add Zone
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Add Supported Currency */}
      <Modal
        isOpen={showAddCurrencyModal}
        onClose={() => setShowAddCurrencyModal(false)}
        title="Add Supported Currency"
      >
        <form onSubmit={handleAddCurrency} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency code">
              <input
                type="text"
                required
                maxLength="4"
                placeholder="e.g. JPY"
                value={newCurrency.code}
                onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                className={inputClass}
              />
            </Field>

            <Field label="Symbol">
              <input
                type="text"
                required
                placeholder="e.g. ¥"
                value={newCurrency.symbol}
                onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Currency name">
            <input
              type="text"
              placeholder="e.g. Japanese Yen"
              value={newCurrency.name}
              onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label={`Exchange rate (1 ${commerce.defaultCurrency} = ?)`}>
            <input
              type="number"
              step="0.0001"
              min="0.0001"
              required
              value={newCurrency.exchangeRate}
              onChange={(e) => setNewCurrency({ ...newCurrency, exchangeRate: e.target.value })}
              className={inputClass}
            />
          </Field>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
            <button
              type="button"
              onClick={() => setShowAddCurrencyModal(false)}
              className="cursor-pointer rounded-xl border border-outline-variant/60 px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary/90"
            >
              Add Currency
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Add Transit Node */}
      <Modal
        isOpen={showAddNodeModal}
        onClose={() => setShowAddNodeModal(false)}
        title="Add Logistics Transit Hub"
      >
        <form onSubmit={handleAddNode} className="space-y-4">
          <Field label="Hub name">
            <input
              type="text"
              required
              placeholder="e.g. Milan Concierge Terminal"
              value={newNode.name}
              onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Status detail description">
            <input
              type="text"
              required
              placeholder="e.g. 6 active valets dispatched"
              value={newNode.detail}
              onChange={(e) => setNewNode({ ...newNode, detail: e.target.value })}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status indicator">
              <select
                value={newNode.statusColor}
                onChange={(e) => setNewNode({ ...newNode, statusColor: e.target.value })}
                className={inputClass}
              >
                <option value="bg-primary">Primary (Active)</option>
                <option value="bg-emerald-500">Emerald (Nominal)</option>
                <option value="bg-amber-500">Amber (Warning)</option>
                <option value="bg-rose-500">Rose (Clearance Pending)</option>
              </select>
            </Field>

            <Field label="Active dispatches count">
              <input
                type="number"
                min="0"
                value={newNode.activeDispatches}
                onChange={(e) => setNewNode({ ...newNode, activeDispatches: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
            <button
              type="button"
              onClick={() => setShowAddNodeModal(false)}
              className="cursor-pointer rounded-xl border border-outline-variant/60 px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary/90"
            >
              Add Transit Node
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default Settings;
