import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import GalleryDialog from "../components/GalleryDialog";
import { createProduct, getProductById } from "../api/products";
import { getCollections } from "../api/collections";
import uploadImages from "../api/image";
import { ProductImagesManager } from "../components/product";
import { formatCurrency, slugify } from "../utils";

const cardClass =
  "rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-6 shadow-[0_16px_45px_rgba(50,35,75,0.08)] backdrop-blur-xl";

const inputClass =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-body-base text-on-surface placeholder:text-on-surface-variant/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

/**
 * Transforms product form state into an API payload.
 *
 * @param {Object} productData - Raw form state
 * @param {Array<Object>} productImages - Uploaded image objects
 * @param {Array<string>} [selectedCollections=[]] - IDs of collections assigned to product
 * @returns {Object} Clean payload for POST/PUT request
 */
function buildProductPayload(
  productData,
  productImages,
  selectedCollections = [],
) {
  const { productName, ...fields } = productData;
  return {
    ...fields,
    name: productName.trim(),
    slug: fields.slug?.trim() || slugify(productName),
    price: Number(productData.price),
    comparePrice: Number(productData.comparePrice),
    stock: Number(productData.stock),
    images: productImages.map((image) => image._id).filter(Boolean),
    collections: [...selectedCollections].sort(),
  };
}

const initialProductData = {
  productName: "Zenith Chronograph Mk II",
  description: "",
  slug: "zenith-chronograph",
  price: "12500",
  comparePrice: "15000",
  stock: "50",
  category: "Horology",
  brand: "NexaOps Signature",
  isActive: true,
  isFeatured: false,
  tags: ["LIMITED_EDITION", "SAPPHIRE_CRYSTAL"],
};

