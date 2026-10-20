import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import ListFilterToolbar, {
  ToolbarSelect,
} from "../components/ListFilterToolbar";
import { StatusBadge } from "../components/common";
import {
  CUSTOMER_SUMMARY_CARDS,
  CUSTOMER_TIER_TABS,
  SAMPLE_CUSTOMERS_DATA,
} from "../constants/customers";

const cardClass =
  "rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-6 shadow-[0_16px_45px_rgba(50,35,75,0.08)] backdrop-blur-xl";

/**
 * Returns the first two uppercase initials for a customer name.
 * @param {string} name
 * @returns {string}
 */
function getInitials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Customers Directory Page
 *
 * Displays overview KPI metrics, a standardized filter/search toolbar,
 * and a luxury customer patron ledger with tier status indicators.
 */
function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierTab, setTierTab] = useState("all");
  const [sortBy, setSortBy] = useState("spent_desc");

  // Calculate counts for each customer tier tab
  const tabCounts = useMemo(() => {
    const counts = { all: SAMPLE_CUSTOMERS_DATA.length };
    CUSTOMER_TIER_TABS.forEach((t) => {
      if (t.id === "all") return;
      counts[t.id] = SAMPLE_CUSTOMERS_DATA.filter(
        (c) => c.tier.toLowerCase() === t.id.toLowerCase(),
      ).length;
    });
    return counts;
  }, []);

  // Format tabs for ListFilterToolbar
  const tabs = useMemo(
    () =>
      CUSTOMER_TIER_TABS.map((t) => ({
        id: t.id,
        label: t.label,
        count: tabCounts[t.id] ?? 0,
      })),
    [tabCounts],
  );

  const sortOptions = [
    { value: "spent_desc", label: "Spent: High to Low" },
    { value: "orders_desc", label: "Orders: Most First" },
    { value: "name_asc", label: "Name: A to Z" },
    { value: "name_desc", label: "Name: Z to A" },
  ];

  const hasActiveFilters =
    tierTab !== "all" || Boolean(searchQuery.trim()) || sortBy !== "spent_desc";

  const handleResetFilters = () => {
    setTierTab("all");
    setSearchQuery("");
    setSortBy("spent_desc");
  };

  // Filter and sort customer directory
  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const matches = SAMPLE_CUSTOMERS_DATA.filter((customer) => {
      const matchesTier =
        tierTab === "all" ||
        customer.tier.toLowerCase() === tierTab.toLowerCase();

      const matchesSearch =
        !query ||
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.location.toLowerCase().includes(query);

      return matchesTier && matchesSearch;
    });

    return matches.sort((a, b) => {
      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name_desc") {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === "orders_desc") {
        return b.orders - a.orders;
      }
      // Default: spent_desc
      const spentA = Number(a.spent.replace(/[^0-9.]/g, "")) || 0;
      const spentB = Number(b.spent.replace(/[^0-9.]/g, "")) || 0;
      return spentB - spentA;
    });
  }, [searchQuery, tierTab, sortBy]);

  return (
    <>
      <PageHeader
        title="Customers"
        buttonLabel="Add Customer"
        buttonIcon="person_add"
        onButtonClick={() => {}}
      />

      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-10">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">
          {/* Header Description */}
          <section>
            <p className="font-label-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Directory
            </p>
            <h1 className="mt-1 font-headline-lg text-2xl tracking-tight md:text-headline-lg">
              Customers
            </h1>
            <p className="mt-1 text-body-base text-on-surface-variant">
              View and manage your registered clients and VIP patrons.
            </p>
          </section>

          {/* KPI Summary Cards */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {CUSTOMER_SUMMARY_CARDS.map((item) => (
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

          {/* Unified Filter Toolbar & Table Card */}
          <section className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container/70 shadow-[0_16px_45px_rgba(50,35,75,0.08)] backdrop-blur-xl">
            {/* Standardized 2-Row Filter Toolbar */}
            <ListFilterToolbar
              tabs={tabs}
              activeTab={tierTab}
              onTabChange={setTierTab}
              searchPlaceholder="Search by name, email, or location..."
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
            >
              <ToolbarSelect
                label="Sort"
                icon="swap_vert"
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
              />
            </ListFilterToolbar>

            {/* Customers Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-surface-container-low font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5">Orders</th>
                    <th className="px-6 py-3.5">Tier</th>
                    <th className="px-6 py-3.5 text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-sm text-on-surface-variant"
                      >
                        <span className="material-symbols-outlined mb-2 block text-3xl text-outline">
                          person_search
                        </span>
                        No matching customers found.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="transition-colors hover:bg-primary/5"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container font-label-mono text-xs font-semibold text-primary">
                              {getInitials(customer.name)}
                            </span>
                            <div>
                              <p className="font-medium text-on-surface">
                                {customer.name}
                              </p>
                              <p className="text-xs text-on-surface-variant">
                                {customer.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant">
                          {customer.location}
                        </td>
                        <td className="px-6 py-4 tabular-nums text-on-surface">
                          {customer.orders} orders
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={customer.tier} size="sm" />
                        </td>
                        <td className="px-6 py-4 text-right font-semibold tabular-nums text-primary">
                          {customer.spent}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default Customers;
