import { useEffect, useMemo, useRef } from "react";
import PageHeader from "../components/PageHeader";
import ListFilterToolbar, {
  ToolbarSelect,
} from "../components/ListFilterToolbar";
import {
  ORDER_STATUS_FILTERS,
} from "../constants/orders";
import { useOrders } from "../hooks";

const ORDER_STATUS_CHOICES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

// Colour tokens per status
const STATUS_CONFIG = {
  pending: {
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]",
    pill: "bg-amber-50 border-amber-200 text-amber-700",
    btn: "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
    activebtn: "border-amber-500 bg-amber-100 text-amber-800 ring-2 ring-amber-300/50",
  },
  processing: {
    dot: "bg-primary shadow-[0_0_8px_rgba(109,59,215,0.4)]",
    pill: "bg-primary/10 border-primary/30 text-primary",
    btn: "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10",
    activebtn: "border-primary bg-primary/15 text-primary ring-2 ring-primary/30",
  },
  shipped: {
    dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]",
    pill: "bg-blue-50 border-blue-200 text-blue-700",
    btn: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    activebtn: "border-blue-500 bg-blue-100 text-blue-800 ring-2 ring-blue-300/50",
  },
  delivered: {
    dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
    pill: "bg-emerald-50 border-emerald-200 text-emerald-700",
    btn: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    activebtn: "border-emerald-500 bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300/50",
  },
  cancelled: {
    dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]",
    pill: "bg-rose-50 border-rose-200 text-rose-700",
    btn: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
    activebtn: "border-rose-500 bg-rose-100 text-rose-800 ring-2 ring-rose-300/50",
  },
};

function getStatusConfig(status) {
  const key = String(status || "").toLowerCase().trim();
  return (
    STATUS_CONFIG[key] || {
      dot: "bg-outline",
      pill: "bg-surface-container border-outline-variant text-on-surface-variant",
      btn: "border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
      activebtn: "border-outline bg-surface-container-high text-on-surface ring-2 ring-outline/30",
    }
  );
}

const cardClass =
  "rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-6 shadow-[0_16px_45px_rgba(50,35,75,0.08)] backdrop-blur-xl";

