import { useState, useEffect, useMemo, useCallback } from "react";
import { getOrders, getOrderStats, updateOrderStatus as apiUpdateOrderStatus } from "../api/orders";
import { getStoreSettings } from "../api/settings";
import { formatCurrency, formatDate } from "../utils";
import { ORDER_SUMMARY_CARDS, ORDER_STATUS_FILTERS } from "../constants/orders";

export const ORDER_STATUS_CHOICES = Object.freeze([
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
]);

/**
 * Custom hook encapsulating order data fetching, filtering, sorting, and optimistic status updates
 */
export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [summaryCards, setSummaryCards] = useState(ORDER_SUMMARY_CARDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [drawerOrder, setDrawerOrder] = useState(null);

  const fetchOrdersData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [ordersRes, statsRes, settingsRes] = await Promise.all([
        getOrders().catch(() => ({ data: [] })),
        getOrderStats().catch(() => ({ data: null })),
        getStoreSettings().catch(() => ({ data: null })),
      ]);

      const defaultCurrency = settingsRes?.data?.commerce?.defaultCurrency || "USD";

      if (Array.isArray(ordersRes?.data)) {
        const mappedOrders = ordersRes.data.map((order) => {
          const rawTotal = order.total;
          const numericTotal = typeof rawTotal === "number" ? rawTotal : 0;
          const formattedTotal =
            typeof rawTotal === "number"
              ? formatCurrency(rawTotal, order.currency || defaultCurrency)
              : rawTotal;

          const productName =
            order.product ||
            (order.items?.[0]?.name
              ? `${order.items[0].name}${order.items.length > 1 ? ` (+${order.items.length - 1} more)` : ""}`
              : "Bespoke Order");

          return {
            id: order.orderNumber || order.id || order._id,
            rawId: order._id || order.id,
            customer: order.customer || "Guest Client",
            email: order.email || "No email",
            product: productName,
            date: formatDate(order.createdAt),
            rawDate: order.createdAt,
            status: order.status || "Pending",
            total: formattedTotal,
            numericTotal,
          };
        });

        setOrders(mappedOrders);
      }

      if (statsRes?.data?.summaryCards) {
        setSummaryCards(statsRes.data.summaryCards);
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Failed to load orders";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);

  const updateOrderStatus = useCallback(
    async (order, newStatus) => {
      if (!order || order.status === newStatus) return;

      const previousStatus = order.status;
      const orderKey = order.id;

      // Optimistic update
      setOrders((prev) =>
        prev.map((item) => (item.id === orderKey ? { ...item, status: newStatus } : item))
      );
      setDrawerOrder((prev) =>
        prev?.id === orderKey ? { ...prev, status: newStatus } : prev
      );
      setUpdatingOrderId(orderKey);
      setNotification(null);

      try {
        const targetId = order.rawId || order.id;
        await apiUpdateOrderStatus(targetId, newStatus);

        setNotification({
          type: "success",
          message: `Order ${order.id} status changed to ${newStatus}`,
        });

        // Refresh stats in background
        const statsRes = await getOrderStats().catch(() => null);
        if (statsRes?.data?.summaryCards) {
          setSummaryCards(statsRes.data.summaryCards);
        }
      } catch (err) {
        // Rollback on error
        setOrders((prev) =>
          prev.map((item) => (item.id === orderKey ? { ...item, status: previousStatus } : item))
        );
        setDrawerOrder((prev) =>
          prev?.id === orderKey ? { ...prev, status: previousStatus } : prev
        );
        setNotification({
          type: "error",
          message:
            err?.response?.data?.message ||
            `Failed to update status for order ${order.id}`,
        });
      } finally {
        setUpdatingOrderId(null);
      }
    },
    []
  );

  const tabCounts = useMemo(() => {
    const counts = { All: orders.length };
    ORDER_STATUS_FILTERS.forEach((st) => {
      if (st === "All") return;
      counts[st] = orders.filter((o) => o.status === st).length;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = orders.filter((order) => {
      const matchesStatus = statusTab === "All" || order.status === statusTab;
      const matchesSearch =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.email.toLowerCase().includes(query) ||
        order.product.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });

    return [...list].sort((a, b) => {
      const numA = typeof a.numericTotal === "number" ? a.numericTotal : 0;
      const numB = typeof b.numericTotal === "number" ? b.numericTotal : 0;
      if (sortBy === "total_desc") return numB - numA;
      if (sortBy === "total_asc") return numA - numB;
      if (sortBy === "customer_asc") return a.customer.localeCompare(b.customer);
      if (sortBy === "oldest") return a.id.localeCompare(b.id);
      return b.id.localeCompare(a.id);
    });
  }, [orders, searchQuery, statusTab, sortBy]);

  const handleResetFilters = useCallback(() => {
    setStatusTab("All");
    setSearchQuery("");
    setSortBy("newest");
  }, []);

  return {
    orders: filteredOrders,
    rawOrdersCount: orders.length,
    isLoading,
    errorMessage,
    hasError: Boolean(errorMessage),
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
    updateOrderStatus,
    handleResetFilters,
    reloadOrders: fetchOrdersData,
  };
}

export default useOrders;

