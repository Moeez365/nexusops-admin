import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import {
  createCollection,
  getCollectionById,
  getCollections,
} from "../api/collections";
import { getProducts } from "../api/products";
import uploadImages from "../api/image";
import GalleryDialog from "../components/GalleryDialog";
import { ShimmerImage } from "../components/common";
import { slugify } from "../utils";

const cardClass =
  "rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-6 shadow-[0_16px_45px_rgba(50,35,75,0.08)] backdrop-blur-xl";

const inputClass =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-body-base text-on-surface placeholder:text-on-surface-variant/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

const inputWithIconClass =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-low pl-10 pr-4 py-2.5 text-body-base text-on-surface placeholder:text-on-surface-variant/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

const initialFormData = {
  name: "",
  slug: "",
  parentCollection: "None (Top Level)",
  description: "",
  assignedProducts: [],
  coverMedia: null,
  visibility: "online",
  seoDescription: "",
};

/**
 * Serializes form state into the API-compatible collection payload.
 *
 * @param {typeof initialFormData} formData
 * @returns {Object} Payload sent to create/update collection endpoint
 */
function buildCollectionPayload(formData) {
  const name = formData.name.trim();
  return {
    name,
    slug: formData.slug.trim() || slugify(name),
    parentCollection: formData.parentCollection || "None (Top Level)",
    description: formData.description.trim(),
    products: formData.assignedProducts,
    image: formData.coverMedia?._id || null,
    isActive: formData.visibility === "online",
    seoDescription: formData.seoDescription.trim(),
  };
}