function AddProduct() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("id");

  const [productData, setProductData] = useState(initialProductData);
  const [collections, setCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [productImages, setProductImages] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [savedProduct, setSavedProduct] = useState(null);

  const moveProductImage = (fromIndex, toIndex) => {
    if (
      fromIndex === toIndex ||
      fromIndex === null ||
      toIndex === null ||
      Number.isNaN(fromIndex) ||
      Number.isNaN(toIndex)
    ) {
      return;
    }
    setProductImages((currentImages) => {
      if (
        fromIndex < 0 ||
        fromIndex >= currentImages.length ||
        toIndex < 0 ||
        toIndex >= currentImages.length
      ) {
        return currentImages;
      }
      const updated = [...currentImages];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      return updated;
    });
  };

  const removeProductImage = (indexToRemove) => {
    setProductImages((currentImages) =>
      currentImages.filter((_, idx) => idx !== indexToRemove),
    );
  };

  const makeImagePrimary = (indexToPromote) => {
    if (indexToPromote === 0) return;
    setProductImages((currentImages) => {
      const target = currentImages[indexToPromote];
      const remaining = currentImages.filter(
        (_, idx) => idx !== indexToPromote,
      );
      return [target, ...remaining];
    });
  };

  const payload = buildProductPayload(
    productData,
    productImages,
    selectedCollections,
  );
  const snapshot = JSON.stringify(payload);
  const hasBaseline = savedProduct?.id === productId;
  const hasRequiredFields =
    Boolean(productData.productName?.trim()) &&
    Boolean(productData.slug?.trim()) &&
    Boolean(productData.description?.trim()) &&
    Boolean(productData.category?.trim()) &&
    String(productData.price ?? "").trim() !== "" &&
    !Number.isNaN(Number(productData.price)) &&
    Number(productData.price) >= 0;
  const isSaveDisabled =
    isSaving ||
    isUploadingImages ||
    !hasRequiredFields ||
    (productId && !hasBaseline) ||
    (hasBaseline && savedProduct.snapshot === snapshot);

  const handleAddNewProduct = () => {
    setProductData(initialProductData);
    setProductImages([]);
    setSelectedCollections([]);
    setSavedProduct(null);
    setNotification(null);
    setTagInput("");
    navigate("/inventory/add-product");
  };

  const toggleCollectionSelection = (collectionId) => {
    setSelectedCollections((current) =>
      current.includes(collectionId)
        ? current.filter((id) => id !== collectionId)
        : [...current, collectionId],
    );
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProductData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const toggleField = (field) => {
    setProductData((currentData) => ({
      ...currentData,
      [field]: !currentData[field],
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim().toUpperCase().replace(/\s+/g, "_");
    if (!tag || productData.tags.includes(tag)) return;

    setProductData((currentData) => ({
      ...currentData,
      tags: [...currentData.tags, tag],
    }));
    setTagInput("");
  };

  const handleProductImageChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0 || isUploadingImages) return;

    const invalidFile = files.find(
      (file) => !["image/png", "image/jpeg", "image/webp"].includes(file.type),
    );
    if (invalidFile) {
      setNotification({
        type: "error",
        message: "Please select only PNG, JPG, or WebP images.",
      });
      return;
    }

    const temporaryImages = files.map((file, index) => ({
      _tempId: `${Date.now()}-${index}-${file.name}`,
      url: URL.createObjectURL(file),
      altText: file.name,
    }));
    const temporaryIds = new Set(temporaryImages.map((image) => image._tempId));

    setProductImages((currentImages) => [...currentImages, ...temporaryImages]);
    setIsUploadingImages(true);
    setNotification(null);

    try {
      const response = await uploadImages(files);
      const uploadedImages = Array.isArray(response.data) ? response.data : [];
      if (uploadedImages.length === 0) {
        throw new Error("The upload did not return any images.");
      }

      setProductImages((currentImages) => [
        ...currentImages.filter((image) => !temporaryIds.has(image._tempId)),
        ...uploadedImages,
      ]);
    } catch (error) {
      setProductImages((currentImages) =>
        currentImages.filter((image) => !temporaryIds.has(image._tempId)),
      );
      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Image upload failed. Please try again.",
      });
    } finally {
      temporaryImages.forEach((image) => URL.revokeObjectURL(image.url));
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    if (isSaveDisabled) return;

    if (!productData.productName.trim()) {
      setNotification({ type: "error", message: "Product Name is required." });
      return;
    }

    const data = {
      ...payload,
      ...(productId ? { id: productId } : {}),
    };

    setIsSaving(true);

    try {
      const res = await createProduct(data);
      const savedId = res?.data?._id || productId;
      setSavedProduct({ id: savedId, snapshot });
      setNotification({
        type: "success",
        message: productId
          ? "Product updated successfully!"
          : "Product created successfully!",
      });
      if (!productId && savedId) {
        navigate(`/inventory/add-product?id=${encodeURI(savedId)}`);
      }
    } catch (error) {
      console.error(
        "Failed to save product:",
        error.response?.data?.message || error.message,
      );
      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Failed to save product. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        const collectionsPromise = getCollections().catch(() => ({ data: [] }));
        const productPromise = productId
          ? getProductById(productId, controller.signal)
          : Promise.resolve(null);

        const [collectionsRes, productRes] = await Promise.all([
          collectionsPromise,
          productPromise,
        ]);

        if (controller.signal.aborted) return;

        const allCollections = Array.isArray(collectionsRes?.data)
          ? collectionsRes.data
          : [];
        setCollections(allCollections);

        if (!productId) return;

        const product = productRes?.data;
        if (!product) {
          throw new Error("Product data was not returned by the server");
        }

        const loadedImages = Array.isArray(product.images)
          ? product.images
          : [];
        const loadedData = {
          productName: product.name ?? "",
          description: product.description ?? "",
          slug: product.slug ?? "",
          price: String(product.price ?? ""),
          comparePrice: String(product.comparePrice ?? ""),
          stock: String(product.stock ?? ""),
          category: product.category ?? "",
          brand: product.brand ?? "",
          isActive: product.isActive ?? true,
          isFeatured: product.isFeatured ?? false,
          tags: Array.isArray(product.tags) ? product.tags : [],
        };

        const assignedCollectionIds = allCollections
          .filter(
            (col) =>
              Array.isArray(col.products) &&
              col.products.some(
                (item) =>
                  (typeof item === "object" ? item._id : item) === productId,
              ),
          )
          .map((col) => col._id);

        setProductImages(loadedImages);
        setProductData(loadedData);
        setSelectedCollections(assignedCollectionIds);
        setSavedProduct({
          id: productId,
          snapshot: JSON.stringify(
            buildProductPayload(
              loadedData,
              loadedImages,
              assignedCollectionIds,
            ),
          ),
        });
      } catch (error) {
        if (error.code === "ERR_CANCELED") return;
        console.error("Failed to load product:", error);
      }
    }

    fetchData();

    return () => controller.abort();
  }, [productId]);

  const categoryOptions = Array.from(
    new Set([
      ...(productData.category ? [productData.category] : []),
      ...collections.map((col) => col.name).filter(Boolean),
    ]),
  );

  const { productName, price, comparePrice } = productData;

  return (
    <>
      <PageHeader
        title={productId ? "Edit Product" : "Add Product"}
        secondaryButtonLabel="Add New Product"
        secondaryButtonIcon="add"
        onSecondaryButtonClick={handleAddNewProduct}
        buttonLabel={isSaving ? "Saving..." : "Save Product"}
        buttonIcon={isSaveDisabled && !isSaving ? "lock" : "save"}
        onButtonClick={handleSubmit}
        buttonDisabled={isSaveDisabled}
      />

      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
          {/* Top Banner / Breadcrumb Area */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link
                  to="/inventory"
                  className="font-label-mono text-[10px] uppercase tracking-widest text-primary transition-colors hover:underline"
                >
                  Atelier Inventory
                </Link>
                <span className="text-outline text-xs">/</span>
                <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {productId ? "Edit Product Protocol" : "Product Protocol"}
                </span>
              </div>
              <h1 className="font-headline-lg text-2xl tracking-tight text-on-surface md:text-headline-lg">
                {productId ? "Edit Product" : "Create Product"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/inventory")}
                className="cursor-pointer rounded-full border border-outline-variant/60 bg-surface-container-high/60 px-5 py-2 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface active:scale-95"
              >
                Cancel
              </button>
              {productId && (
                <button
                  type="button"
                  onClick={handleAddNewProduct}
                  className="cursor-pointer rounded-full border border-outline-variant/60 bg-surface-container-high/60 px-5 py-2 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface active:scale-95"
                >
                  Add New
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaveDisabled}
                className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2 font-title-md text-sm text-on-primary shadow-[0_6px_16px_rgba(109,59,215,0.18)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSaveDisabled && !isSaving ? "lock" : "save"}
                </span>
                <span>
                  {isSaving
                    ? "Saving..."
                    : productId
                      ? "Save Changes"
                      : "Save Product"}
                </span>
              </button>
            </div>
          </div>

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
                onClick={() => setNotification(null)}
                className="p-1 hover:opacity-80"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {/* Main Asymmetric Grid Layout (7 cols + 5 cols sticky sidebar) */}
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start"
          >
            {/* Left Column: Form Details (7 cols) */}
            <div className="space-y-6 lg:col-span-7">
              {/* Basic Information */}
              <section className={cardClass}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                      <span className="material-symbols-outlined text-[19px]">
                        info
                      </span>
                    </div>
                    <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                      Basic Information
                    </h2>
                  </div>
                  <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-mono text-[10px] uppercase tracking-wider text-on-secondary-container font-medium">
                    Required
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Product Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="product-name"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      Product Name
                    </label>
                    <input
                      id="product-name"
                      type="text"
                      name="productName"
                      value={productName ?? ""}
                      onChange={handleChange}
                      placeholder="e.g. Zenith Chronograph Mk II"
                      required
                      className={inputClass}
                    />
                  </div>

                  {/* URL Slug */}
                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      URL Slug
                    </label>
                    <div className="flex items-center overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-low focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                      <span className="px-3.5 text-xs text-outline select-none font-label-mono">
                        /nexaops/
                      </span>
                      <input
                        type="text"
                        name="slug"
                        value={productData.slug}
                        onChange={handleChange}
                        placeholder="zenith-chronograph"
                        className="w-full py-2.5 pr-4 border-none bg-transparent outline-none text-on-surface text-body-base placeholder:text-on-surface-variant/50"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="product-desc"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      Description
                    </label>
                    <textarea
                      id="product-desc"
                      rows={5}
                      name="description"
                      value={productData.description}
                      onChange={handleChange}
                      placeholder="Describe the craftsmanship and technical specifications..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              </section>

              {/* Pricing Architecture */}
              <section className={cardClass}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                    <span className="material-symbols-outlined text-[19px]">
                      payments
                    </span>
                  </div>
                  <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                    Pricing Architecture
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="price"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      Price (USD)
                    </label>
                    <input
                      id="price"
                      type="number"
                      name="price"
                      value={price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`${inputClass} font-medium text-primary`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="compare-price"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      Compare At
                    </label>
                    <input
                      id="compare-price"
                      type="number"
                      name="comparePrice"
                      value={comparePrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Estimated Discount
                    </label>
                    <div className="flex h-[42px] items-center rounded-xl border border-primary/20 bg-primary/10 px-4">
                      <span className="font-label-mono text-sm font-bold text-primary">
                        {price && comparePrice && Number(comparePrice) > 0
                          ? `${(((Number(comparePrice) - Number(price)) / Number(comparePrice)) * 100).toFixed(1)}%`
                          : "0.0%"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Inventory & Fulfillment */}
              <section className={cardClass}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                    <span className="material-symbols-outlined text-[19px]">
                      inventory_2
                    </span>
                  </div>
                  <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                    Inventory &amp; Fulfillment
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Initial Stock
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={productData.stock}
                      onChange={handleChange}
                      placeholder="50"
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        name="category"
                        value={productData.category}
                        onChange={handleChange}
                        className={`${inputClass} appearance-none pr-10 cursor-pointer`}
                      >
                        {categoryOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-outline text-[20px]">
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Brand
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={productData.brand}
                      onChange={handleChange}
                      placeholder="Brand Name"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-outline-variant/30 pt-5">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                    <div className="flex flex-col">
                      <span className="font-title-md text-sm font-semibold text-on-surface">
                        Activate Product
                      </span>
                      <span className="font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                        Visible to all customers
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productData.isActive}
                        onChange={() => toggleField("isActive")}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-secondary-fixed-dim peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-outline-variant/40 bg-surface-container-low">
                    <div className="flex flex-col">
                      <span className="font-title-md text-sm font-semibold text-on-surface">
                        Featured Product
                      </span>
                      <span className="font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                        High visibility placement
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productData.isFeatured}
                        onChange={() => toggleField("isFeatured")}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-secondary-fixed-dim peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                    </label>
                  </div>
                </div>
              </section>

              {/* Collections & Tags */}
              <section className={`${cardClass} space-y-5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                      <span className="material-symbols-outlined text-[19px]">
                        sell
                      </span>
                    </div>
                    <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                      Collections &amp; Tags
                    </h2>
                  </div>
                  <Link
                    to="/collections/add-collection"
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 font-label-mono text-[11px] uppercase tracking-wider text-primary transition-colors hover:bg-primary/10"
                  >
                    <span className="material-symbols-outlined !text-[15px]">
                      add
                    </span>
                    New Collection
                  </Link>
                </div>

                {/* Collections Assignment */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Assign to Collections
                    </label>
                    <span className="font-label-mono text-[10px] uppercase tracking-wider text-primary">
                      {selectedCollections.length} selected
                    </span>
                  </div>

                  {collections.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {collections.map((collection) => {
                        const isSelected = selectedCollections.includes(
                          collection._id,
                        );
                        return (
                          <button
                            type="button"
                            key={collection._id}
                            aria-pressed={isSelected}
                            onClick={() =>
                              toggleCollectionSelection(collection._id)
                            }
                            className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-left transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                : "border-outline-variant/40 bg-surface-container-low text-on-surface hover:border-primary/40"
                            }`}
                          >
                            <span className="material-symbols-outlined !text-[18px]">
                              {isSelected
                                ? "check_circle"
                                : "collections_bookmark"}
                            </span>
                            <span className="font-label-sans text-xs font-medium">
                              {collection.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant">
                      No collections created yet.{" "}
                      <Link
                        to="/collections/add-collection"
                        className="font-semibold text-primary underline"
                      >
                        Create your first collection
                      </Link>{" "}
                      to group products.
                    </p>
                  )}
                </div>

                <div className="border-t border-outline-variant/30 pt-4 space-y-2">
                  <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Product Tags
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {productData.tags.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() =>
                          setProductData((currentData) => ({
                            ...currentData,
                            tags: currentData.tags.filter(
                              (item) => item !== tag,
                            ),
                          }))
                        }
                        className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 font-label-mono text-xs text-primary transition-all hover:bg-primary/20"
                      >
                        {tag} <span aria-hidden="true">×</span>
                      </button>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTag();
                        }
                      }}
                      aria-label="New tag"
                      placeholder="NEW TAG"
                      className="w-28 rounded-full border border-outline-variant/40 bg-surface-container-low px-3.5 py-1.5 font-label-mono text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="flex cursor-pointer items-center gap-1.5 rounded-full border border-outline-variant/60 bg-surface-container-high/60 px-3.5 py-1.5 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        add
                      </span>
                      <span>Add Tag</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Sticky Sidebar (5 cols) */}
            <div className="space-y-6 lg:col-span-5 lg:sticky lg:top-28">
              {/* Product Media Manager Component */}
              <ProductImagesManager
                images={productImages}
                productName={productName}
                isUploading={isUploadingImages}
                onMoveImage={moveProductImage}
                onRemoveImage={removeProductImage}
                onMakePrimary={makeImagePrimary}
                onOpenGallery={() => setIsGalleryOpen(true)}
                onFileChange={handleProductImageChange}
              />

              {/* Storefront Live Card Preview */}
              <section className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                      <span className="material-symbols-outlined text-[19px]">
                        visibility
                      </span>
                    </div>
                    <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                      Storefront Preview
                    </h2>
                  </div>
                  <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-mono text-[10px] uppercase tracking-wider text-on-secondary-container font-medium">
                    Live
                  </span>
                </div>

                <div className="space-y-4 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
                  <div className="space-y-1">
                    <p className="font-label-mono text-[10px] uppercase tracking-widest text-primary font-semibold">
                      {productData.brand || "Atelier Brand"}
                    </p>
                    <h4 className="font-headline-md text-lg text-on-surface font-semibold">
                      {productName || "Product Title"}
                    </h4>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="font-headline-md text-2xl text-primary font-bold">
                      {formatCurrency(price || 0)}
                    </span>
                    {comparePrice && Number(comparePrice) > 0 && (
                      <span className="font-label-mono text-sm text-on-surface-variant/50 line-through">
                        {formatCurrency(comparePrice || 0)}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Predicted Performance */}
              <section className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                      <span className="material-symbols-outlined text-[19px]">
                        insights
                      </span>
                    </div>
                    <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                      Predicted Performance
                    </h2>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Click-through Rate
                    </span>
                    <span className="font-label-mono text-primary font-bold">
                      8.4%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div className="relative h-full w-[84%] bg-primary rounded-full" />
                  </div>
                </div>
              </section>
            </div>
          </form>
        </div>
      </main>

      <GalleryDialog
        open={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onAdd={(images) => {
          setProductImages(images);
          setIsGalleryOpen(false);
        }}
        productImages={productImages || []}
      />
    </>
  );

}

export default AddProduct;
