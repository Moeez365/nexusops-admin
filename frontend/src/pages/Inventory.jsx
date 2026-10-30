import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../api/products";
import { getCollections } from "../api/collections";
import { useNavigate, useSearchParams } from "react-router-dom";
import ListFilterToolbar, {
  ToolbarSelect,
} from "../components/ListFilterToolbar";
import {
  ShimmerImage,
  ConfirmModal,
  StatusBadge,
} from "../components/common";
import { formatCurrency } from "../utils";

function Inventory() {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    active: 0,
    low_stock: 0,
    out_of_stock: 0,
    draft: 0,
  });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [busyProductId, setBusyProductId] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCollectionId = searchParams.get("collection") || "";

  // Debounce search query input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch collections once for dropdown and collection badges
  useEffect(() => {
    let ignore = false;
    async function fetchCollectionsList() {
      try {
        const collectionsRes = await getCollections().catch(() => ({ data: [] }));
        if (!ignore) {
          setCollections(collectionsRes.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch collections:", error);
      }
    }
    fetchCollectionsList();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch filtered products from backend whenever filters/sorting/search changes
  useEffect(() => {
    let ignore = false;
    async function fetchProducts() {
      setLoading(true);
      try {
        const productsRes = await getProducts({
          search: debouncedSearchQuery,
          status: statusTab,
          category: selectedCategory,
          collection: selectedCollectionId,
          sortBy,
        });

        if (!ignore) {
          setProducts(productsRes.data || []);
          if (productsRes.tabCounts) {
            setTabCounts(productsRes.tabCounts);
          }
          if (productsRes.categories && productsRes.categories.length > 0) {
            setCategoriesList(productsRes.categories);
          }
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchProducts();
    return () => {
      ignore = true;
    };
  }, [
    debouncedSearchQuery,
    statusTab,
    selectedCategory,
    selectedCollectionId,
    sortBy,
  ]);

  useEffect(() => {
    if (!openMenuId) return undefined;

    const handleCloseMenu = () => setOpenMenuId(null);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpenMenuId(null);
    };

    window.addEventListener("click", handleCloseMenu);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleCloseMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

  const handleCollectionFilterChange = (collectionId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (collectionId) {
      nextParams.set("collection", collectionId);
    } else {
      nextParams.delete("collection");
    }
    setSearchParams(nextParams);
  };

  const productCollectionsMap = useMemo(() => {
    const map = new Map();
    collections.forEach((col) => {
      if (!Array.isArray(col.products)) return;
      col.products.forEach((item) => {
        const productId = typeof item === "object" ? item?._id : item;
        if (!productId) return;
        const list = map.get(productId) || [];
        list.push(col);
        map.set(productId, list);
      });
    });
    return map;
  }, [collections]);

  const productTabs = useMemo(
    () => [
      { id: "all", label: "All", count: tabCounts.all },
      { id: "active", label: "Active", count: tabCounts.active },
      {
        id: "out_of_stock",
        label: "Out of stock",
        count: tabCounts.out_of_stock,
      },
      { id: "draft", label: "Draft", count: tabCounts.draft },
    ],
    [tabCounts],
  );

  const categoryOptions = useMemo(() => {
    const set = new Set(categoriesList);
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return [
      { value: "", label: "All categories" },
      ...Array.from(set)
        .sort()
        .map((cat) => ({ value: cat, label: cat })),
    ];
  }, [categoriesList, products]);

  const collectionOptions = useMemo(() => {
    return [
      { value: "", label: "All collections" },
      ...collections.map((c) => ({ value: c._id, label: c.name })),
    ];
  }, [collections]);

  const sortOptions = [
    { value: "newest", label: "Newest first" },
    { value: "stock_asc", label: "Stock: low to high" },
    { value: "stock_desc", label: "Stock: high to low" },
    { value: "price_asc", label: "Price: low to high" },
    { value: "price_desc", label: "Price: high to low" },
    { value: "name_asc", label: "Name: A to Z" },
  ];

  const hasActiveFilters =
    statusTab !== "all" ||
    Boolean(searchQuery.trim()) ||
    Boolean(selectedCollectionId) ||
    Boolean(selectedCategory) ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setStatusTab("all");
    setSearchQuery("");
    setSelectedCategory("");
    setSortBy("newest");
    handleCollectionFilterChange("");
  };

  // Products are already filtered and sorted by backend
  const filteredProducts = products;

  const handleProductClick = (id) => {
    navigate(`/inventory/add-product?id=${encodeURIComponent(id)}`);
  };

  const handleToggleFeatured = async (product) => {
    if (!product?._id || busyProductId) return;
    setOpenMenuId(null);

    try {
      setBusyProductId(product._id);
      const nextFeatured = !product.isFeatured;
      await updateProduct(product._id, { isFeatured: nextFeatured });
      setData((prev) =>
        prev.map((item) =>
          item._id === product._id
            ? { ...item, isFeatured: nextFeatured }
            : item,
        ),
      );
    } catch (error) {
      console.error("Failed to update product:", error);
    } finally {
      setBusyProductId(null);
    }
  };

  const handleDuplicateProduct = async (product) => {
    if (!product?._id || busyProductId) return;
    setOpenMenuId(null);

    try {
      setBusyProductId(product._id);
      const baseSlug = (product.slug || product.name || "product")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

      const payload = {
        name: `${product.name} (Copy)`,
        slug: `${baseSlug}-copy-${Date.now().toString().slice(-4)}`,
        description: product.description || "Duplicated product",
        price: Number(product.price) || 0,
        comparePrice: Number(product.comparePrice) || 0,
        category: product.category || "General",
        brand: product.brand || "",
        stock: Number(product.stock) || 0,
        images: Array.isArray(product.images)
          ? product.images.map((img) => img?._id || img).filter(Boolean)
          : [],
        isFeatured: Boolean(product.isFeatured),
        isActive: product.isActive ?? true,
        tags: Array.isArray(product.tags) ? product.tags : [],
      };

      const res = await createProduct(payload);
      if (res?.data) {
        setProducts((prev) => [res.data, ...prev]);
        setTabCounts((prev) => ({
          ...prev,
          all: prev.all + 1,
          ...(res.data.isActive === false
            ? { draft: prev.draft + 1 }
            : Number(res.data.stock) <= 0
            ? { out_of_stock: prev.out_of_stock + 1 }
            : { active: prev.active + 1 }),
        }));
      }
    } catch (error) {
      console.error("Failed to duplicate product:", error);
    } finally {
      setBusyProductId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete?._id || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteError("");
      await deleteProduct(productToDelete._id);
      setData((prev) =>
        prev.filter((item) => item._id !== productToDelete._id),
      );
      setTabCounts((prev) => ({
        ...prev,
        all: Math.max(0, prev.all - 1),
        ...(productToDelete.isActive === false
          ? { draft: Math.max(0, prev.draft - 1) }
          : Number(productToDelete.stock) <= 0
          ? { out_of_stock: Math.max(0, prev.out_of_stock - 1) }
          : { active: Math.max(0, prev.active - 1) }),
      }));
      setProductToDelete(null);
    } catch (error) {
      setDeleteError(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete product. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="Products" buttonLabel="Add New" />
      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-6">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <ListFilterToolbar
            tabs={productTabs}
            activeTab={statusTab}
            onTabChange={setStatusTab}
            searchPlaceholder="Search by product name, category, or brand..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalFilteredCount={products.length}
            totalCount={tabCounts.all}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
            className="mb-8"
          >
            <ToolbarSelect
              ariaLabel="Filter by category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categoryOptions}
            />
            <ToolbarSelect
              ariaLabel="Filter by collection"
              value={selectedCollectionId}
              onChange={handleCollectionFilterChange}
              options={collectionOptions}
            />
            <ToolbarSelect
              ariaLabel="Sort products"
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
            />
          </ListFilterToolbar>

          {loading ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-outline-variant/60 bg-surface-container/70 text-on-surface-variant shadow-[0_16px_45px_rgba(50,35,75,0.10)]">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">
                progress_activity
              </span>
              <p className="mt-3 font-label-mono text-[10px] uppercase tracking-widest">
                Loading products
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant/60 bg-surface-container/40 p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl">
                  inventory_2
                </span>
              </div>
              <h3 className="mt-4 font-headline-lg text-lg font-semibold text-on-surface">
                No products match your filters
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Try adjusting your search query, status tab, or collection filters.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-label-mono text-xs uppercase tracking-wider text-on-primary transition-all hover:bg-primary/90 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    filter_alt_off
                  </span>
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts &&
              filteredProducts.map((product) => {
                const isMenuOpen = openMenuId === product._id;
                const assignedCols =
                  productCollectionsMap.get(product._id) || [];

                return (
                  <div
                    onClick={() => handleProductClick(product._id)}
                    key={product._id}
                    className={`group relative cursor-pointer rounded-2xl border border-outline-variant/60 bg-surface-container/70 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl ${
                      isMenuOpen ? "z-30" : ""
                    }`}
                  >
                    <div className="relative h-64 overflow-hidden rounded-t-2xl bg-surface-container-high">
                      <ShimmerImage
                        src={product.images?.[0]?.url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {product.isFeatured && (
                        <div className="absolute left-4 top-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-container/90 px-3 py-1 font-label-mono text-[10px] uppercase tracking-widest text-on-primary-container backdrop-blur-md">
                            <span
                              className="material-symbols-outlined text-[13px] text-primary"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                            Featured
                          </span>
                        </div>
                      )}
                      {product.badge && (
                        <div className="absolute right-4 top-4">
                          <span
                            className={`rounded-full px-4 py-1 text-[10px] font-label-mono uppercase tracking-widest backdrop-blur-md ${product.badgeClass}`}
                          >
                            {product.badge}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="mb-1 text-[10px] font-label-mono uppercase tracking-widest text-on-surface-variant">
                            {product.category}
                            {assignedCols.length > 0
                              ? ` · ${assignedCols.map((c) => c.name).join(", ")}`
                              : ""}
                          </p>
                          <h3 className="truncate font-title-md text-title-md transition-colors group-hover:text-primary">
                            {product.name}
                          </h3>
                        </div>

                        <div
                          className="relative shrink-0"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-label={`Actions for ${product.name}`}
                            aria-expanded={isMenuOpen}
                            onClick={() =>
                              setOpenMenuId((current) =>
                                current === product._id ? null : product._id,
                              )
                            }
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            <span className="material-symbols-outlined">
                              more_vert
                            </span>
                          </button>

                          {isMenuOpen && (
                            <div
                              role="menu"
                              aria-label={`${product.name} options`}
                              className="absolute right-0 top-full z-300 mt-1.5 w-48 overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-1.5 shadow-[0_16px_45px_rgba(50,35,75,0.18)] backdrop-blur-xl"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleProductClick(product._id);
                                }}
                                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-on-surface transition-colors hover:bg-primary/10 hover:text-primary"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  edit
                                </span>
                                Edit product
                              </button>

                              <button
                                type="button"
                                role="menuitem"
                                disabled={busyProductId === product._id}
                                onClick={() => handleToggleFeatured(product)}
                                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-on-surface transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                              >
                                <span
                                  className="material-symbols-outlined text-[18px]"
                                  style={
                                    product.isFeatured
                                      ? { fontVariationSettings: "'FILL' 1" }
                                      : undefined
                                  }
                                >
                                  star
                                </span>
                                {product.isFeatured
                                  ? "Remove featured"
                                  : "Mark as featured"}
                              </button>

                              <button
                                type="button"
                                role="menuitem"
                                disabled={busyProductId === product._id}
                                onClick={() => handleDuplicateProduct(product)}
                                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-on-surface transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  content_copy
                                </span>
                                Duplicate
                              </button>

                              <div className="my-1 border-t border-outline-variant/40" />

                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setDeleteError("");
                                  setProductToDelete(product);
                                }}
                                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-error transition-colors hover:bg-error-container/60"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  delete
                                </span>
                                Delete product
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-label-mono text-label-mono font-semibold text-primary">
                            {formatCurrency(product.price)}
                          </p>
                          <p className="text-[10px] font-label-mono uppercase tracking-widest text-on-surface-variant/60">
                            {product.stock} units
                          </p>
                        </div>
                        <StatusBadge
                          status={
                            Number(product.stock) <= 0
                              ? "out_of_stock"
                              : Number(product.stock) <= 10
                                ? "low_stock"
                                : product.isActive === false
                                  ? "draft"
                                  : "active"
                          }
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-[10px] font-label-mono uppercase tracking-widest text-on-surface-variant/60">
              Showing {filteredProducts.length} of {products.length} Products
            </p>
            <div className="relative h-1 w-64 overflow-hidden rounded-full bg-primary/5">
              <div className="absolute inset-y-0 left-0 w-1/4 bg-primary shadow-[0_0_10px_rgba(109,59,215,0.5)]" />
            </div>
            <button className="glass-card group flex items-center gap-3 rounded-full px-6 py-3 transition-all hover:bg-primary/10">
              <span className="font-label-mono text-label-mono uppercase tracking-[0.2em] transition-colors group-hover:text-primary">
                Load More
              </span>
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-y-1">
                expand_more
              </span>
            </button>
          </div>
        </div>
      </main>

      <ConfirmModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete this product?"
        subtitle="Confirm deletion"
        message="This action will permanently remove this item from your catalog."
        itemName={productToDelete?.name}
        itemImage={productToDelete?.images?.[0]?.url}
        confirmLabel="Delete"
        confirmingLabel="Deleting..."
        isLoading={isDeleting}
        error={deleteError}
      />
    </>
  );
}

export default Inventory;
