import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import GalleryDialog from "../components/GalleryDialog";
import PageHeader from "../components/PageHeader";
import { ShimmerImage } from "../components/common";
import uploadImages from "../api/image";
import { createUser, getUserById, updateUser } from "../api/users";
import {
  INITIAL_CUSTOMER_FORM,
  buildCustomerPayload,
  evaluateCustomerReadiness,
  getCustomerInitials,
  mapUserToForm,
} from "../utils/customerForm";

const cardClass =
  "rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-6 shadow-[0_16px_45px_rgba(50,35,75,0.08)] backdrop-blur-xl";

const inputClass =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-body-base text-on-surface placeholder:text-on-surface-variant/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

const TIER_OPTIONS = [
  { value: "New", label: "New", icon: "person_add" },
  { value: "Active", label: "Active", icon: "verified_user" },
  { value: "VIP", label: "VIP", icon: "workspace_premium" },
];

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function AddCustomer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get("id");
  const isEditMode = Boolean(customerId);

  const fileInputRef = useRef(null);
  const hydratedIdRef = useRef(null);
  const avatarPreviewUrlRef = useRef("");
  const avatarUploadRequestRef = useRef(0);

  const [formData, setFormData] = useState(INITIAL_CUSTOMER_FORM);
  const [savedCustomer, setSavedCustomer] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState("");
  const [selectedAvatarMedia, setSelectedAvatarMedia] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(Boolean(customerId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const updateFormField = (field, value) => {
    setFormData((previousData) => ({ ...previousData, [field]: value }));
  };

  const revokeAvatarPreview = () => {
    if (avatarPreviewUrlRef.current) {
      URL.revokeObjectURL(avatarPreviewUrlRef.current);
      avatarPreviewUrlRef.current = "";
    }
  };

  useEffect(() => () => revokeAvatarPreview(), []);

  useEffect(() => {
    if (!customerId) {
      hydratedIdRef.current = null;
      setIsLoadingCustomer(false);
      return undefined;
    }

    if (hydratedIdRef.current === customerId) {
      setIsLoadingCustomer(false);
      return undefined;
    }

    const controller = new AbortController();
    setIsLoadingCustomer(true);
    setNotification(null);

    async function fetchCustomerDetails() {
      try {
        const res = await getUserById(customerId, controller.signal);
        const user = res?.data;
        if (!user) {
          setNotification({
            type: "error",
            message: "Customer record could not be found.",
          });
          return;
        }

        const hydratedForm = mapUserToForm(user);
        hydratedIdRef.current = customerId;
        revokeAvatarPreview();
        setAvatarPreviewUrl(hydratedForm.avatar || "");
        setSelectedAvatarMedia(
          hydratedForm.avatar ? { url: hydratedForm.avatar } : null
        );
        setFormData(hydratedForm);
        setSavedCustomer({
          id: customerId,
          snapshot: JSON.stringify(
            buildCustomerPayload(hydratedForm, { isEditMode: true })
          ),
        });
      } catch (error) {
        if (error?.name === "CanceledError" || error?.name === "AbortError") {
          return;
        }
        setNotification({
          type: "error",
          message:
            error?.response?.data?.message ||
            "Failed to load customer details. Please try again.",
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCustomer(false);
        }
      }
    }

    fetchCustomerDetails();
    return () => controller.abort();
  }, [customerId]);

  const payload = buildCustomerPayload(formData, { isEditMode });
  const snapshot = JSON.stringify(payload);
  const hasBaseline = savedCustomer?.id === customerId;
  const { hasValidName, hasValidEmail, hasValidPassword, hasRequiredFields } =
    evaluateCustomerReadiness(formData, { isEditMode });

  const isSaveDisabled =
    isSubmitting ||
    isAvatarUploading ||
    isLoadingCustomer ||
    !hasRequiredFields ||
    (isEditMode && !hasBaseline) ||
    (hasBaseline && savedCustomer.snapshot === snapshot);

  const handleAddNewCustomer = () => {
    avatarUploadRequestRef.current += 1;
    revokeAvatarPreview();
    hydratedIdRef.current = null;
    setFormData(INITIAL_CUSTOMER_FORM);
    setSavedCustomer(null);
    setAvatarPreviewUrl("");
    setSelectedAvatarMedia(null);
    setIsAvatarUploading(false);
    setShowPassword(false);
    setNotification(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    navigate("/customers/add-customer");
  };

  const handleFileChange = async (file) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setNotification({
        type: "error",
        message: "Please upload an image file (PNG, JPG, WebP).",
      });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setNotification({
        type: "error",
        message: "Please select an image smaller than 10MB.",
      });
      return;
    }

    revokeAvatarPreview();
    const previewUrl = URL.createObjectURL(file);
    const requestId = ++avatarUploadRequestRef.current;
    avatarPreviewUrlRef.current = previewUrl;
    setAvatarPreviewUrl(previewUrl);
    setIsAvatarUploading(true);
    setNotification(null);

    try {
      const response = await uploadImages([file]);
      if (requestId !== avatarUploadRequestRef.current) return;
      const uploadedImage = response?.data?.[0];
      if (!uploadedImage?.url) {
        throw new Error("The upload did not return an image URL.");
      }
      revokeAvatarPreview();
      setAvatarPreviewUrl(uploadedImage.url);
      updateFormField("avatar", uploadedImage.url);
      setSelectedAvatarMedia(uploadedImage);
    } catch (error) {
      if (requestId !== avatarUploadRequestRef.current) return;
      revokeAvatarPreview();
      setAvatarPreviewUrl(formData.avatar || "");
      setNotification({
        type: "error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Avatar upload failed. Please try again.",
      });
    } finally {
      if (requestId === avatarUploadRequestRef.current) {
        setIsAvatarUploading(false);
      }
    }
  };

  const handleFileInputSelect = (e) => {
    if (e.target.files?.[0]) {
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
    if (e.dataTransfer.files?.[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveAvatar = (e) => {
    e.stopPropagation();
    avatarUploadRequestRef.current += 1;
    revokeAvatarPreview();
    setAvatarPreviewUrl("");
    setSelectedAvatarMedia(null);
    setIsAvatarUploading(false);
    updateFormField("avatar", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSaveDisabled) return;

    setIsSubmitting(true);
    setNotification(null);

    try {
      const response = isEditMode
        ? await updateUser(customerId, payload)
        : await createUser(payload);

      const savedId = response?.data?._id || customerId;
      const savedForm = response?.data ? mapUserToForm(response.data) : formData;
      const savedSnapshot = JSON.stringify(
        buildCustomerPayload(savedForm, { isEditMode: Boolean(savedId) })
      );

      hydratedIdRef.current = savedId;
      setFormData(savedForm);
      setSavedCustomer({ id: savedId, snapshot: savedSnapshot });
      setNotification({
        type: "success",
        message: isEditMode
          ? "Customer updated successfully!"
          : "Customer created successfully!",
      });

      if (!isEditMode && savedId) {
        navigate(`/customers/add-customer?id=${encodeURIComponent(savedId)}`, {
          replace: true,
        });
      }
    } catch (error) {
      setNotification({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Failed to save customer. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveLabel = isSubmitting
    ? "Saving..."
    : isEditMode
      ? "Save Changes"
      : "Save Customer";
  const saveIcon = isSaveDisabled && !isSubmitting ? "lock" : "save";
  const activePreviewUrl = avatarPreviewUrl || formData.avatar;

  return (
    <>
      <PageHeader
        title={isEditMode ? "Edit Customer" : "Add Customer"}
        secondaryButtonLabel="Add New Customer"
        secondaryButtonIcon="add"
        onSecondaryButtonClick={handleAddNewCustomer}
        buttonLabel={saveLabel}
        buttonIcon={saveIcon}
        onButtonClick={handleSubmit}
        buttonDisabled={isSaveDisabled}
      />

      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
          {/* Top Banner / Breadcrumb Area */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <Link
                  to="/customers"
                  className="font-label-mono text-[10px] uppercase tracking-widest text-primary transition-colors hover:underline"
                >
                  Client Directory
                </Link>
                <span className="text-xs text-outline">/</span>
                <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  {isEditMode ? "Edit Customer Protocol" : "Customer Protocol"}
                </span>
              </div>
              <h1 className="font-headline-lg text-2xl tracking-tight text-on-surface md:text-headline-lg">
                {isEditMode ? "Edit Customer" : "Create Customer"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/customers")}
                className="cursor-pointer rounded-full border border-outline-variant/60 bg-surface-container-high/60 px-5 py-2 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface active:scale-95"
              >
                Cancel
              </button>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleAddNewCustomer}
                  className="cursor-pointer rounded-full border border-outline-variant/60 bg-surface-container-high/60 px-5 py-2 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface active:scale-95"
                >
                  Add New
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaveDisabled}
                className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2 font-title-md text-sm text-on-primary shadow-[0_6px_16px_rgba(109,59,215,0.18)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {saveIcon}
                </span>
                <span>{saveLabel}</span>
              </button>
            </div>
          </div>

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
                className="p-1 hover:opacity-80"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {isLoadingCustomer && (
            <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-4 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[20px] text-primary">
                progress_activity
              </span>
              <span className="font-medium">Loading customer details...</span>
            </div>
          )}

          {/* Main Asymmetric Grid Layout (7 cols + 5 cols sticky sidebar) */}
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
          >
            {/* Left Column: Form Details (7 cols) */}
            <div className="space-y-6 lg:col-span-7">
              {/* Basic Information */}
              <section className={cardClass}>
                <div className="mb-5 flex items-center justify-between">
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
                  <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-mono text-[10px] font-medium uppercase tracking-wider text-on-secondary-container">
                    Required
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="customer-name"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      Full Name <span className="text-error">*</span>
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      value={formData.name}
                      onChange={(e) => updateFormField("name", e.target.value)}
                      className={inputClass}
                      placeholder="e.g., Sophia Laurent"
                    />
                    {formData.name.trim().length > 0 && !hasValidName && (
                      <p className="font-label-mono text-[10px] text-error">
                        Name must be between 2 and 100 characters.
                      </p>
                    )}
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="customer-email"
                        className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                      >
                        Email Address <span className="text-error">*</span>
                      </label>
                      <input
                        id="customer-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => updateFormField("email", e.target.value)}
                        className={inputClass}
                        placeholder="sophia@example.com"
                      />
                      {formData.email.trim().length > 0 && !hasValidEmail && (
                        <p className="font-label-mono text-[10px] text-error">
                          Enter a valid email address.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="customer-phone"
                        className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                      >
                        Phone Number
                      </label>
                      <input
                        id="customer-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormField("phone", e.target.value)}
                        className={inputClass}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  {/* Location & Password */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="customer-location"
                        className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                      >
                        Location
                      </label>
                      <input
                        id="customer-location"
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          updateFormField("location", e.target.value)
                        }
                        className={inputClass}
                        placeholder="e.g., Paris, France"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="customer-password"
                        className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                      >
                        Password {!isEditMode && <span className="text-error">*</span>}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="customer-password"
                          type={showPassword ? "text" : "password"}
                          required={!isEditMode}
                          minLength={6}
                          value={formData.password}
                          onChange={(e) =>
                            updateFormField("password", e.target.value)
                          }
                          className={`${inputClass} pr-10`}
                          placeholder={
                            isEditMode
                              ? "Leave blank to keep current"
                              : "Minimum 6 characters"
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          className="absolute right-2.5 cursor-pointer rounded-lg p-1 text-outline transition-colors hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                      {formData.password.length > 0 && !hasValidPassword ? (
                        <p className="font-label-mono text-[10px] text-error">
                          Password must be at least 6 characters.
                        </p>
                      ) : (
                        <p className="font-label-mono text-[10px] text-outline">
                          {isEditMode
                            ? "Optional when editing — 6+ chars to reset."
                            : "Minimum 6 characters required for account access."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Primary Address */}
              <section className={cardClass}>
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                      <span className="material-symbols-outlined text-[19px]">
                        local_shipping
                      </span>
                    </div>
                    <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                      Primary Address
                    </h2>
                  </div>
                  <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-mono text-[10px] font-medium uppercase tracking-wider text-on-secondary-container">
                    Optional
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label
                      htmlFor="customer-street"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      Street Address
                    </label>
                    <input
                      id="customer-street"
                      type="text"
                      value={formData.street}
                      onChange={(e) => updateFormField("street", e.target.value)}
                      className={inputClass}
                      placeholder="Street address, suite, apartment..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="customer-city"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      City
                    </label>
                    <input
                      id="customer-city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateFormField("city", e.target.value)}
                      className={inputClass}
                      placeholder="City"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="customer-state"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      State / Region
                    </label>
                    <input
                      id="customer-state"
                      type="text"
                      value={formData.state}
                      onChange={(e) => updateFormField("state", e.target.value)}
                      className={inputClass}
                      placeholder="State / Province / Region"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="customer-postal-code"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      Postal Code
                    </label>
                    <input
                      id="customer-postal-code"
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) =>
                        updateFormField("postalCode", e.target.value)
                      }
                      className={inputClass}
                      placeholder="Postal / ZIP code"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="customer-country"
                      className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant"
                    >
                      Country
                    </label>
                    <input
                      id="customer-country"
                      type="text"
                      value={formData.country}
                      onChange={(e) => updateFormField("country", e.target.value)}
                      className={inputClass}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Sticky Sidebar (5 cols) */}
            <div className="space-y-6 lg:sticky lg:top-28 lg:col-span-5">
              {/* Media Section */}
              <section className={cardClass}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                      <span className="material-symbols-outlined text-[19px]">
                        photo_library
                      </span>
                    </div>
                    <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                      Patron Portrait
                    </h2>
                  </div>
                  <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-mono text-[10px] font-medium uppercase tracking-wider text-on-secondary-container">
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
                  className={`group relative flex aspect-[16/10] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-outline-variant/50 bg-surface-container-low hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  {activePreviewUrl ? (
                    <div className="group/cover absolute inset-0 overflow-hidden bg-surface-container-high">
                      <ShimmerImage
                        src={activePreviewUrl}
                        alt={formData.name.trim() || "Patron portrait"}
                        className="h-full w-full object-cover"
                        fallbackIcon="person"
                      />
                      {isAvatarUploading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/45 text-white backdrop-blur-[2px]">
                          <span className="material-symbols-outlined animate-spin text-4xl">
                            progress_activity
                          </span>
                          <p className="text-sm font-semibold">
                            Uploading portrait...
                          </p>
                        </div>
                      )}
                      {!isAvatarUploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 p-4 text-white opacity-0 transition-opacity group-hover/cover:opacity-100">
                          <span className="material-symbols-outlined text-3xl">
                            edit
                          </span>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="cursor-pointer rounded-full bg-primary px-4 py-2 font-label-mono text-xs uppercase tracking-wider text-on-primary shadow-sm hover:bg-primary/90"
                            >
                              Change Portrait
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsGalleryOpen(true);
                              }}
                              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/40 bg-white/20 px-3.5 py-2 font-label-mono text-xs uppercase tracking-wider text-white backdrop-blur-sm hover:bg-white/30"
                            >
                              <span className="material-symbols-outlined text-sm">
                                photo_library
                              </span>
                              Gallery
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="cursor-pointer rounded-full bg-error/90 px-3.5 py-1.5 font-label-mono text-xs uppercase tracking-wider text-on-error transition-colors hover:bg-error"
                          >
                            Remove Portrait
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container shadow-sm transition-transform group-hover:scale-105">
                        <span className="material-symbols-outlined text-3xl">
                          cloud_upload
                        </span>
                      </div>
                      <p className="mb-1 font-title-md text-sm font-semibold text-on-surface">
                        Add Patron Image
                      </p>
                      <p className="font-label-mono text-[10px] text-on-surface-variant">
                        PNG, JPG, or WebP up to 10MB
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer rounded-full bg-primary px-4 py-1.5 font-label-mono text-xs uppercase tracking-wider text-on-primary shadow-sm transition-colors hover:bg-primary/90"
                        >
                          Browse File
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsGalleryOpen(true)}
                          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-outline-variant/60 bg-surface-container-high/60 px-3.5 py-1.5 font-label-mono text-xs uppercase tracking-wider text-on-surface transition-colors hover:bg-surface-container"
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

                {/* Live Patron Summary Box */}
                <div className="mt-4 space-y-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-outline-variant/40 bg-secondary-container text-on-secondary-container">
                      {activePreviewUrl ? (
                        <ShimmerImage
                          src={activePreviewUrl}
                          alt={formData.name.trim() || "Patron avatar"}
                          className="h-full w-full object-cover"
                          fallbackIcon="person"
                        />
                      ) : (
                        <span className="font-label-mono text-xs font-bold tracking-wider">
                          {getCustomerInitials(formData.name)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="font-label-mono text-[10px] font-semibold uppercase tracking-widest text-primary">
                        Live Preview
                      </p>
                      <h4 className="truncate font-headline-md text-lg font-semibold text-on-surface">
                        {formData.name.trim() || "Patron Name"}
                      </h4>
                      <p className="truncate text-xs text-on-surface-variant">
                        {formData.email.trim() || "patron@example.com"}
                        {formData.location.trim()
                          ? ` · ${formData.location.trim()}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-outline-variant/30 pt-3">
                    <span className="font-label-mono text-xs font-bold text-primary">
                      {formData.tier} Tier
                    </span>
                    <div className="flex items-center gap-1.5">
                      {formData.isEmailVerified && (
                        <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-mono text-[10px] font-medium uppercase tracking-wider text-on-secondary-container">
                          Verified
                        </span>
                      )}
                      <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-mono text-[10px] font-medium uppercase tracking-wider text-on-secondary-container">
                        {formData.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Tier & Account Details */}
              <section className={cardClass}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
                    <span className="material-symbols-outlined text-[19px]">
                      manage_accounts
                    </span>
                  </div>
                  <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                    Account &amp; Tier Details
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Customer Tier */}
                  <div className="space-y-2">
                    <p className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Customer Tier
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {TIER_OPTIONS.map((option) => {
                        const isSelected = formData.tier === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => updateFormField("tier", option.value)}
                            className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl p-3 font-label-mono text-xs uppercase tracking-wider transition-all ${
                              isSelected
                                ? "border-2 border-primary bg-primary/10 font-bold text-primary shadow-sm"
                                : "border border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                            }`}
                          >
                            <span
                              className="material-symbols-outlined text-[18px]"
                              style={
                                isSelected
                                  ? { fontVariationSettings: "'FILL' 1" }
                                  : undefined
                              }
                            >
                              {option.icon}
                            </span>
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="space-y-2">
                    <p className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Account Status
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        aria-pressed={formData.isActive}
                        onClick={() => updateFormField("isActive", true)}
                        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl p-3 font-label-mono text-xs uppercase tracking-wider transition-all ${
                          formData.isActive
                            ? "border-2 border-primary bg-primary/10 font-bold text-primary shadow-sm"
                            : "border border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        <span
                          className="material-symbols-outlined text-[18px]"
                          style={
                            formData.isActive
                              ? { fontVariationSettings: "'FILL' 1" }
                              : undefined
                          }
                        >
                          check_circle
                        </span>
                        <span>Active</span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={!formData.isActive}
                        onClick={() => updateFormField("isActive", false)}
                        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl p-3 font-label-mono text-xs uppercase tracking-wider transition-all ${
                          !formData.isActive
                            ? "border-2 border-primary bg-primary/10 font-bold text-primary shadow-sm"
                            : "border border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          pause_circle
                        </span>
                        <span>Inactive</span>
                      </button>
                    </div>
                  </div>

                  {/* Email Verification */}
                  <div className="space-y-2 pt-1">
                    <p className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      Email Verification
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        aria-pressed={formData.isEmailVerified}
                        onClick={() => updateFormField("isEmailVerified", true)}
                        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl p-3 font-label-mono text-xs uppercase tracking-wider transition-all ${
                          formData.isEmailVerified
                            ? "border-2 border-primary bg-primary/10 font-bold text-primary shadow-sm"
                            : "border border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        <span
                          className="material-symbols-outlined text-[18px]"
                          style={
                            formData.isEmailVerified
                              ? { fontVariationSettings: "'FILL' 1" }
                              : undefined
                          }
                        >
                          verified
                        </span>
                        <span>Verified</span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={!formData.isEmailVerified}
                        onClick={() => updateFormField("isEmailVerified", false)}
                        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl p-3 font-label-mono text-xs uppercase tracking-wider transition-all ${
                          !formData.isEmailVerified
                            ? "border-2 border-primary bg-primary/10 font-bold text-primary shadow-sm"
                            : "border border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          schedule
                        </span>
                        <span>Pending</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </form>
        </div>
      </main>

      <GalleryDialog
        open={Boolean(isGalleryOpen)}
        onClose={() => setIsGalleryOpen(false)}
        onAdd={(images) => {
          const selectedImage = images?.[0];
          if (selectedImage?.url) {
            revokeAvatarPreview();
            setAvatarPreviewUrl(selectedImage.url);
            setSelectedAvatarMedia(selectedImage);
            updateFormField("avatar", selectedImage.url);
          }
          setIsGalleryOpen(false);
        }}
        productImages={selectedAvatarMedia ? [selectedAvatarMedia] : []}
      />
    </>
  );
}

export default AddCustomer;
