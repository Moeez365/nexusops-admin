import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ListFilterToolbar, {
  ToolbarSelect,
} from "../components/ListFilterToolbar";
import { ConfirmModal, ShimmerImage, StatusBadge } from "../components/common";
import { CUSTOMER_TIER_TABS } from "../constants/customers";
import { useCustomers } from "../hooks";
import {
  formatCurrency,
  formatCustomerLocation,
  getCustomerInitials,
} from "../utils";

const cardClass =
  "rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-6 shadow-[0_16px_45px_rgba(50,35,75,0.08)] backdrop-blur-xl";

/**
 * Customers Directory Page
 *
 * Displays live KPI metrics, standardized filter/search controls,
 * and a backend-backed customer ledger wired to AddCustomer and ConfirmModal.
 */
function Customers() {
  const navigate = useNavigate();
  const {
    customers,
    summaryCards,
    tabCounts,
    pagination,
    defaultCurrency,
    isLoading,
    errorMessage,
    notification,
    setNotification,
    searchQuery,
    setSearchQuery,
    tierTab,
    setTierTab,
    sortBy,
    setSortBy,
    page,
    setPage,
    hasActiveFilters,
    handleResetFilters,
    reloadCustomers,
    customerToDelete,
    isDeleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteCustomer,
  } = useCustomers();

  const tabs = useMemo(
    () =>
      CUSTOMER_TIER_TABS.map((tab) => ({
        id: tab.id,
        label: tab.label,
        count: tabCounts[tab.id] ?? 0,
      })),
    [tabCounts]
  );

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "spent_desc", label: "Spent: High to Low" },
    { value: "orders_desc", label: "Orders: Most First" },
    { value: "name_asc", label: "Name: A to Z" },
    { value: "name_desc", label: "Name: Z to A" },
  ];

  const handleEditCustomer = (id) => {
    if (!id) return;
    navigate(`/customers/add-customer?id=${encodeURIComponent(id)}`);
  };

  return (
    <>
      <PageHeader
        title="Customers"
        buttonLabel="Add Customer"
        buttonIcon="person_add"
        buttonTo="/customers/add-customer"
      />

      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-10">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">
          {/* Header Description */}
          <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-label-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                Directory
              </p>
              <h1 className="mt-1 font-headline-lg text-2xl tracking-tight md:text-headline-lg">
                Customers
              </h1>
              <p className="mt-1 text-body-base text-on-surface-variant">
                View and manage your registered clients and VIP patrons.
              </p>
            </div>
            <div className="flex items-center gap-2 font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {tabCounts.all}{" "}
              {tabCounts.all === 1 ? "total customer" : "total customers"}
            </div>
          </section>

          {/* Toast Notification */}
          {notification && (
            <div
              role="alert"
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm transition-all ${
                notification.type === "error"
                  ? "border-error/30 bg-error-container/80 text-on-error-container"
                  : "border-primary/30 bg-primary-container/80 text-on-primary-container"
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
                className="cursor-pointer p-1 hover:opacity-80"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/30 bg-error-container/80 p-4 text-sm text-on-error-container"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  error
                </span>
                <span className="font-medium">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={reloadCustomers}
                className="cursor-pointer rounded-full border border-error/30 bg-surface/80 px-4 py-1.5 font-label-mono text-xs uppercase tracking-wider text-error transition-colors hover:bg-surface"
              >
                Retry
              </button>
            </div>
          )}

          {/* KPI Summary Cards */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {summaryCards.map((item) => (
              <article
                key={item.label}
                className={`${cardClass} flex items-center justify-between`}
              >
                <div>
                  <p className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                    {item.value}
                  </p>
                </div>
                <span className="material-symbols-outlined rounded-2xl bg-primary-container p-3.5 text-primary">
                  {item.icon}
                </span>
              </article>
            ))}
          </section>

          {/* Standardized 2-Row Filter Toolbar */}
          <ListFilterToolbar
            tabs={tabs}
            activeTab={tierTab}
            onTabChange={setTierTab}
            searchPlaceholder="Search by name, email, or location..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalFilteredCount={pagination.total}
            totalCount={tabCounts.all}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
          >
            <ToolbarSelect
              ariaLabel="Sort customers"
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
            />
          </ListFilterToolbar>

          {/* Customers Table */}
          <section className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container/70 shadow-[0_16px_45px_rgba(50,35,75,0.08)] backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-surface-container-low font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5">Orders</th>
                    <th className="px-6 py-3.5">Tier</th>
                    <th className="px-6 py-3.5 text-right">Total Spent</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center font-label-mono text-xs text-on-surface-variant"
                      >
                        <span className="material-symbols-outlined mr-2 animate-spin align-middle text-[20px] text-primary">
                          progress_activity
                        </span>
                        Loading customers from server...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
                          <span className="material-symbols-outlined text-2xl">
                            person_search
                          </span>
                        </div>
                        <p className="mt-3 font-semibold text-on-surface">
                          {hasActiveFilters
                            ? "No matching customers found"
                            : "No customers added yet"}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {hasActiveFilters
                            ? "Try adjusting your search query or tier filter."
                            : "Create your first customer profile to build your directory."}
                        </p>
                        {hasActiveFilters ? (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 font-label-mono text-xs uppercase tracking-wider text-on-primary transition-colors hover:bg-primary/90 active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              filter_alt_off
                            </span>
                            Reset filters
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate("/customers/add-customer")}
                            className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-5 py-2 font-title-md text-xs text-on-primary shadow-sm transition-colors hover:bg-primary/90 active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              person_add
                            </span>
                            Add Customer
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => {
                      const customerId = customer._id || customer.id;
                      const ordersCount = Number(customer.ordersCount) || 0;
                      const totalSpent = Number(customer.totalSpent) || 0;

                      return (
                        <tr
                          key={customerId}
                          onClick={() => handleEditCustomer(customerId)}
                          className="cursor-pointer transition-colors hover:bg-primary/5"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container font-label-mono text-xs font-semibold text-primary">
                                {customer.avatar ? (
                                  <ShimmerImage
                                    src={customer.avatar}
                                    alt={customer.name || "Customer avatar"}
                                    className="h-full w-full object-cover"
                                    fallbackIcon="person"
                                  />
                                ) : (
                                  getCustomerInitials(customer.name)
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate font-medium text-on-surface">
                                    {customer.name}
                                  </p>
                                  {customer.isActive === false && (
                                    <StatusBadge
                                      status="draft"
                                      label="Inactive"
                                      size="sm"
                                    />
                                  )}
                                </div>
                                <p className="truncate text-xs text-on-surface-variant">
                                  {customer.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-on-surface-variant">
                            {formatCustomerLocation(customer)}
                          </td>
                          <td className="px-6 py-4 tabular-nums text-on-surface">
                            {ordersCount}{" "}
                            {ordersCount === 1 ? "order" : "orders"}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={customer.tier} size="sm" />
                          </td>
                          <td className="px-6 py-4 text-right font-semibold tabular-nums text-primary">
                            {formatCurrency(totalSpent, defaultCurrency)}
                          </td>
                          <td
                            className="px-6 py-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                aria-label={`Edit ${customer.name}`}
                                title="Edit customer"
                                onClick={() => handleEditCustomer(customerId)}
                                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface-variant transition-all hover:border-primary/40 hover:bg-surface-container-high hover:text-primary active:scale-95"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  edit
                                </span>
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${customer.name}`}
                                title="Delete customer"
                                onClick={() => openDeleteModal(customer)}
                                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-outline-variant/40 bg-surface-container-low text-on-surface-variant transition-all hover:border-error/40 hover:bg-error-container/60 hover:text-error active:scale-95"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 px-6 py-3.5 text-xs text-on-surface-variant">
                <span className="font-label-mono text-[10px] uppercase tracking-wider">
                  Page {pagination.page} of {pagination.pages} ·{" "}
                  {pagination.total}{" "}
                  {pagination.total === 1 ? "customer" : "customers"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || isLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="cursor-pointer rounded-lg border border-outline-variant/50 bg-surface-container-low px-3 py-1.5 font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= pagination.pages || isLoading}
                    onClick={() =>
                      setPage((p) => Math.min(pagination.pages, p + 1))
                    }
                    className="cursor-pointer rounded-lg border border-outline-variant/50 bg-surface-container-low px-3 py-1.5 font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <p className="border-t border-outline-variant/20 px-6 py-3 text-[11px] text-on-surface-variant/60">
                Click any row to view or edit customer profile details
              </p>
            )}
          </section>
        </div>
      </main>

      <ConfirmModal
        isOpen={Boolean(customerToDelete)}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteCustomer}
        title="Delete this customer?"
        subtitle="Confirm deletion"
        message={`This will permanently remove ${customerToDelete?.name || "this customer"} from the directory.`}
        itemName={customerToDelete?.name}
        itemImage={customerToDelete?.avatar || null}
        confirmLabel="Delete"
        confirmingLabel="Deleting..."
        isLoading={isDeleting}
        error={deleteError}
      />
    </>
  );
}

export default Customers;
