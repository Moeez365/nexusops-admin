import { useNavigate } from "react-router-dom";
import NexaOpsLogo from "./NexaOpsLogo";



function PageHeader({
  title = "Products",
  buttonLabel = "Add New",
  buttonIcon = "add",
  onButtonClick,
  buttonTo,
  buttonDisabled = false,
  secondaryButtonLabel,
  secondaryButtonIcon = "add",
  onSecondaryButtonClick,
  secondaryButtonTo,
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (buttonDisabled) return;
    if (onButtonClick) {
      onButtonClick();
    } else if (buttonTo) {
      navigate(buttonTo);
    } else {
      navigate("/inventory/add-product");
    }
  };

  const handleSecondaryClick = () => {
    if (onSecondaryButtonClick) {
      onSecondaryButtonClick();
    } else if (secondaryButtonTo) {
      navigate(secondaryButtonTo);
    } else {
      navigate("/inventory/add-product");
    }
  };

  const handleToggleNav = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      window.dispatchEvent(new Event("open-mobile-navigation"));
    } else {
      window.dispatchEvent(new Event("toggle-desktop-navigation"));
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-outline-variant/60 bg-surface/90 shadow-[0_4px_18px_rgba(50,35,75,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3.5">
          <button
            className="cursor-pointer rounded-full p-2 text-on-surface-variant transition-colors hover:bg-primary/5 hover:text-primary active:scale-95"
            type="button"
            aria-label="Toggle navigation"
            onClick={handleToggleNav}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="md:hidden">
            <NexaOpsLogo size="sm" showText={false} />
          </div>
          <div className="min-w-0">
            <p className="font-label-mono text-[9px] uppercase tracking-[0.22em] text-primary">
              NexaOps Console
            </p>
            <h2 className="truncate font-headline-lg-mobile text-headline-lg-mobile tracking-tight md:font-headline-lg md:text-headline-lg">
              {title}
            </h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {secondaryButtonLabel && (
            <button
              type="button"
              onClick={handleSecondaryClick}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-primary/30 bg-primary-container/60 px-4 py-2 font-title-md text-primary transition-all hover:-translate-y-0.5 hover:bg-primary-container active:translate-y-0 active:scale-95 sm:px-5"
            >
              <span className="material-symbols-outlined text-[20px]">
                {secondaryButtonIcon}
              </span>
              <span className="hidden sm:inline">{secondaryButtonLabel}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleClick}
            disabled={buttonDisabled}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 font-title-md text-on-primary shadow-[0_6px_16px_rgba(109,59,215,0.16)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_9px_22px_rgba(109,59,215,0.24)] active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant/50 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-surface-container-high disabled:active:scale-100 sm:px-6"
          >
            <span className="material-symbols-outlined text-[20px]">
              {buttonIcon}
            </span>
            <span className="hidden sm:inline">
              {buttonLabel}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default PageHeader;
