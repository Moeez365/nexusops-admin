import { useEffect, useState } from "react";
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

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showAddCurrencyModal, setShowAddCurrencyModal] = useState(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);

  // 1. Store Profile
  const [storeProfile, setStoreProfile] = useState({
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
  });

  // 2. Commerce
  const [commerce, setCommerce] = useState({
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
  });

  // 3. Payments
  const [payments, setPayments] = useState({
    defaultMethod: "Credit Card",
    escrowStatus: "Verified",
    gateways: {
      stripe: {
        enabled: true,
        testMode: true,
        publishableKey: "pk_test_sample_nexaops",
        secretKey: "",
        webhookSecret: "",
      },
      paypal: {
        enabled: true,
        mode: "sandbox",
        clientId: "sb_client_nexaops",
        clientSecret: "",
      },
      bankTransfer: {
        enabled: true,
        bankName: "Banque Privée Edmond de Rothschild",
        iban: "FR76 3000 4000 1234 5678 9012 345",
        bic: "ROTHFR2PXXX",
        instructions: "Please include your Order ID in the transfer reference for immediate atelier clearing.",
      },
      cashOnDelivery: {
        enabled: false,
        maxAmount: 3000,
        instructions: "Available only for metropolitan concierge delivery.",
      },
      cryptoEscrow: {
        enabled: true,
        network: "Ethereum / USDT",
        walletAddress: "0x71C...NexaOpsVault",
        instructions: "Locked in smart escrow pending physical delivery inspection and valet sign-off.",
      },
    },
  });

  // 4. Fulfillment
  const [fulfillment, setFulfillment] = useState({
    securityReviewRequired: true,
    ordersNeedingIdentityReview: 3,
    shippingZones: [
      {
        id: "zone-1",
        name: "Western Europe Atelier Priority",
        regions: ["France", "Switzerland", "Monaco", "Italy", "Germany", "United Kingdom"],
        rate: 0,
        freeThreshold: 1000,
        estimatedDays: "1-2 business days",
        isActive: true,
      },
      {
        id: "zone-2",
        name: "North America Armored Courier",
        regions: ["United States", "Canada"],
        rate: 150,
        freeThreshold: 2500,
        estimatedDays: "2-3 business days",
        isActive: true,
      },
      {
        id: "zone-3",
        name: "Middle East & GCC Valet",
        regions: ["United Arab Emirates", "Saudi Arabia", "Qatar"],
        rate: 200,
        freeThreshold: 3000,
        estimatedDays: "2-4 business days",
        isActive: true,
      },
      {
        id: "zone-4",
        name: "Asia-Pacific Diplomatic Express",
        regions: ["Japan", "Singapore", "Hong Kong"],
        rate: 250,
        freeThreshold: 3500,
        estimatedDays: "3-5 business days",
        isActive: true,
      },
    ],
    transitNodes: [
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
        statusColor: "bg-rose-500",
        activeDispatches: 1,
      },
    ],
  });

  // 5. Security & Alerts
  const [securityAndAlerts, setSecurityAndAlerts] = useState({
    orderAlerts: true,
    lowStockAlerts: true,
    requireTwoFactor: false,
    staffUsersCount: 8,
    syncStatus: "NexaOps synced",
  });

  // 6. Analytics Defaults
  const [analyticsDefaults, setAnalyticsDefaults] = useState({
    defaultTimeRange: "7D",
    targets: {
      monthlyRevenueTarget: 150000,
      orderVolumeTarget: 1500,
      activeCustomersTarget: 4000,
      avgOrderValueTarget: 120,
    },
  });

  // New Zone Form State
  const [newZone, setNewZone] = useState({
    name: "",
    regions: "",
    rate: 0,
    freeThreshold: 1500,
    estimatedDays: "2-4 business days",
  });

  // New Currency Form State
  const [newCurrency, setNewCurrency] = useState({
    code: "",
    symbol: "",
    name: "",
    exchangeRate: 1.0,
  });

  // New Transit Node Form State
  const [newNode, setNewNode] = useState({
    name: "",
    detail: "Active dispatch",
    statusColor: "bg-primary",
    activeDispatches: 1,
  });

  // Helper to apply loaded database settings
  const applyLoadedSettings = (data) => {
    if (data.storeProfile) {
      setStoreProfile((prev) => ({
        ...prev,
        ...data.storeProfile,
        address: { ...prev.address, ...(data.storeProfile.address || {}) },
      }));
    }
    if (data.commerce) {
      setCommerce((prev) => ({
        ...prev,
        ...data.commerce,
        supportedCurrencies: data.commerce.supportedCurrencies || prev.supportedCurrencies,
      }));
    }
    if (data.payments) {
      setPayments((prev) => ({
        ...prev,
        ...data.payments,
        gateways: {
          ...prev.gateways,
          ...(data.payments.gateways || {}),
        },
      }));
    }
    if (data.fulfillment) {
      setFulfillment((prev) => ({
        ...prev,
        ...data.fulfillment,
        shippingZones: data.fulfillment.shippingZones || prev.shippingZones,
        transitNodes: data.fulfillment.transitNodes || prev.transitNodes,
      }));
    }
    if (data.securityAndAlerts) {
      setSecurityAndAlerts((prev) => ({
        ...prev,
        ...data.securityAndAlerts,
      }));
    }
    if (data.analyticsDefaults) {
      setAnalyticsDefaults((prev) => ({
        ...prev,
        ...data.analyticsDefaults,
        targets: { ...prev.targets, ...(data.analyticsDefaults.targets || {}) },
      }));
    }
  };

  // Load store settings from backend on mount
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

  // Save all settings to backend
  const handleSave = async () => {
    try {
      setSaving(true);
      setNotification(null);

      const payload = {
        storeProfile,
        commerce: {
          ...commerce,
          defaultTaxRate: Number(commerce.defaultTaxRate) || 0,
          defaultShippingFee: Number(commerce.defaultShippingFee) || 0,
          freeShippingThreshold: Number(commerce.freeShippingThreshold) || 0,
          lowStockAlertThreshold: Number(commerce.lowStockAlertThreshold) || 1,
        },
        payments,
        fulfillment,
        securityAndAlerts: {
          ...securityAndAlerts,
          staffUsersCount: Number(securityAndAlerts.staffUsersCount) || 1,
        },
        analyticsDefaults,
      };

      const res = await updateStoreSettings(payload);
      if (res?.success) {
        setNotification({
          type: "success",
          message: "All settings, commerce rules, gateways, and fulfillment saved to database successfully.",
        });
        if (res.data) {
          applyLoadedSettings(res.data);
        }
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setNotification({
        type: "error",
        message: err?.response?.data?.message || "Failed to save settings to server.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset settings to factory defaults
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
      console.error("Failed to reset settings:", err);
      setNotification({
        type: "error",
        message: err?.response?.data?.message || "Failed to reset settings.",
      });
    } finally {
      setResetting(false);
    }
  };

  // Add a new shipping zone
  const handleAddZone = (e) => {
    e.preventDefault();
    if (!newZone.name.trim()) return;

    const regionsList = newZone.regions
      ? newZone.regions.split(",").map((r) => r.trim()).filter(Boolean)
      : [];

    const zoneToAdd = {
      id: `zone-${Date.now()}`,
      name: newZone.name.trim(),
      regions: regionsList,
      rate: Number(newZone.rate) || 0,
      freeThreshold: Number(newZone.freeThreshold) || 0,
      estimatedDays: newZone.estimatedDays || "2-4 business days",
      isActive: true,
    };

    setFulfillment((prev) => ({
      ...prev,
      shippingZones: [...prev.shippingZones, zoneToAdd],
    }));

    setNewZone({
      name: "",
      regions: "",
      rate: 0,
      freeThreshold: 1500,
      estimatedDays: "2-4 business days",
    });
    setShowAddZoneModal(false);
    setNotification({
      type: "success",
      message: `Shipping zone "${zoneToAdd.name}" added. Click "Save All Changes" to persist.`,
    });
  };

  // Remove a shipping zone
  const handleRemoveZone = (id) => {
    setFulfillment((prev) => ({
      ...prev,
      shippingZones: prev.shippingZones.filter((z) => z.id !== id && z._id !== id),
    }));
  };

  // Add a new currency
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

    setCommerce((prev) => ({
      ...prev,
      supportedCurrencies: [...prev.supportedCurrencies, currToAdd],
    }));

    setNewCurrency({ code: "", symbol: "", name: "", exchangeRate: 1.0 });
    setShowAddCurrencyModal(false);
    setNotification({
      type: "success",
      message: `Currency "${currToAdd.code}" added. Click "Save All Changes" to persist.`,
    });
  };

  // Remove a supported currency
  const handleRemoveCurrency = (code) => {
    if (code === commerce.defaultCurrency) {
      setNotification({
        type: "error",
        message: "Cannot remove the store's default currency.",
      });
      return;
    }
    setCommerce((prev) => ({
      ...prev,
      supportedCurrencies: prev.supportedCurrencies.filter((c) => c.code !== code),
    }));
  };

  // Add transit node
  const handleAddNode = (e) => {
    e.preventDefault();
    if (!newNode.name.trim()) return;

    const nodeToAdd = {
      name: newNode.name.trim(),
      detail: newNode.detail.trim(),
      statusColor: newNode.statusColor,
      activeDispatches: Number(newNode.activeDispatches) || 0,
    };

    setFulfillment((prev) => ({
      ...prev,
      transitNodes: [...prev.transitNodes, nodeToAdd],
    }));

    setNewNode({
      name: "",
      detail: "Active dispatch",
      statusColor: "bg-primary",
      activeDispatches: 1,
    });
    setShowAddNodeModal(false);
    setNotification({
      type: "success",
      message: `Transit node "${nodeToAdd.name}" added. Click "Save All Changes" to persist.`,
    });
  };

  // Remove transit node
  const handleRemoveNode = (name) => {
    setFulfillment((prev) => ({
      ...prev,
      transitNodes: prev.transitNodes.filter((n) => n.name !== name),
    }));
  };

  // Dynamic KPI summary cards matching current state
  const summaryCards = [
    {
      label: "Store status",
      value: storeProfile.storeStatus,
      icon: "storefront",
    },
    {
      label: "Payments",
      value: payments.escrowStatus,
      icon: "payments",
    },
    {
      label: "Shipping zones",
      value: `${fulfillment.shippingZones.length} zones`,
      icon: "local_shipping",
    },
    {
      label: "Team access",
      value: `${securityAndAlerts.staffUsersCount} users`,
      icon: "group",
    },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        buttonLabel={saving ? "Saving..." : "Save All Changes"}
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
                  loading ? "bg-amber-500 animate-ping" : "bg-primary animate-pulse"
                }`}
              />
              {loading ? "Syncing database..." : securityAndAlerts.syncStatus || "NexaOps synced"}
            </div>
          </section>

          {/* Toast Notification */}
          {notification && (
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm transition-all shadow-md backdrop-blur-md ${
                notification.type === "error"
                  ? "bg-rose-500/10 text-rose-700 border-rose-500/30"
                  : "bg-primary-container/90 text-on-primary-container border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">
                  {notification.type === "error" ? "error" : "check_circle"}
                </span>
                <span className="font-medium">{notification.message}</span>
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setNotification(null)}
                className="cursor-pointer p-1 hover:opacity-75"
              >
                <span className="material-symbols-outlined text-sm">close</span>
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

              {/* ── TAB 1: Store Profile ─────────────────────────────────────── */}
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
                          onChange={(e) =>
                            setStoreProfile({ ...storeProfile, storeName: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Brand tagline">
                        <input
                          type="text"
                          value={storeProfile.tagline}
                          onChange={(e) =>
                            setStoreProfile({ ...storeProfile, tagline: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Support email">
                        <input
                          type="email"
                          value={storeProfile.supportEmail}
                          onChange={(e) =>
                            setStoreProfile({ ...storeProfile, supportEmail: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Support phone">
                        <input
                          type="tel"
                          value={storeProfile.supportPhone}
                          onChange={(e) =>
                            setStoreProfile({ ...storeProfile, supportPhone: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Store status">
                        <select
                          value={storeProfile.storeStatus}
                          onChange={(e) =>
                            setStoreProfile({ ...storeProfile, storeStatus: e.target.value })
                          }
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
                          onChange={(e) =>
                            setStoreProfile({ ...storeProfile, brandBadge: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Country">
                        <select
                          value={storeProfile.country}
                          onChange={(e) =>
                            setStoreProfile({ ...storeProfile, country: e.target.value })
                          }
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
                          onChange={(e) =>
                            setStoreProfile({ ...storeProfile, timezone: e.target.value })
                          }
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
                            onChange={(e) =>
                              setStoreProfile({
                                ...storeProfile,
                                address: { ...storeProfile.address, street: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>

                      <Field label="City">
                        <input
                          type="text"
                          value={storeProfile.address?.city || ""}
                          onChange={(e) =>
                            setStoreProfile({
                              ...storeProfile,
                              address: { ...storeProfile.address, city: e.target.value },
                            })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="State / Region">
                        <input
                          type="text"
                          value={storeProfile.address?.state || ""}
                          onChange={(e) =>
                            setStoreProfile({
                              ...storeProfile,
                              address: { ...storeProfile.address, state: e.target.value },
                            })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Postal code">
                        <input
                          type="text"
                          value={storeProfile.address?.postalCode || ""}
                          onChange={(e) =>
                            setStoreProfile({
                              ...storeProfile,
                              address: { ...storeProfile.address, postalCode: e.target.value },
                            })
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </section>
                </div>
              )}

              {/* ── TAB 2: Commerce & Tax ───────────────────────────────────── */}
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
                            setCommerce({
                              ...commerce,
                              defaultCurrency: code,
                              currencySymbol: matched ? matched.symbol : "€",
                            });
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
                          onChange={(e) =>
                            setCommerce({ ...commerce, currencySymbol: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Tax mode">
                        <select
                          value={commerce.taxMode}
                          onChange={(e) =>
                            setCommerce({ ...commerce, taxMode: e.target.value })
                          }
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
                          onChange={(e) =>
                            setCommerce({ ...commerce, defaultTaxRate: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Free shipping threshold ($)">
                        <input
                          type="number"
                          min="0"
                          value={commerce.freeShippingThreshold}
                          onChange={(e) =>
                            setCommerce({ ...commerce, freeShippingThreshold: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Default shipping fee ($)">
                        <input
                          type="number"
                          min="0"
                          value={commerce.defaultShippingFee}
                          onChange={(e) =>
                            setCommerce({ ...commerce, defaultShippingFee: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Low-stock alert threshold">
                        <input
                          type="number"
                          min="1"
                          value={commerce.lowStockAlertThreshold}
                          onChange={(e) =>
                            setCommerce({ ...commerce, lowStockAlertThreshold: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Order ID prefix">
                        <input
                          type="text"
                          value={commerce.orderPrefix}
                          onChange={(e) =>
                            setCommerce({ ...commerce, orderPrefix: e.target.value })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <div className="flex items-end">
                        <div className="w-full">
                          <ToggleRow
                            title="Allow guest checkout"
                            detail="Let clients purchase without registration."
                            enabled={commerce.allowGuestCheckout}
                            onChange={(val) =>
                              setCommerce({ ...commerce, allowGuestCheckout: val })
                            }
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

              {/* ── TAB 3: Payments & Escrow ─────────────────────────────────── */}
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
                          onChange={(e) =>
                            setPayments({ ...payments, defaultMethod: e.target.value })
                          }
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
                          onChange={(e) =>
                            setPayments({ ...payments, escrowStatus: e.target.value })
                          }
                          className={inputClass}
                        >
                          <option value="Verified">Verified &amp; Insured</option>
                          <option value="Pending Review">Pending Review</option>
                          <option value="Configured">Configured (Sandbox)</option>
                        </select>
                      </Field>
                    </div>
                  </section>

                  {/* Gateway 1: Stripe */}
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
                            setPayments({
                              ...payments,
                              gateways: {
                                ...payments.gateways,
                                stripe: {
                                  ...payments.gateways?.stripe,
                                  testMode: e.target.checked,
                                },
                              },
                            })
                          }
                          className="h-4 w-4 rounded accent-primary cursor-pointer"
                        />
                        <button
                          type="button"
                          role="switch"
                          aria-checked={payments.gateways?.stripe?.enabled}
                          onClick={() =>
                            setPayments({
                              ...payments,
                              gateways: {
                                ...payments.gateways,
                                stripe: {
                                  ...payments.gateways?.stripe,
                                  enabled: !payments.gateways?.stripe?.enabled,
                                },
                              },
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
                            setPayments({
                              ...payments,
                              gateways: {
                                ...payments.gateways,
                                stripe: {
                                  ...payments.gateways?.stripe,
                                  publishableKey: e.target.value,
                                },
                              },
                            })
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
                            setPayments({
                              ...payments,
                              gateways: {
                                ...payments.gateways,
                                stripe: {
                                  ...payments.gateways?.stripe,
                                  secretKey: e.target.value,
                                },
                              },
                            })
                          }
                          className={inputClass}
                          placeholder="sk_test_••••••••••••"
                        />
                      </Field>
                    </div>
                  </section>

                  {/* Gateway 2: Bank Wire Transfer */}
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
                          setPayments({
                            ...payments,
                            gateways: {
                              ...payments.gateways,
                              bankTransfer: {
                                ...payments.gateways?.bankTransfer,
                                enabled: !payments.gateways?.bankTransfer?.enabled,
                              },
                            },
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
                            setPayments({
                              ...payments,
                              gateways: {
                                ...payments.gateways,
                                bankTransfer: {
                                  ...payments.gateways?.bankTransfer,
                                  bankName: e.target.value,
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="IBAN">
                        <input
                          type="text"
                          value={payments.gateways?.bankTransfer?.iban || ""}
                          onChange={(e) =>
                            setPayments({
                              ...payments,
                              gateways: {
                                ...payments.gateways,
                                bankTransfer: {
                                  ...payments.gateways?.bankTransfer,
                                  iban: e.target.value,
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="BIC / SWIFT">
                        <input
                          type="text"
                          value={payments.gateways?.bankTransfer?.bic || ""}
                          onChange={(e) =>
                            setPayments({
                              ...payments,
                              gateways: {
                                ...payments.gateways,
                                bankTransfer: {
                                  ...payments.gateways?.bankTransfer,
                                  bic: e.target.value,
                                },
                              },
                            })
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
                              setPayments({
                                ...payments,
                                gateways: {
                                  ...payments.gateways,
                                  bankTransfer: {
                                    ...payments.gateways?.bankTransfer,
                                    instructions: e.target.value,
                                  },
                                },
                              })
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    </div>
                  </section>

                  {/* Gateway 3: Crypto Escrow */}
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
                          setPayments({
                            ...payments,
                            gateways: {
                              ...payments.gateways,
                              cryptoEscrow: {
                                ...payments.gateways?.cryptoEscrow,
                                enabled: !payments.gateways?.cryptoEscrow?.enabled,
                              },
                            },
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
                            setPayments({
                              ...payments,
                              gateways: {
                                ...payments.gateways,
                                cryptoEscrow: {
                                  ...payments.gateways?.cryptoEscrow,
                                  network: e.target.value,
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Escrow vault address">
                        <input
                          type="text"
                          value={payments.gateways?.cryptoEscrow?.walletAddress || ""}
                          onChange={(e) =>
                            setPayments({
                              ...payments,
                              gateways: {
                                ...payments.gateways,
                                cryptoEscrow: {
                                  ...payments.gateways?.cryptoEscrow,
                                  walletAddress: e.target.value,
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </section>
                </div>
              )}

              {/* ── TAB 4: Shipping & Transit ────────────────────────────────── */}
              {activeTab === "fulfillment" && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Shipping Zones */}
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
                              onClick={() => {
                                setFulfillment((prev) => ({
                                  ...prev,
                                  shippingZones: prev.shippingZones.map((z) =>
                                    z.id === zone.id ? { ...z, isActive: !z.isActive } : z
                                  ),
                                }));
                              }}
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

                  {/* Logistics Transit Nodes */}
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

              {/* ── TAB 5: Security & Team ───────────────────────────────────── */}
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
                        onChange={(val) =>
                          setSecurityAndAlerts({ ...securityAndAlerts, orderAlerts: val })
                        }
                      />

                      <ToggleRow
                        title="Low-stock inventory alerts"
                        detail="Notify atelier inventory managers before items drop below configured safety threshold."
                        enabled={securityAndAlerts.lowStockAlerts}
                        onChange={(val) =>
                          setSecurityAndAlerts({ ...securityAndAlerts, lowStockAlerts: val })
                        }
                      />

                      <ToggleRow
                        title="Require two-factor authentication (2FA)"
                        detail="Enforce cryptographic or authenticator verification for all staff accounts accessing order data."
                        enabled={securityAndAlerts.requireTwoFactor}
                        onChange={(val) =>
                          setSecurityAndAlerts({ ...securityAndAlerts, requireTwoFactor: val })
                        }
                      />

                      <div className="pt-2">
                        <Field label="Active staff users count">
                          <input
                            type="number"
                            min="1"
                            value={securityAndAlerts.staffUsersCount}
                            onChange={(e) =>
                              setSecurityAndAlerts({
                                ...securityAndAlerts,
                                staffUsersCount: e.target.value,
                              })
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

              {/* ── TAB 6: Analytics Targets ─────────────────────────────────── */}
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
                          onChange={(e) =>
                            setAnalyticsDefaults({
                              ...analyticsDefaults,
                              defaultTimeRange: e.target.value,
                            })
                          }
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
                          value={analyticsDefaults.targets?.monthlyRevenueTarget || 150000}
                          onChange={(e) =>
                            setAnalyticsDefaults({
                              ...analyticsDefaults,
                              targets: {
                                ...analyticsDefaults.targets,
                                monthlyRevenueTarget: Number(e.target.value) || 0,
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Order volume target (units)">
                        <input
                          type="number"
                          min="0"
                          value={analyticsDefaults.targets?.orderVolumeTarget || 1500}
                          onChange={(e) =>
                            setAnalyticsDefaults({
                              ...analyticsDefaults,
                              targets: {
                                ...analyticsDefaults.targets,
                                orderVolumeTarget: Number(e.target.value) || 0,
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Active customers target">
                        <input
                          type="number"
                          min="0"
                          value={analyticsDefaults.targets?.activeCustomersTarget || 4000}
                          onChange={(e) =>
                            setAnalyticsDefaults({
                              ...analyticsDefaults,
                              targets: {
                                ...analyticsDefaults.targets,
                                activeCustomersTarget: Number(e.target.value) || 0,
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Average order value target ($)">
                        <input
                          type="number"
                          min="0"
                          value={analyticsDefaults.targets?.avgOrderValueTarget || 120}
                          onChange={(e) =>
                            setAnalyticsDefaults({
                              ...analyticsDefaults,
                              targets: {
                                ...analyticsDefaults.targets,
                                avgOrderValueTarget: Number(e.target.value) || 0,
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </section>
                </div>
              )}
            </div>

            {/* ── Right Aside: Fulfillment Focus & Transit Network ───────── */}
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
                  Currently <span className="font-semibold text-primary">{fulfillment.ordersNeedingIdentityReview} orders</span> awaiting atelier release.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Authorize All"}
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

      {/* ── MODAL: Reset Store Settings to Defaults ──────────────────────── */}
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

      {/* ── MODAL: Add Shipping Zone ─────────────────────────────────────── */}
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

      {/* ── MODAL: Add Supported Currency ────────────────────────────────── */}
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

      {/* ── MODAL: Add Transit Node ──────────────────────────────────────── */}
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