function AddCollection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get("id");

  const fileInputRef = useRef(null);
  const isSlugUserEdited = useRef(false);
  const coverPreviewUrlRef = useRef("");
  const coverUploadRequestRef = useRef(0);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [initialCoverImages, setInitialCoverImages] = useState("");
  const [savedCollection, setSavedCollection] = useState(null);

  // Form State
  const [formData, setFormData] = useState(initialFormData);

  const updateFormField = (field, value) => {
    setFormData((previousData) => ({ ...previousData, [field]: value }));
  };

  // UI status state
  const [isDragging, setIsDragging] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const payload = buildCollectionPayload(formData);
  const snapshot = JSON.stringify(payload);
  const hasBaseline = savedCollection?.id === collectionId;
  const hasRequiredFields =
    Boolean(formData.name?.trim()) && Boolean(payload.slug?.trim());
  const isSaveDisabled =
    isSubmitting ||
    isCoverUploading ||
    !hasRequiredFields ||
    (collectionId && !hasBaseline) ||
    (hasBaseline && savedCollection.snapshot === snapshot);

  const handleAddNewCollection = () => {
    if (coverPreviewUrlRef.current) {
      URL.revokeObjectURL(coverPreviewUrlRef.current);
      coverPreviewUrlRef.current = "";
    }
    isSlugUserEdited.current = false;
    setFormData(initialFormData);
    setInitialCoverImages("");
    setSavedCollection(null);
    setNotification(null);
    setSearchQuery("");
    navigate("/collections/add-collection");
  };

  // Handle Collection Name change and auto-slug generation
  const handleNameChange = (e) => {
    const value = e.target.value;
    const updates = { name: value };
    if (!isSlugUserEdited.current) {
      updates.slug = slugify(value);
    }
    setFormData((previousData) => ({ ...previousData, ...updates }));
  };

  const handleSlugChange = (e) => {
    updateFormField("slug", e.target.value);
    isSlugUserEdited.current = true;
  };

  // Toggle product assignment selection
  const toggleProductSelection = (productId) => {
    setFormData((previousData) => ({
      ...previousData,
      assignedProducts: previousData.assignedProducts.includes(productId)
        ? previousData.assignedProducts.filter((id) => id !== productId)
        : [...previousData.assignedProducts, productId],
    }));
  };

  // Handle Cover Media file upload / drag drop
  const handleFileChange = async (file) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setNotification({
        type: "error",
        message: "Please upload an image file (PNG, JPG, WebP).",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setNotification({
        type: "error",
        message: "Please select an image smaller than 10MB.",
      });
      return;
    }

    if (coverPreviewUrlRef.current) {
      URL.revokeObjectURL(coverPreviewUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    const requestId = ++coverUploadRequestRef.current;
    coverPreviewUrlRef.current = previewUrl;
    setInitialCoverImages(previewUrl);
    updateFormField("coverMedia", null);
    setIsCoverUploading(true);
    setNotification(null);

    try {
      const response = await uploadImages([file]);
      if (requestId !== coverUploadRequestRef.current) return;
      const uploadedImage = response.data?.[0];
      if (!uploadedImage?.url) {
        throw new Error("The upload did not return an image URL.");
      }
      updateFormField("coverMedia", uploadedImage);
    } catch (error) {
      if (requestId !== coverUploadRequestRef.current) return;
      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Cover image upload failed. Please try again.",
      });
    } finally {
      if (requestId === coverUploadRequestRef.current) {
        setIsCoverUploading(false);
      }
    }
  };

  const handleFileInputSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
      e.target.value = "";
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Save / Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSaveDisabled) return;
    const name = formData.name.trim();

    if (!name) {
      setNotification({
        type: "error",
        message: "Collection Name is required.",
      });
      return;
    }

    setIsSubmitting(true);
    const requestPayload = {
      ...payload,
      ...(collectionId ? { id: collectionId } : {}),
    };

    try {
      const res = await createCollection(requestPayload);
      const savedId = res?.data?._id || collectionId;
      setSavedCollection({ id: savedId, snapshot });
      setNotification({
        type: "success",
        message: collectionId
          ? "Collection updated successfully!"
          : "Collection created successfully!",
      });
      if (!collectionId && savedId) {
        navigate(`/collections/add-collection?id=${encodeURIComponent(savedId)}`);
      }
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to save collection. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    async function fetchCatalogData() {
      try {
        const [productsRes, collectionsRes] = await Promise.all([
          getProducts(),
          getCollections(),
        ]);
        setProducts(productsRes.data || []);
        setCollections(collectionsRes.data || []);
      } catch (error) {
        console.error(error);
      }
    }
    fetchCatalogData();
  }, []);

  useEffect(() => {
    if (!collectionId) return;

    let isCancelled = false;
    async function fetchCollectionDetails() {
      try {
        const res = await getCollectionById(collectionId);
        const collection = res.data;
        if (!collection || isCancelled) return;

        const assignedIds = Array.isArray(collection.products)
          ? collection.products
              .map((item) => (typeof item === "object" ? item._id : item))
              .filter(Boolean)
          : [];
        const loadedCover =
          collection.image && typeof collection.image === "object"
            ? collection.image
            : null;

        const loadedFormData = {
          name: collection.name ?? "",
          slug: collection.slug ?? "",
          parentCollection: collection.parentCollection || "None (Top Level)",
          description: collection.description ?? "",
          assignedProducts: assignedIds,
          coverMedia: loadedCover,
          visibility: collection.isActive === false ? "scheduled" : "online",
          seoDescription: collection.seoDescription ?? "",
        };

        isSlugUserEdited.current = Boolean(collection.slug);
        setFormData(loadedFormData);
        setInitialCoverImages(loadedCover?.url || "");
        setSavedCollection({
          id: collectionId,
          snapshot: JSON.stringify(buildCollectionPayload(loadedFormData)),
        });
      } catch (error) {
        if (!isCancelled) {
          setNotification({
            type: "error",
            message:
              error.response?.data?.message ||
              "Failed to load collection details.",
          });
        }
      }
    }

    fetchCollectionDetails();
    return () => {
      isCancelled = true;
    };
  }, [collectionId]);

  useEffect(
    () => () => {
      if (coverPreviewUrlRef.current) {
        URL.revokeObjectURL(coverPreviewUrlRef.current);
      }
    },
    [],
  );

  // Filter products by search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(product.sku ?? product.stock ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const parentCollectionOptions = [
    "None (Top Level)",
    ...Array.from(
      new Set([
        "Accessories",
        "Timepieces",
        "Bridal Collection",
        ...collections
          .filter((item) => item._id !== collectionId && item.name)
          .map((item) => item.name),
      ]),
    ),
  ];

  return (
    <>
      <PageHeader
        title={collectionId ? "Edit Collection" : "Add Collection"}
        secondaryButtonLabel="Add New Collection"
        secondaryButtonIcon="add"
        onSecondaryButtonClick={handleAddNewCollection}
        buttonLabel={isSubmitting ? "Saving..." : "Save Collection"}
        buttonIcon={isSaveDisabled && !isSubmitting ? "lock" : "save"}
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
                  to="/collections"
                  className="font-label-mono text-[10px] uppercase tracking-widest text-primary transition-colors hover:underline"
                >
                  Atelier Curations
                </Link>
                <span className="text-outline text-xs">/</span>
                <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {collectionId
                    ? "Edit Collection Protocol"
                    : "Collection Protocol"}
                </span>
              </div>
              <h1 className="font-headline-lg text-2xl tracking-tight text-on-surface md:text-headline-lg">
                {collectionId ? "Edit Collection" : "Create Collection"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/collections")}
                className="cursor-pointer rounded-full border border-outline-variant/60 bg-surface-container-high/60 px-5 py-2 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface active:scale-95"
              >
                Cancel
              </button>
              {collectionId && (
                <button
                  type="button"
                  onClick={handleAddNewCollection}
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
                  {isSaveDisabled && !isSubmitting ? "lock" : "save"}
                </span>
                <span>
                  {isSubmitting
                    ? "Saving..."
                    : collectionId
                      ? "Save Changes"
                      : "Save Collection"}
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
                aria-label="Dismiss notification"
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
              {/* General Information */}
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
                  {/* Collection Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="collection-name"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      Collection Name
                    </label>
                    <input
                      id="collection-name"
                      type="text"
                      value={formData.name}
                      onChange={handleNameChange}
                      required
                      className={inputClass}
                      placeholder="e.g., High Jewelry"
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="collection-slug"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      URL Slug
                    </label>
                    <div className="flex items-center overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-low focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                      <span className="px-3.5 text-xs text-outline select-none font-label-mono">
                        /collections/
                      </span>
                      <input
                        id="collection-slug"
                        type="text"
                        value={formData.slug}
                        onChange={handleSlugChange}
                        className="w-full min-w-0 py-2.5 pr-4 border-none bg-transparent outline-none text-on-surface text-body-base placeholder:text-on-surface-variant/50"
                        placeholder="high-jewelry"
                      />
                    </div>
                  </div>

                  {/* Parent Collection */}
                  <div className="space-y-1.5">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Parent Collection
                    </label>
                    <div className="relative">
                      <select
                        value={formData.parentCollection}
                        onChange={(e) =>
                          updateFormField("parentCollection", e.target.value)
                        }
                        className={`${inputClass} appearance-none pr-10 cursor-pointer`}
                      >
                        {parentCollectionOptions.map((option) => (
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

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="collection-description"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      Description
                    </label>
                    <textarea
                      id="collection-description"
                      rows={5}
                      value={formData.description}
                      onChange={(e) =>
                        updateFormField("description", e.target.value)
                      }
                      className={`${inputClass} resize-none`}
                      placeholder="Crafted with precision and rare gemstones, the High Jewelry collection embodies NexaOps's commitment to excellence..."
                    />
                  </div>
                </div>
              </section>

              {/* Product Assignment */}
              <section className={cardClass}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                      <span className="material-symbols-outlined text-[19px]">
                        inventory_2
                      </span>
                    </div>
                    <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                      Product Assignment
                    </h2>
                  </div>
                  <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-mono text-[10px] uppercase tracking-wider text-on-secondary-container font-medium">
                    {formData.assignedProducts.length} Selected
                  </span>
                </div>

                {/* Search Field */}
                <div className="relative mb-5">
                  <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-outline text-[20px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={inputWithIconClass}
                    aria-label="Search products"
                    placeholder="Search products by SKU or name..."
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-2.5 text-outline hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        close
                      </span>
                    </button>
                  )}
                </div>

                {/* Product Selection Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      const isSelected = formData.assignedProducts.includes(
                        product._id,
                      );
                      return (
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          key={product._id}
                          onClick={() => toggleProductSelection(product._id)}
                          className={`text-left p-3 rounded-2xl border transition-all flex flex-col gap-2 group cursor-pointer relative ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-outline-variant/40 bg-surface-container-low hover:border-primary/50"
                          }`}
                        >
                          <div className="absolute top-2.5 right-2.5 z-10">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-primary text-white shadow-sm"
                                  : "bg-surface-container-high/70 text-outline group-hover:bg-surface-container-high"
                              }`}
                            >
                              <span className="material-symbols-outlined text-xs">
                                check
                              </span>
                            </div>
                          </div>

                          <div className="aspect-square rounded-xl bg-surface-container-high overflow-hidden relative">
                            <ShimmerImage
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 motion-reduce:transition-none"
                              src={product.images?.[0]?.url}
                              alt={product.name}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-label-sans text-xs font-semibold text-on-surface truncate">
                              {product.name}
                            </p>
                            <p className="font-label-mono text-[10px] text-outline">
                              Stock: {product.stock}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-8 text-center text-sm text-on-surface-variant">
                      No products match "{searchQuery}"
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right Column: Sticky Sidebar (5 cols) */}
            <div className="space-y-6 lg:col-span-5 lg:sticky lg:top-28">
              {/* Media Section */}
              <section className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                      <span className="material-symbols-outlined text-[19px]">
                        photo_library
                      </span>
                    </div>
                    <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                      Collection Cover
                    </h2>
                  </div>
                  <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-mono text-[10px] uppercase tracking-wider text-on-secondary-container font-medium">
                    Media
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputSelect}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative aspect-[16/10] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center p-6 group transition-all cursor-pointer overflow-hidden ${
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-outline-variant/50 bg-surface-container-low hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  {initialCoverImages || formData.coverMedia?.url ? (
                    <div className="absolute inset-0 overflow-hidden bg-surface-container-high group/cover">
                      <ShimmerImage
                        src={initialCoverImages || formData.coverMedia.url}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                      />
                      {isCoverUploading && (
                        <div className="absolute inset-0 z-10 bg-black/45 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 text-white">
                          <span className="material-symbols-outlined text-4xl animate-spin">
                            progress_activity
                          </span>
                          <p className="text-sm font-semibold">
                            Uploading cover...
                          </p>
                        </div>
                      )}
                      {!isCoverUploading && (
                        <div
                          className={`absolute inset-0 bg-black/50 opacity-0 group-hover/cover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 text-white p-4 ${isCoverUploading ? "pointer-events-none" : ""}`}
                        >
                          <span className="material-symbols-outlined text-3xl">
                            edit
                          </span>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="rounded-full bg-primary px-4 py-2 font-label-mono text-xs uppercase tracking-wider text-on-primary shadow-sm hover:bg-primary/90 cursor-pointer"
                            >
                              Change Cover
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsGalleryOpen(true);
                              }}
                              className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/20 px-3.5 py-2 font-label-mono text-xs uppercase tracking-wider text-white backdrop-blur-sm hover:bg-white/30 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">
                                photo_library
                              </span>
                              Gallery
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              coverUploadRequestRef.current += 1;
                              if (coverPreviewUrlRef.current) {
                                URL.revokeObjectURL(coverPreviewUrlRef.current);
                                coverPreviewUrlRef.current = "";
                              }
                              setInitialCoverImages("");
                              setIsCoverUploading(false);
                              updateFormField("coverMedia", null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                            className="px-3.5 py-1.5 bg-error/90 text-on-error rounded-full font-label-mono text-xs uppercase tracking-wider hover:bg-error transition-colors cursor-pointer"
                          >
                            Remove Cover
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center mb-3 text-on-secondary-container group-hover:scale-105 transition-transform shadow-sm">
                        <span className="material-symbols-outlined text-3xl">
                          cloud_upload
                        </span>
                      </div>
                      <p className="font-title-md text-sm font-semibold text-on-surface mb-1">
                        Add Collection Image
                      </p>
                      <p className="font-label-mono text-[10px] text-on-surface-variant">
                        PNG, JPG, or WebP up to 10MB
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer rounded-full bg-primary px-4 py-1.5 font-label-mono text-xs uppercase tracking-wider text-on-primary shadow-sm hover:bg-primary/90 transition-colors"
                        >
                          Browse File
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsGalleryOpen(true)}
                          className="cursor-pointer flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-surface-container-high/60 px-3.5 py-1.5 font-label-mono text-xs uppercase tracking-wider text-on-surface hover:bg-surface-container transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">
                            photo_library
                          </span>
                          Gallery
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Live Storefront Summary Box */}
                <div className="mt-4 space-y-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
                  <div className="space-y-1">
                    <p className="font-label-mono text-[10px] uppercase tracking-widest text-primary font-semibold">
                      Live Preview
                    </p>
                    <h4 className="font-headline-md text-lg text-on-surface font-semibold break-words">
                      {formData.name || "Collection Title"}
                    </h4>
                    <p className="text-xs text-on-surface-variant line-clamp-2 break-words">
                      {formData.description ||
                        "Your collection description will appear here."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/30">
                    <span className="font-label-mono text-xs text-primary font-bold">
                      {formData.assignedProducts.length}{" "}
                      {formData.assignedProducts.length === 1
                        ? "Product"
                        : "Products"}
                    </span>
                    <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-mono text-[10px] uppercase tracking-wider text-on-secondary-container font-medium">
                      {formData.visibility === "online"
                        ? "Online"
                        : "Scheduled"}
                    </span>
                  </div>
                </div>
              </section>

              {/* Status & Metadata */}
              <section className={cardClass}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                    <span className="material-symbols-outlined text-[19px]">
                      public
                    </span>
                  </div>
                  <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                    Publishing Details
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Store Visibility
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateFormField("visibility", "online")}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl font-label-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          formData.visibility === "online"
                            ? "border-2 border-primary bg-primary/10 text-primary font-bold shadow-sm"
                            : "border border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        <span
                          className="material-symbols-outlined text-[18px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          public
                        </span>
                        <span>Online</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateFormField("visibility", "scheduled")
                        }
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl font-label-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          formData.visibility === "scheduled"
                            ? "border-2 border-primary bg-primary/10 text-primary font-bold shadow-sm"
                            : "border border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          schedule
                        </span>
                        <span>Scheduled</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label
                      htmlFor="collection-seo"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      SEO Description (Meta Tag)
                    </label>
                    <input
                      id="collection-seo"
                      type="text"
                      value={formData.seoDescription}
                      onChange={(e) =>
                        updateFormField("seoDescription", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Luxury High Jewelry Collection"
                    />
                    <p className="font-label-mono text-[10px] text-outline">
                      Search engines display the first 160 characters.
                    </p>
                  </div>
                </div>
              </section>

              {/* Merchandising Guidelines Tip Box */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                  <span className="material-symbols-outlined text-[19px]">
                    help
                  </span>
                </div>
                <div className="space-y-0.5">
                  <p className="font-title-md text-sm font-semibold text-on-surface">
                    Need help organizing?
                  </p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Review our luxury merchandising guidelines for collection
                    naming conventions and seasonal curation.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <GalleryDialog
        open={Boolean(isGalleryOpen)}
        onClose={() => setIsGalleryOpen(false)}
        onAdd={(images) => {
          const selectedImage = images?.[0];
          if (selectedImage) {
            if (coverPreviewUrlRef.current) {
              URL.revokeObjectURL(coverPreviewUrlRef.current);
              coverPreviewUrlRef.current = "";
            }
            setInitialCoverImages(selectedImage.url || "");
            updateFormField("coverMedia", selectedImage);
          }
          setIsGalleryOpen(false);
        }}
        productImages={formData.coverMedia ? [formData.coverMedia] : []}
      />
    </>
  );
}

export default AddCollection;
