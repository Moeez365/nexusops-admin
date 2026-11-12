import { useCallback, useEffect, useState } from "react";
import { getStoreSettings } from "../api/settings";
import { deleteUser, getUsers, getUserStats } from "../api/users";

const DEFAULT_SUMMARY_CARDS = [
  { label: "Total Customers", value: "0", icon: "group" },
  { label: "VIP Patrons", value: "0", icon: "workspace_premium" },
  { label: "New This Month", value: "0", icon: "person_add" },
];

const DEFAULT_TIER_COUNTS = { all: 0, vip: 0, active: 0, new: 0 };
const DEFAULT_PAGINATION = { total: 0, page: 1, limit: 20, pages: 1 };
const SEARCH_DEBOUNCE_MS = 300;
const PAGE_LIMIT = 20;

const isCanceledRequest = (error) =>
  error?.name === "CanceledError" ||
  error?.name === "AbortError" ||
  error?.code === "ERR_CANCELED";

/**
 * Custom hook encapsulating customer directory fetching, debounced search,
 * tier filtering, sorting, pagination, KPI metrics, and delete confirmation.
 */
export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [summaryCards, setSummaryCards] = useState(DEFAULT_SUMMARY_CARDS);
  const [tabCounts, setTabCounts] = useState(DEFAULT_TIER_COUNTS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");

  const [searchQuery, setSearchQueryState] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [tierTab, setTierTabState] = useState("all");
  const [sortBy, setSortByState] = useState("newest");
  const [page, setPage] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notification, setNotification] = useState(null);

  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStatsAndSettings = useCallback(async (signal) => {
    const [statsResult, settingsResult] = await Promise.allSettled([
      getUserStats(signal),
      getStoreSettings(),
    ]);

    if (
      statsResult.status === "fulfilled" &&
      Array.isArray(statsResult.value?.data?.summaryCards)
    ) {
      setSummaryCards(statsResult.value.data.summaryCards);
    }

    if (
      settingsResult.status === "fulfilled" &&
      settingsResult.value?.data?.commerce?.defaultCurrency
    ) {
      setDefaultCurrency(settingsResult.value.data.commerce.defaultCurrency);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchStatsAndSettings(controller.signal).catch(() => {});
    return () => controller.abort();
  }, [fetchStatsAndSettings]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setErrorMessage("");

    async function loadCustomers() {
      try {
        const res = await getUsers(
          {
            search: debouncedSearchQuery,
            tier: tierTab,
            sortBy,
            page,
            limit: PAGE_LIMIT,
          },
          controller.signal
        );

        setCustomers(Array.isArray(res?.data) ? res.data : []);
        if (res?.tierCounts) {
          setTabCounts({ ...DEFAULT_TIER_COUNTS, ...res.tierCounts });
        }
        if (res?.pagination) {
          setPagination({ ...DEFAULT_PAGINATION, ...res.pagination });
        }
      } catch (error) {
        if (isCanceledRequest(error)) return;
        setErrorMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load customers from server."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadCustomers();
    return () => controller.abort();
  }, [debouncedSearchQuery, tierTab, sortBy, page, reloadTick]);

  const setSearchQuery = useCallback((value) => {
    setSearchQueryState(value);
    setPage(1);
  }, []);

  const setTierTab = useCallback((value) => {
    setTierTabState(value);
    setPage(1);
  }, []);

  const setSortBy = useCallback((value) => {
    setSortByState(value);
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setTierTabState("all");
    setSearchQueryState("");
    setDebouncedSearchQuery("");
    setSortByState("newest");
    setPage(1);
  }, []);

  const reloadCustomers = useCallback(() => {
    setReloadTick((tick) => tick + 1);
    fetchStatsAndSettings().catch(() => {});
  }, [fetchStatsAndSettings]);

  const openDeleteModal = useCallback((customer) => {
    setDeleteError("");
    setCustomerToDelete(customer);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setDeleteError("");
    setCustomerToDelete(null);
  }, [isDeleting]);

  const confirmDeleteCustomer = useCallback(async () => {
    if (!customerToDelete?._id || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteError("");
      await deleteUser(customerToDelete._id);

      const deletedName = customerToDelete.name || "Customer";
      setCustomerToDelete(null);
      setNotification({
        type: "success",
        message: `${deletedName} removed from client directory.`,
      });

      if (customers.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        setReloadTick((tick) => tick + 1);
      }
      fetchStatsAndSettings().catch(() => {});
    } catch (error) {
      setDeleteError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete customer. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  }, [customerToDelete, isDeleting, customers.length, page, fetchStatsAndSettings]);

  return {
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
    hasActiveFilters:
      tierTab !== "all" || Boolean(searchQuery.trim()) || sortBy !== "newest",
    handleResetFilters,
    reloadCustomers,
    customerToDelete,
    isDeleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteCustomer,
  };
}

export default useCustomers;

