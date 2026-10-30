import { useState, useEffect, useCallback } from "react";
import { getProducts } from "../api/products";

/**
 * Custom hook encapsulating product fetching, tab filtering, and category selection
 */
export function useProducts(initialFilters = {}) {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState({});
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getProducts(filters);
      if (response?.success) {
        setProducts(response.data || []);
        setTotalCount(response.total || 0);
        setTabCounts(response.tabCounts || {});
        setCategories(response.categories || []);
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Failed to load products";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    products,
    totalCount,
    tabCounts,
    categories,
    filters,
    setFilters: updateFilters,
    isLoading,
    errorMessage,
    hasError: Boolean(errorMessage),
    reloadProducts: fetchProducts,
  };
}

export default useProducts;

