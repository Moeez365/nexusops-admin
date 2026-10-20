import PropTypes from "prop-types";

const STATUS_CONFIGS = {
  active: {
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  delivered: {
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  completed: {
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  processing: {
    bg: "bg-primary-container text-primary border-primary/20",
    dot: "bg-primary",
  },
  shipped: {
    bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dot: "bg-blue-500",
  },
  pending: {
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  low_stock: {
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  out_of_stock: {
    bg: "bg-error-container text-error border-error/20",
    dot: "bg-error",
  },
  cancelled: {
    bg: "bg-error-container text-error border-error/20",
    dot: "bg-error",
  },
  draft: {
    bg: "bg-surface-container-high text-on-surface-variant border-outline-variant/40",
    dot: "bg-outline",
  },
  scheduled: {
    bg: "bg-surface-container-high text-on-surface-variant border-outline-variant/40",
    dot: "bg-primary/50",
  },
  vip: {
    bg: "bg-primary-container text-primary border-primary/20",
    dot: "bg-primary",
  },
  new: {
    bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    dot: "bg-sky-500",
  },
};

/**
 * StatusBadge component
 *
 * Renders a standardized, luxury-styled status indicator pill with an optional pulsating status dot.
 */
function StatusBadge({
  status = "active",
  label,
  pulse = true,
  showDot = true,
  size = "md",
  className = "",
}) {
  const normalizedKey = String(status).toLowerCase().replace(/\s+/g, "_");
  const config = STATUS_CONFIGS[normalizedKey] || STATUS_CONFIGS.draft;

  const displayLabel = label || status;
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-label-mono uppercase tracking-wider ${
        isSmall ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
      } ${config.bg} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5 items-center justify-center">
          {pulse && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.dot}`}
            />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${config.dot}`} />
        </span>
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
  label: PropTypes.string,
  pulse: PropTypes.bool,
  showDot: PropTypes.bool,
  size: PropTypes.oneOf(["sm", "md"]),
  className: PropTypes.string,
};

export default StatusBadge;