// ── Order Detail Drawer ──────────────────────────────────────────────────────
function OrderDrawer({ order, onClose, onStatusChange, updatingOrderId }) {
  const drawerRef = useRef(null);
  const isUpdating = updatingOrderId === order?.id;
  const cfg = getStatusConfig(order?.status);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Focus trap — focus drawer on open
  useEffect(() => {
    drawerRef.current?.focus();
  }, []);

  if (!order) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
      />

      {/* Drawer panel */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        aria-label="Order detail"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-surface shadow-[−20px_0_60px_rgba(50,35,75,0.18)] outline-none"
        style={{ animation: "slideInRight 0.22s cubic-bezier(0.32,0.72,0,1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 px-6 py-4">
          <div>
            <p className="font-label-mono text-[10px] uppercase tracking-widest text-primary">
              Order Details
            </p>
            <h2 className="mt-0.5 font-headline-sm text-lg font-semibold tracking-tight text-on-surface">
              {order.id}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close order details"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface active:scale-90"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Current status pill */}
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${cfg.dot}`}
            />
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${cfg.pill}`}>
              {order.status}
            </span>
            {isUpdating && (
              <span className="material-symbols-outlined animate-spin text-[18px] text-primary">
                progress_activity
              </span>
            )}
          </div>

          {/* Info rows */}
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 divide-y divide-outline-variant/30 overflow-hidden">
            {[
              { icon: "person", label: "Customer", value: order.customer },
              { icon: "mail", label: "Email", value: order.email },
              { icon: "inventory_2", label: "Product", value: order.product },
              { icon: "calendar_today", label: "Date", value: order.date },
              { icon: "payments", label: "Total", value: order.total },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 px-4 py-3">
                <span className="material-symbols-outlined mt-0.5 text-[16px] text-on-surface-variant shrink-0">
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-on-surface break-words">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Change Status */}
          <div>
            <p className="mb-3 font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
              Change Status
            </p>
            <div className="grid grid-cols-1 gap-2">
              {ORDER_STATUS_CHOICES.map((choice) => {
                const choiceCfg = getStatusConfig(choice);
                const isActive = order.status === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    disabled={isActive || isUpdating}
                    onClick={() => onStatusChange(order, choice)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-default active:scale-[0.98] ${
                      isActive ? choiceCfg.activebtn : choiceCfg.btn
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 rounded-full shrink-0 ${choiceCfg.dot}`}
                    />
                    <span className="flex-1 text-left">{choice}</span>
                    {isActive && (
                      <span className="material-symbols-outlined text-[16px]">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer — Copy ID */}
        <div className="border-t border-outline-variant/40 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(order.id);
              }
            }}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low py-2.5 text-sm text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            Copy Order ID
          </button>
        </div>
      </aside>

      {/* Slide-in keyframe */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

// ── Main Orders Page ─────────────────────────────────────────────────────────
function Orders() {
  const {
    orders: filteredOrders,
    rawOrdersCount,
    isLoading: loading,
    summaryCards,
    searchQuery,
    setSearchQuery,
    statusTab,
    setStatusTab,
    sortBy,
    setSortBy,
    tabCounts,
    updatingOrderId,
    notification,
    setNotification,
    drawerOrder,
    setDrawerOrder,
    updateOrderStatus: handleStatusChange,
    handleResetFilters,
  } = useOrders();

  const orderTabs = useMemo(
    () => ORDER_STATUS_FILTERS.map((st) => ({ id: st, label: st, count: tabCounts[st] ?? 0 })),
    [tabCounts]
  );

  const statusOptions = [
    { value: "All", label: "All statuses" },
    { value: "Processing", label: "Processing" },
    { value: "Shipped", label: "Shipped" },
    { value: "Delivered", label: "Delivered" },
    { value: "Pending", label: "Pending" },
    { value: "Cancelled", label: "Cancelled" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "total_desc", label: "Total: high to low" },
    { value: "total_asc", label: "Total: low to high" },
    { value: "customer_asc", label: "Customer: A to Z" },
  ];

  const hasActiveFilters =
    statusTab !== "All" || Boolean(searchQuery.trim()) || sortBy !== "newest";

  return (
    <>
      <PageHeader title="Orders" buttonLabel="Create Order" buttonTo="/orders/create-order" />

      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-10">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">

          {/* Minimal Header */}
          <section>
            <p className="font-label-mono text-[10px] uppercase tracking-[0.2em] text-primary">Commerce</p>
            <h1 className="mt-1 font-headline-lg text-2xl tracking-tight md:text-headline-lg">Orders</h1>
            <p className="mt-1 text-body-base text-on-surface-variant">Track and manage customer purchases.</p>
          </section>

          {/* Toast Notification */}
          {notification && (
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm transition-all ${
                notification.type === "error"
                  ? "bg-error-container/80 text-on-error-container border-error/30"
                  : "bg-primary-container/80 text-on-primary-container border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  {notification.type === "error" ? "error" : "check_circle"}
                </span>
                <span className="font-medium">{notification.message}</span>
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setNotification(null)}
                className="p-1 hover:opacity-80 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {/* Summary Cards */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {summaryCards.map((item) => (
              <article key={item.label} className={`${cardClass} flex items-center justify-between`}>
                <div>
                  <p className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{item.value}</p>
                </div>
                <span className="material-symbols-outlined rounded-2xl bg-primary-container p-3.5 text-primary">
                  {item.icon}
                </span>
              </article>
            ))}
          </section>

          {/* Filter Toolbar */}
          <ListFilterToolbar
            tabs={orderTabs}
            activeTab={statusTab}
            onTabChange={setStatusTab}
            searchPlaceholder="Search orders by ID, customer, product, or email..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalFilteredCount={filteredOrders.length}
            totalCount={rawOrdersCount}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
          >
            <ToolbarSelect ariaLabel="Filter order status" value={statusTab} onChange={setStatusTab} options={statusOptions} />
            <ToolbarSelect ariaLabel="Sort orders" value={sortBy} onChange={setSortBy} options={sortOptions} />
          </ListFilterToolbar>

          {/* Orders Table */}
          <section className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container/70 shadow-[0_16px_45px_rgba(50,35,75,0.08)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-surface-container-low font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-3.5">Order</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Product</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Total</th>
                    <th className="px-6 py-3.5 w-10 text-right">
                      <span className="sr-only">Copy</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-xs text-on-surface-variant font-label-mono">
                        <span className="material-symbols-outlined animate-spin text-[20px] text-primary mr-2 align-middle">
                          progress_activity
                        </span>
                        Loading orders from server...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
                          <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                        </div>
                        <p className="mt-3 font-semibold text-on-surface">No orders found</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {hasActiveFilters ? "Try adjusting your search query or status tab." : "No client orders have been placed in this store yet."}
                        </p>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 font-label-mono text-xs uppercase tracking-wider text-on-primary transition-colors hover:bg-primary/90 active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
                            Reset filters
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const cfg = getStatusConfig(order.status);
                      const isUpdating = updatingOrderId === order.id;
                      const isOpen = drawerOrder?.id === order.id;
                      return (
                        <tr
                          key={order.id}
                          onClick={() => setDrawerOrder(order)}
                          className={`cursor-pointer transition-colors hover:bg-primary/5 ${isOpen ? "bg-primary/5" : ""}`}
                        >
                          <td className="px-6 py-4 font-label-mono text-xs font-semibold text-primary">
                            {order.id}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-on-surface">{order.customer}</p>
                            <p className="text-xs text-on-surface-variant">{order.email}</p>
                          </td>
                          <td className="px-6 py-4 text-on-surface">{order.product}</td>
                          <td className="px-6 py-4 text-on-surface-variant">{order.date}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${cfg.pill}`}>
                              {isUpdating ? (
                                <span className="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>
                              ) : (
                                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                              )}
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold tabular-nums">{order.total}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              title="Copy Order ID"
                              aria-label={`Copy order ID ${order.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (navigator?.clipboard?.writeText) {
                                  navigator.clipboard.writeText(order.id);
                                  setNotification({
                                    type: "success",
                                    message: `Order ID ${order.id} copied to clipboard`,
                                  });
                                }
                              }}
                              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface-variant transition-all hover:border-primary/40 hover:bg-surface-container-high hover:text-primary active:scale-95"
                            >
                              <span className="material-symbols-outlined text-[15px]">content_copy</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* Row click hint */}
            <p className="px-6 py-3 text-[11px] text-on-surface-variant/60 border-t border-outline-variant/20">
              Click any row to view details and change status
            </p>
          </section>
        </div>
      </main>

      {/* Slide-out Drawer */}
      {drawerOrder && (
        <OrderDrawer
          order={drawerOrder}
          onClose={() => setDrawerOrder(null)}
          onStatusChange={handleStatusChange}
          updatingOrderId={updatingOrderId}
        />
      )}
    </>
  );
}

export default Orders;