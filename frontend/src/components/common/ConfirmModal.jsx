import { useEffect } from "react";
import PropTypes from "prop-types";

/**
 * ConfirmModal component
 *
 * Professional, accessible modal dialog for destructive or critical actions (e.g. deleting products/collections).
 * Handles backdrop clicks, Escape key dismissal, and loading state.
 */
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm action",
  subtitle = "Warning",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  itemName = "",
  itemImage = null,
  confirmLabel = "Delete",
  confirmingLabel = "Deleting...",
  cancelLabel = "Cancel",
  isLoading = false,
  error = "",
  icon = "delete",
  variant = "danger", // "danger" | "primary"
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-y-0 left-0 right-0 z-[100] flex items-center justify-center bg-inverse-surface/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-[0_24px_70px_rgba(50,35,75,0.18)]">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                isDanger
                  ? "bg-error-container text-error"
                  : "bg-primary-container text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={`font-label-mono text-[10px] uppercase tracking-[0.2em] ${
                  isDanger ? "text-error" : "text-primary"
                }`}
              >
                {subtitle}
              </span>
              <h3
                id="confirm-dialog-title"
                className="mt-1 font-title-md text-title-md font-semibold text-on-surface"
              >
                {title}
              </h3>
              <p className="mt-1 text-body-base text-on-surface-variant">
                {message}
              </p>
            </div>
          </div>

          {/* Optional item detail preview */}
          {itemName && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container/70 p-3">
              {itemImage && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
                  <img
                    src={itemImage}
                    alt={itemName}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-on-surface">
                  {itemName}
                </p>
              </div>
            </div>
          )}

          {/* Error alert if operation fails */}
          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-error/20 bg-error-container px-4 py-2.5 text-xs font-medium text-on-error-container"
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <footer className="flex items-center justify-end gap-3 border-t border-outline-variant/60 bg-surface-container/30 px-6 py-4">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-2.5 font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant transition-all hover:bg-primary/5 hover:text-primary disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 font-title-md text-sm text-on-primary shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              isDanger
                ? "bg-error hover:bg-error/90 text-white"
                : "bg-primary hover:bg-primary/90 text-white"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                isLoading ? "animate-spin" : ""
              }`}
            >
              {isLoading ? "progress_activity" : icon}
            </span>
            <span>{isLoading ? confirmingLabel : confirmLabel}</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  message: PropTypes.node,
  itemName: PropTypes.string,
  itemImage: PropTypes.string,
  confirmLabel: PropTypes.string,
  confirmingLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  icon: PropTypes.string,
  variant: PropTypes.oneOf(["danger", "primary"]),
};

export default ConfirmModal;
