import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { createOrder } from "../api/orders";
import { getProducts } from "../api/products";
import { getStoreSettings } from "../api/settings";
import { ShimmerImage } from "../components/common";
import { formatCurrency } from "../utils";

const cardClass =
  "rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-6 shadow-[0_16px_45px_rgba(50,35,75,0.08)] backdrop-blur-xl";

const inputClass =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-body-base text-on-surface placeholder:text-on-surface-variant/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

const inputWithIconClass =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-low pl-10 pr-4 py-2.5 text-body-base text-on-surface placeholder:text-on-surface-variant/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

function CreateOrder() {
  const navigate = useNavigate();

  // Client Details
  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clientTier, setClientTier] = useState("Standard Tier");

  // Currency & Store Settings Defaults
  const [currency, setCurrency] = useState("USD");
  const [availableCurrencies, setAvailableCurrencies] = useState(["EUR", "USD", "AED", "GBP"]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([
    "Credit Card",
    "Bank Transfer",
    "Cash on Delivery",
    "PayPal",
    "Crypto Escrow",
    "Invoice",
  ]);

  // Line Items
  const [items, setItems] = useState([]);

  // Shipping Address
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  // Notes
  const [notes, setNotes] = useState("");

  // Workflow / Status
  const [status, setStatus] = useState("Pending");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [paymentStatus, setPaymentStatus] = useState("Pending");

  // Financial Fees
  const [shippingFee, setShippingFee] = useState(0);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Catalogue modal state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [catalogueProducts, setCatalogueProducts] = useState([]);
  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [isLoadingCatalogue, setIsLoadingCatalogue] = useState(false);

  // Custom item form in modal
  const [customItemMode, setCustomItemMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customSku, setCustomSku] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customQuantity, setCustomQuantity] = useState(1);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load catalogue products and store settings defaults on mount
  useEffect(() => {
    let ignore = false;
    async function initOrderForm() {
      try {
        setIsLoadingCatalogue(true);
        const [productsRes, settingsRes] = await Promise.allSettled([
          getProducts(),
          getStoreSettings(),
        ]);

        if (ignore) return;

        if (productsRes.status === "fulfilled" && productsRes.value?.data) {
          setCatalogueProducts(productsRes.value.data || []);
        }

        if (settingsRes.status === "fulfilled" && settingsRes.value?.data) {
          const { commerce, payments } = settingsRes.value.data;
          if (commerce?.defaultCurrency) {
            setCurrency(commerce.defaultCurrency);
          }
          if (commerce?.supportedCurrencies?.length) {
            const codes = commerce.supportedCurrencies
              .filter((c) => c.isActive !== false)
              .map((c) => c.code);
            if (codes.length > 0) setAvailableCurrencies(codes);
          }
          if (typeof commerce?.defaultShippingFee === "number") {
            setShippingFee(commerce.defaultShippingFee);
          }
          if (payments?.defaultMethod) {
            setPaymentMethod(payments.defaultMethod);
          }
          if (payments?.gateways) {
            const methods = ["Credit Card"];
            if (payments.gateways.bankTransfer?.enabled) methods.push("Bank Transfer");
            if (payments.gateways.paypal?.enabled) methods.push("PayPal");
            if (payments.gateways.cryptoEscrow?.enabled) methods.push("Crypto Escrow");
            if (payments.gateways.cashOnDelivery?.enabled) methods.push("Cash on Delivery");
            methods.push("Invoice");
            setAvailablePaymentMethods([...new Set(methods)]);
          }
        }
      } catch (err) {
        console.error("Failed to load products or store settings:", err);
      } finally {
        if (!ignore) {
          setIsLoadingCatalogue(false);
        }
      }
    }
    initOrderForm();
    return () => {
      ignore = true;
    };
  }, []);

  // Financial calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    const val = subtotal + Number(shippingFee || 0) + Number(tax || 0) - Number(discount || 0);
    return Math.max(0, val);
  }, [subtotal, shippingFee, tax, discount]);

  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [items]);

  // Line Items Handlers
  const handleQuantityChange = (index, delta) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const nextQty = Math.max(1, (Number(item.quantity) || 1) + delta);
        return { ...item, quantity: nextQty };
      }),
    );
  };

  const handleSetQuantity = (index, value) => {
    const parsed = parseInt(value, 10);
    const qty = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantity: qty } : item)),
    );
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddProductFromCatalogue = (product) => {
    const primaryImage = product.images?.[0]?.url || "";
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      product: product._id,
      name: product.name,
      sku: product.slug ? `SKU: ${product.slug.toUpperCase().slice(0, 10)}` : "SKU: BESPOKE",
      price: Number(product.price) || 0,
      quantity: 1,
      image: primaryImage,
    };
    setItems((prev) => [...prev, newItem]);
    setIsAddItemModalOpen(false);
  };

  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const price = parseFloat(customPrice) || 0;
    const qty = parseInt(customQuantity, 10) || 1;
    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      product: null,
      name: customName.trim(),
      sku: customSku.trim() ? `SKU: ${customSku.trim().toUpperCase()}` : "SKU: BESPOKE-CUSTOM",
      price,
      quantity: qty,
      image: "",
    };
    setItems((prev) => [...prev, newItem]);
    setCustomName("");
    setCustomSku("");
    setCustomPrice("");
    setCustomQuantity(1);
    setCustomItemMode(false);
    setIsAddItemModalOpen(false);
  };

  // Submission handler
  const handleSubmitOrder = async (overrideStatus = null, overridePaymentStatus = null) => {
    if (isSubmitting) return;

    setErrorMessage("");
    setSuccessMessage("");

    // Validation
    if (!customer.trim()) {
      setErrorMessage("Client Full Name is required.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Client Email Address is required.");
      return;
    }
    if (items.length === 0) {
      setErrorMessage("Please add at least one item to the order.");
      return;
    }

    const finalStatus = overrideStatus || status;
    const finalPaymentStatus = overridePaymentStatus || paymentStatus;

    const payload = {
      customer: customer.trim(),
      email: email.trim(),
      phone: phone.trim(),
      status: finalStatus,
      paymentMethod,
      paymentStatus: finalPaymentStatus,
      currency,
      subtotal,
      shippingFee: Number(shippingFee) || 0,
      tax: Number(tax) || 0,
      discount: Number(discount) || 0,
      total: totalAmount,
      items: items.map((it) => ({
        product: it.product || null,
        name: it.name,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        image: it.image || "",
      })),
      shippingAddress: {
        street: shippingAddress.street.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        postalCode: shippingAddress.postalCode.trim(),
        country: shippingAddress.country.trim(),
      },
      notes: notes.trim(),
    };

    try {
      setIsSubmitting(true);
      const res = await createOrder(payload);
      if (res?.data) {
        setSuccessMessage(
          `Order ${res.data.orderNumber || "created"} saved successfully! Redirecting to orders...`,
        );
        setTimeout(() => {
          navigate("/orders");
        }, 1200);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to create order. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCatalogue = useMemo(() => {
    if (!catalogueSearch.trim()) return catalogueProducts;
    const q = catalogueSearch.toLowerCase();
    return catalogueProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)),
    );
  }, [catalogueProducts, catalogueSearch]);

  return (
    <>
      <PageHeader
        title="Create Bespoke Order"
        buttonLabel={isSubmitting ? "Processing..." : "Save & Dispatch"}
        buttonIcon="local_shipping"
        buttonDisabled={isSubmitting}
        onButtonClick={() => handleSubmitOrder("Processing", "Paid")}
        secondaryButtonLabel="Save as Draft"
        secondaryButtonIcon="drafts"
        onSecondaryButtonClick={() => handleSubmitOrder("Pending", "Pending")}
      />

      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
          {/* Top Banner / Breadcrumb Area */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link
                  to="/orders"
                  className="font-label-mono text-[10px] uppercase tracking-widest text-primary transition-colors hover:underline"
                >
                  Atelier Operations
                </Link>
                <span className="text-outline text-xs">/</span>
                <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Bespoke Protocol
                </span>
              </div>
              <h1 className="font-headline-lg text-2xl tracking-tight text-on-surface md:text-headline-lg">
                Create Bespoke Order
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSubmitOrder("Pending", "Pending")}
                disabled={isSubmitting}
                className="cursor-pointer rounded-full border border-outline-variant/60 bg-surface-container-high/60 px-5 py-2 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface active:scale-95 disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmitOrder("Processing", "Paid")}
                disabled={isSubmitting}
                className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2 font-title-md text-sm text-on-primary shadow-[0_6px_16px_rgba(109,59,215,0.18)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  local_shipping
                </span>
                <span>Save &amp; Dispatch Order</span>
              </button>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="flex items-center gap-3 rounded-2xl border border-error/30 bg-error-container/80 p-4 text-on-error-container">
              <span className="material-symbols-outlined text-[20px] text-error">
                error
              </span>
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary-container/80 p-4 text-on-primary-container">
              <span className="material-symbols-outlined text-[20px] text-primary">
                check_circle
              </span>
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          )}

          {/* Main Asymmetric Grid Layout (8 cols + 4 cols) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Left Column: Form Details (8 cols) */}
            <div className="space-y-6 lg:col-span-8">
              {/* Customer Information Card */}
              <section className={cardClass}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                      <span className="material-symbols-outlined text-[19px]">
                        person
                      </span>
                    </div>
                    <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                      Client Information
                    </h2>
                  </div>
                  <select
                    value={clientTier}
                    onChange={(e) => setClientTier(e.target.value)}
                    className="cursor-pointer rounded-full border border-secondary-container bg-secondary-container px-3 py-1 font-label-mono text-[10px] uppercase tracking-widest text-on-secondary-container focus:outline-none"
                  >
                    <option value="VIP Tier">VIP Tier</option>
                    <option value="Private Client">Private Client</option>
                    <option value="Standard Tier">Standard Tier</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Client Full Name <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px]">
                        badge
                      </span>
                      <input
                        className={inputWithIconClass}
                        type="text"
                        placeholder="Full name of client"
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Email Address <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px]">
                        mail
                      </span>
                      <input
                        className={inputWithIconClass}
                        type="email"
                        placeholder="client@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Phone Number
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px]">
                        phone
                      </span>
                      <input
                        className={inputWithIconClass}
                        type="text"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Line Items Card */}
              <section className={cardClass}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                      <span className="material-symbols-outlined text-[19px]">
                        inventory_2
                      </span>
                    </div>
                    <div>
                      <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                        Catalogue Items
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        {items.length} {items.length === 1 ? "item" : "items"} selected
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomItemMode(false);
                      setIsAddItemModalOpen(true);
                    }}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 font-label-mono text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary/20 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low/50 p-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
                        <span className="material-symbols-outlined text-2xl">
                          shopping_bag
                        </span>
                      </div>
                      <p className="mt-3 font-semibold text-on-surface">
                        No items added to this order yet
                      </p>
                      <p className="mt-1 max-w-sm text-xs text-on-surface-variant">
                        Click &quot;Add Item&quot; to pick from your catalogue or create custom bespoke items.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomItemMode(false);
                          setIsAddItemModalOpen(true);
                        }}
                        className="mt-4 flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-label-mono text-xs uppercase tracking-wider text-on-primary shadow-sm transition-all hover:bg-primary/90 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Add First Item</span>
                      </button>
                    </div>
                  ) : (
                    items.map((item, index) => {
                      const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
                      return (
                        <div
                          key={item.id || index}
                          className="flex flex-col gap-4 rounded-xl border border-outline-variant/50 bg-surface-container-low/90 p-4 transition-all hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-3.5">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-high">
                              {item.image ? (
                                <ShimmerImage
                                  src={item.image}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-primary/40">
                                  <span className="material-symbols-outlined text-2xl">
                                    inventory_2
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate font-title-md text-sm font-semibold text-on-surface">
                                {item.name}
                              </h3>
                              <p className="font-label-mono text-[10px] uppercase tracking-wider text-outline">
                                {item.sku || "SKU: BESPOKE"}
                              </p>
                              <p className="mt-0.5 text-xs text-on-surface-variant sm:hidden">
                                {formatCurrency(item.price, currency)} each
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 border-t border-outline-variant/30 pt-3 sm:border-t-0 sm:pt-0">
                            {/* Quantity Controls */}
                            <div className="flex items-center rounded-xl border border-outline-variant/60 bg-surface-container">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() => handleQuantityChange(index, -1)}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center text-on-surface-variant hover:text-primary active:scale-90"
                              >
                                <span className="material-symbols-outlined text-[16px]">remove</span>
                              </button>
                              <input
                                className="h-8 w-12 border-x border-outline-variant/60 bg-transparent text-center font-label-mono text-sm font-semibold text-on-surface focus:outline-none"
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleSetQuantity(index, e.target.value)}
                              />
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() => handleQuantityChange(index, 1)}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center text-on-surface-variant hover:text-primary active:scale-90"
                              >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                              </button>
                            </div>

                            {/* Item Total */}
                            <div className="min-w-[100px] text-right">
                              <span className="font-label-mono text-sm font-semibold text-on-surface">
                                {formatCurrency(itemTotal, currency)}
                              </span>
                            </div>

                            {/* Delete Button */}
                            <button
                              type="button"
                              aria-label={`Remove ${item.name}`}
                              onClick={() => handleRemoveItem(index)}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-outline transition-colors hover:bg-error-container hover:text-error active:scale-90"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Destination Address Card */}
              <section className={cardClass}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                    <span className="material-symbols-outlined text-[19px]">
                      local_shipping
                    </span>
                  </div>
                  <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                    Destination Address
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Street Address
                    </label>
                    <input
                      className={inputClass}
                      type="text"
                      placeholder="Street address, suite, apartment..."
                      value={shippingAddress.street}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({ ...prev, street: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      City
                    </label>
                    <input
                      className={inputClass}
                      type="text"
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({ ...prev, city: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      State / Region
                    </label>
                    <input
                      className={inputClass}
                      type="text"
                      placeholder="State / Province / Region"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({ ...prev, state: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Postal Code
                    </label>
                    <input
                      className={inputClass}
                      type="text"
                      placeholder="Postal / ZIP code"
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({ ...prev, postalCode: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Country
                    </label>
                    <input
                      className={inputClass}
                      type="text"
                      placeholder="Country"
                      value={shippingAddress.country}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({ ...prev, country: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </section>

              {/* Atelier / Internal Notes Card */}
              <section className={cardClass}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                    <span className="material-symbols-outlined text-[19px]">
                      edit_note
                    </span>
                  </div>
                  <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                    Atelier Notes
                  </h2>
                </div>
                <textarea
                  className={`${inputClass} min-h-[96px] resize-y`}
                  rows="3"
                  placeholder="Special instructions, bespoke requests, or client packaging notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </section>
            </div>

            {/* Right Column: Workflow & Financial Summary (4 cols) */}
            <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-28">
              {/* Order Workflow Card */}
              <section className={`${cardClass} space-y-4`}>
                <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                  Order Workflow
                </h2>

                {/* Fulfillment Status */}
                <div className="space-y-1.5">
                  <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Fulfillment Status
                  </label>
                  <select
                    className={inputClass}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="Processing">Processing</option>
                    <option value="Pending">Pending (Draft / Queue)</option>
                    <option value="Shipped">Shipped (Dispatched)</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Payment Method & State */}
                <div className="space-y-2">
                  <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Payment Method &amp; State
                  </label>
                  <div className="flex items-center justify-between rounded-xl border border-outline-variant/50 bg-surface-container-low p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        credit_card
                      </span>
                      <select
                        className="bg-transparent text-sm font-medium text-on-surface focus:outline-none cursor-pointer"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        {availablePaymentMethods.map((m) => (
                          <option key={m} value={m} className="bg-surface text-on-surface">
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <select
                      className={`rounded-full px-2.5 py-0.5 font-label-mono text-[10px] uppercase tracking-wider font-semibold border cursor-pointer ${
                        paymentStatus === "Paid"
                          ? "bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]"
                          : paymentStatus === "Pending"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-error-container text-on-error-container border-error/30"
                      }`}
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Refunded">Refunded</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </div>

                {/* Currency Selection */}
                <div className="space-y-1.5 pt-1">
                  <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Currency
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {availableCurrencies.map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setCurrency(curr)}
                        className={`flex-1 min-w-[60px] rounded-lg py-1.5 font-label-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          currency === curr
                            ? "bg-primary text-on-primary shadow-sm font-semibold"
                            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Financial Totals Summary Card */}
              <section className={`${cardClass} space-y-4`}>
                <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                  Financial Summary
                </h2>

                <div className="space-y-2.5 border-b border-outline-variant/40 pb-4 text-sm">
                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>
                      Subtotal ({totalQuantity} {totalQuantity === 1 ? "item" : "items"})
                    </span>
                    <span className="font-label-mono text-on-surface font-medium">
                      {formatCurrency(subtotal, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Shipping (Courier)</span>
                    <div className="flex items-center gap-1">
                      <span className="font-label-mono text-xs text-outline">{currency === "EUR" ? "€" : "$"}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                        className="w-20 rounded-lg border border-outline-variant/40 bg-surface-container px-2 py-1 text-right font-label-mono text-xs text-on-surface focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>VAT / Tax</span>
                    <div className="flex items-center gap-1">
                      <span className="font-label-mono text-xs text-outline">{currency === "EUR" ? "€" : "$"}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={tax}
                        onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                        className="w-20 rounded-lg border border-outline-variant/40 bg-surface-container px-2 py-1 text-right font-label-mono text-xs text-on-surface focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Discount</span>
                    <div className="flex items-center gap-1">
                      <span className="font-label-mono text-xs text-outline">{currency === "EUR" ? "-€" : "-$"}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-20 rounded-lg border border-outline-variant/40 bg-surface-container px-2 py-1 text-right font-label-mono text-xs text-on-surface focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="font-title-md text-base font-semibold text-on-surface">
                    Total Amount
                  </span>
                  <span className="font-headline-md font-label-mono text-2xl font-bold text-primary">
                    {formatCurrency(totalAmount, currency)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitOrder()}
                  className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-title-md text-sm text-on-primary shadow-[0_6px_20px_rgba(109,59,215,0.22)] transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[19px]">
                    verified
                  </span>
                  <span>{isSubmitting ? "Processing Order..." : "Finalize & Authorize"}</span>
                </button>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Add Item to Order Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-outline-variant/60 bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  inventory_2
                </span>
                <h3 className="font-title-md text-lg font-semibold text-on-surface">
                  {customItemMode ? "Add Custom Bespoke Item" : "Select Item from Catalogue"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddItemModalOpen(false)}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 flex rounded-xl bg-surface-container p-1">
              <button
                type="button"
                onClick={() => setCustomItemMode(false)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-label-mono uppercase tracking-wider transition-all ${
                  !customItemMode
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Store Catalogue
              </button>
              <button
                type="button"
                onClick={() => setCustomItemMode(true)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-label-mono uppercase tracking-wider transition-all ${
                  customItemMode
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Custom Bespoke Item
              </button>
            </div>

            {customItemMode ? (
              <form onSubmit={handleAddCustomItem} className="mt-5 space-y-4">
                <div className="space-y-1">
                  <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Item Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Custom Diamond Monogrammed Cuff"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      SKU / Identifier
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BESPOKE-901"
                      value={customSku}
                      onChange={(e) => setCustomSku(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Unit Price ({currency}) <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddItemModalOpen(false)}
                    className="rounded-xl border border-outline-variant/60 px-4 py-2 text-xs font-label-mono uppercase tracking-wider text-on-surface-variant hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-5 py-2 text-xs font-label-mono uppercase tracking-wider text-on-primary shadow-sm hover:bg-primary/90"
                  >
                    Add to Order
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                    search
                  </span>
                  <input
                    type="search"
                    placeholder="Search catalogue by title, category, brand..."
                    value={catalogueSearch}
                    onChange={(e) => setCatalogueSearch(e.target.value)}
                    className={inputWithIconClass}
                  />
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {isLoadingCatalogue ? (
                    <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant">
                      <span className="material-symbols-outlined animate-spin text-2xl text-primary">
                        progress_activity
                      </span>
                      <p className="mt-2 text-xs font-label-mono uppercase tracking-wider">
                        Loading catalogue...
                      </p>
                    </div>
                  ) : filteredCatalogue.length === 0 ? (
                    <div className="py-8 text-center text-on-surface-variant">
                      <p className="text-sm">No products found</p>
                      <p className="text-xs text-outline mt-1">
                        Try a different search term or add a custom item.
                      </p>
                    </div>
                  ) : (
                    filteredCatalogue.map((product) => {
                      const img = product.images?.[0]?.url;
                      return (
                        <div
                          key={product._id}
                          className="flex items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-container-high border border-outline-variant/50">
                              {img ? (
                                <img
                                  src={img}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-primary/40">
                                  <span className="material-symbols-outlined text-[18px]">
                                    inventory_2
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-on-surface">
                                {product.name}
                              </p>
                              <p className="font-label-mono text-[10px] uppercase tracking-wider text-outline">
                                Stock: {product.stock ?? 0} · {product.category || "General"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <span className="font-label-mono text-xs font-semibold text-on-surface">
                              {formatCurrency(product.price, currency)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddProductFromCatalogue(product)}
                              className="rounded-lg bg-primary px-3 py-1.5 font-label-mono text-[10px] uppercase tracking-wider text-on-primary hover:bg-primary/90 active:scale-95"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default CreateOrder;
