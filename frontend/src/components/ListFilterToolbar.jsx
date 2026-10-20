import PropTypes from "prop-types";

export function ToolbarSelect({
  value,
  onChange,
  options = [],
  ariaLabel,
  className = "",
}) {
  return (
    <div className={`relative min-w-[145px] flex-1 sm:flex-none ${className}`}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-outline-variant/40 bg-surface-container-low pl-3.5 pr-9 font-label-mono text-xs uppercase tracking-wider text-on-surface transition-all hover:border-outline-variant hover:bg-surface-container-high/40 focus:border-primary focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
        expand_more
      </span>
    </div>
  );
}

ToolbarSelect.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
};

function ListFilterToolbar({
  tabs = [],
  activeTab,
  onTabChange,
  searchPlaceholder = "Search...",
  searchQuery = "",
  onSearchChange,
  children,
  totalFilteredCount,
  totalCount,
  onResetFilters,
  hasActiveFilters = false,
  className = "",
}) {
  return (
    <div
      className={`space-y-3.5 rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-4 shadow-[0_12px_36px_rgba(50,35,75,0.06)] backdrop-blur-xl transition-all ${className}`}
    >
      {/* Row 1: Status Tabs with live count badges */}
      {tabs.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                className={`group flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 font-title-md text-xs font-medium transition-all ${
                  isActive
                    ? "border border-outline-variant/40 bg-surface-bright text-on-surface shadow-sm dark:bg-surface-container-highest"
                    : "text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`rounded-full px-2 py-0.5 font-label-mono text-[10px] font-semibold tabular-nums transition-colors ${
                      isActive
                        ? "bg-primary-container font-bold text-primary"
                        : "bg-surface-container-highest/80 text-on-surface-variant group-hover:bg-primary-container/40 group-hover:text-primary"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {tabs.length > 0 && <div className="h-px w-full bg-outline-variant/30" />}

      {/* Row 2: Search input + dropdown filter controls */}
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="group relative flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant transition-colors group-focus-within:text-primary">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-xl border border-outline-variant/40 bg-surface-container-low pl-11 pr-9 text-sm text-on-surface transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Dropdown Filters and Action Slots */}
        {children && (
          <div className="flex flex-wrap items-center gap-2.5">
            {children}
          </div>
        )}
      </div>

      {/* Active filters status / Reset banner */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/20 pt-2 font-label-mono text-xs text-on-surface-variant">
          <span>
            Showing <strong className="text-on-surface">{totalFilteredCount}</strong> of{" "}
            {totalCount} items
          </span>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex cursor-pointer items-center gap-1 font-semibold text-primary transition-colors hover:underline"
            >
              <span className="material-symbols-outlined text-[15px]">
                filter_alt_off
              </span>
              Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

ListFilterToolbar.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      count: PropTypes.number,
    }),
  ),
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  searchQuery: PropTypes.string,
  onSearchChange: PropTypes.func,
  children: PropTypes.node,
  totalFilteredCount: PropTypes.number,
  totalCount: PropTypes.number,
  onResetFilters: PropTypes.func,
  hasActiveFilters: PropTypes.bool,
  className: PropTypes.string,
};

export default ListFilterToolbar;

