
const sizeMap = {
  sm: {
    container: "h-8",
    logoImg: "h-7 w-auto",
    iconBox: "h-8 w-8 rounded-xl",
    title: "text-lg",
    badge: "px-1.5 py-0.5 text-[9px]",
    subtitle: "text-[9px]",
  },
  md: {
    container: "h-10",
    logoImg: "h-9 w-auto",
    iconBox: "h-10 w-10 rounded-xl",
    title: "text-xl",
    badge: "px-2 py-0.5 text-[10px]",
    subtitle: "text-[10px]",
  },
  lg: {
    container: "h-12",
    logoImg: "h-11 w-auto",
    iconBox: "h-12 w-12 rounded-2xl",
    title: "text-2xl",
    badge: "px-2.5 py-0.5 text-[11px]",
    subtitle: "text-[10px]",
  },
  xl: {
    container: "h-16",
    logoImg: "h-14 w-auto",
    iconBox: "h-16 w-16 rounded-2xl",
    title: "text-3xl",
    badge: "px-3 py-1 text-xs",
    subtitle: "text-xs",
  },
};

function NexaOpsLogo({
  size = "md",
  showText = true,
  showSubtitle = true,
  subtitle = "ADMIN",
  className = "",
  forceCustomSubtitle = false,
}) {
  const currentSize = sizeMap[size] || sizeMap.md;
  const isDefaultAdminSubtitle =
    !subtitle ||
    subtitle.trim().toUpperCase() === "ADMIN" ||
    subtitle === "Commerce OS" ||
    subtitle === "Luxury Commerce";

  // When showText is false (e.g. collapsed sidebar, mobile navbar icon):
  if (!showText) {
    return (
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden transition-all duration-200 ${currentSize.iconBox} ${className}`}
        title="NexaOps Admin"
      >
        <img
          src="/nexaops-icon.png"
          alt="NexaOps Icon"
          className="h-full w-full object-contain drop-shadow-[0_6px_16px_rgba(109,59,215,0.25)] transition-transform hover:scale-105"
        />
      </div>
    );
  }

  // When default logo with "nexaops ADMIN" wordmark is requested:
  // Render the official logo artwork image directly
  if (isDefaultAdminSubtitle && !forceCustomSubtitle) {
    return (
      <div
        className={`inline-flex items-center select-none ${className}`}
        title="NexaOps Admin"
      >
        <img
          src="/nexaops-logo.png"
          alt="NexaOps Admin"
          className={`${currentSize.logoImg} max-w-full object-contain drop-shadow-[0_4px_14px_rgba(109,59,215,0.18)] transition-transform hover:scale-[1.02]`}
        />
      </div>
    );
  }

  // When a specialized subtitle is provided (e.g. "Verified Brand", "E-Commerce OS"):
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden transition-all ${currentSize.iconBox}`}
      >
        <img
          src="/nexaops-icon.png"
          alt="NexaOps Icon"
          className="h-full w-full object-contain drop-shadow-[0_6px_16px_rgba(109,59,215,0.25)]"
        />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1 leading-none">
          <span
            className={`font-display-lg font-bold tracking-tight text-[#20123d] dark:text-white ${currentSize.title}`}
          >
            nexa
          </span>
          <span
            className={`font-display-lg font-bold tracking-tight text-primary ${currentSize.title}`}
          >
            ops
          </span>
          <span
            className={`ml-1 rounded-md border border-primary/25 bg-primary-container font-label-mono font-bold uppercase tracking-wider text-primary ${currentSize.badge}`}
          >
            ADMIN
          </span>
        </div>
        {showSubtitle && subtitle && (
          <p
            className={`mt-1 font-label-mono uppercase tracking-[0.22em] text-on-surface-variant ${currentSize.subtitle}`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default NexaOpsLogo;

