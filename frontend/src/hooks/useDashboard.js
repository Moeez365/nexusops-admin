import { useState, useEffect, useCallback } from "react";
import { getStoreAnalytics } from "../api/settings";
import { getOrders } from "../api/orders";

/**
 * Custom hook encapsulating Dashboard analytics and recent orders fetching
 */
export function useDashboard(initialRange = "7 days") {
  const [activeRange, setActiveRange] = useState(initialRange);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [analyticsRes, ordersRes] = await Promise.allSettled([
        getStoreAnalytics({ range: activeRange }),
        getOrders({ sortBy: "newest" }),
      ]);

      if (analyticsRes.status === "fulfilled" && analyticsRes.value?.data) {
        setAnalyticsData(analyticsRes.value.data);
      }

      if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value?.data)) {
        const mapped = ordersRes.value.data.slice(0, 6).map((order) => {
          const rawId = order._id || order.id;
          const displayId =
            order.orderNumber ||
            (rawId ? `#${String(rawId).slice(-5).toUpperCase()}` : "#10001");
          const customerName = order.customer || order.customerName || "Customer";
          const productName =
            order.product ||
            (order.items?.[0]?.name
              ? `${order.items[0].name}${order.items.length > 1 ? ` (+${order.items.length - 1} more)` : ""}`
              : "Store Item");
          const displayDate = order.createdAt
            ? new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Recent";
          const formattedAmount =
            typeof order.total === "number"
              ? `$${order.total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : order.total || "$0.00";

          return {
            id: displayId,
            rawId,
            customer: customerName,
            product: productName,
            date: displayDate,
            amount: formattedAmount,
            status: order.status || "Pending",
          };
        });

        setRecentOrders(mapped);
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Failed to load dashboard data";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [activeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    activeRange,
    setActiveRange,
    analytics: analyticsData,
    recentOrders,
    isLoading,
    errorMessage,
    hasError: Boolean(errorMessage),
    reloadDashboard: fetchDashboardData,
  };
}

export default useDashboard;
