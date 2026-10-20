import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import PageHeader from "../components/PageHeader";
import { StatusBadge } from "../components/common";
import { getStoreAnalytics } from "../api/settings";
import { getOrders } from "../api/orders";

const cardClass =
  "rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-6 shadow-[0_16px_45px_rgba(50,35,75,0.08)] backdrop-blur-xl transition-all";

// ── Sub-component: Reusable KPICard ──────────────────────────────────────────
function KPICard({ title, value, changePercent, comparisonText, icon }) {
  const isPositive = !changePercent.startsWith("-");
  return (
    <article
      className={`${cardClass} flex flex-col justify-between hover:-translate-y-0.5 hover:border-primary/40`}
    >
      <div className="flex items-center justify-between">
        <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
          {title}
        </span>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-container text-primary shadow-sm">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-3xl font-semibold tracking-tight text-on-surface tabular-nums">
          {value}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label-mono text-[10px] font-semibold ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">
              {isPositive ? "trending_up" : "trending_down"}
            </span>
            {changePercent}
          </span>
          <span className="text-on-surface-variant text-[11px]">
            {comparisonText}
          </span>
        </div>
      </div>
    </article>
  );
}

KPICard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  changePercent: PropTypes.string.isRequired,
  comparisonText: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
};

// ── Sub-component: Dual-Axis Composed Chart (Revenue Line + Orders Bars) ─────
function ComposedSalesChart({ activeRange, setActiveRange, chartdata }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const rawItems = Array.isArray(chartdata) && chartdata.length > 0 ? chartdata : [];

  const parsedData = rawItems.map((item) => {
    let rev = 0;
    if (typeof item.amount === "number") {
      rev = item.amount;
    } else if (typeof item.revenue === "number") {
      rev = item.revenue;
    } else {
      const str = String(item.amount || item.revenue || "0");
      const num = parseFloat(str.replace(/[^0-9.]/g, "")) || 0;
      rev = str.toLowerCase().includes("k") ? num * 1000 : num;
    }

    let ord = 0;
    if (typeof item.orders === "number") {
      ord = item.orders;
    } else {
      const pct = parseFloat(String(item.height || "50").replace(/[^0-9.]/g, "")) || 50;
      ord = Math.round(pct * 2.5);
    }

    return {
      day: item.day,
      revenue: rev,
      orders: ord,
      active: Boolean(item.active),
    };
  });

  const width = 680;
  const height = 240;
  const paddingX = 40;
  const paddingY = 24;

  const pointsCount = parsedData.length;

  if (pointsCount === 0) {
    return (
      <article className={`${cardClass} flex min-h-[300px] items-center justify-center`}>
        <div className="flex items-center gap-2 font-label-mono text-xs text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-[18px] text-primary">
            progress_activity
          </span>
          <span>Loading sales telemetry...</span>
        </div>
      </article>
    );
  }

  const minRevRaw = Math.min(...parsedData.map((d) => d.revenue));
  const maxRevRaw = Math.max(...parsedData.map((d) => d.revenue));
  const maxOrdersRaw = Math.max(...parsedData.map((d) => d.orders));

  const minRev = Math.max(0, minRevRaw * 0.85);
  const maxRev = (maxRevRaw === minRev ? maxRevRaw + 1000 : maxRevRaw) * 1.08;
  const maxOrders = (maxOrdersRaw === 0 ? 100 : maxOrdersRaw) * 1.15;

  // Compute coordinates
  const coords = parsedData.map((d, idx) => {
    const x =
      paddingX + (idx / (pointsCount - 1 || 1)) * (width - paddingX * 2);
    const revNorm = (d.revenue - minRev) / (maxRev - minRev || 1);
    const yRev = height - paddingY - revNorm * (height - paddingY * 2);

    const ordNorm = d.orders / (maxOrders || 1);
    const barHeight = ordNorm * (height - paddingY * 2);
    const yBar = height - paddingY - barHeight;

    return {
      x,
      yRev,
      yBar,
      barHeight,
      day: d.day,
      revenue: d.revenue,
      orders: d.orders,
      active: d.active,
    };
  });

  // Construct smooth bezier curve path for Revenue line
  const linePath = coords.reduce((acc, curr, i, arr) => {
    if (i === 0) return `M ${curr.x} ${curr.yRev}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.yRev;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.yRev;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.yRev}`;
  }, "");

  // Gradient area path under the line
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`
      : "";

  const revStep = (maxRev - minRev) / 3;
  const revenueLabels = [
    `$${(maxRev / 1000).toFixed(1)}k`,
    `$${((maxRev - revStep) / 1000).toFixed(1)}k`,
    `$${((maxRev - revStep * 2) / 1000).toFixed(1)}k`,
    `$${(minRev / 1000).toFixed(1)}k`,
  ];

  const orderLabels = [
    `${Math.round(maxOrders)}`,
    `${Math.round(maxOrders * 0.66)}`,
    `${Math.round(maxOrders * 0.33)}`,
    "0",
  ];

  return (
    <article className={cardClass}>
      {/* Card Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-title-md text-xl font-semibold text-on-surface">
            Sales Overview
          </h2>
          <div className="mt-1 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Revenue (Line)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-on-surface-variant">
              <span className="h-2 w-2 rounded-sm bg-primary/30" />
              Orders (Bar)
            </span>
          </div>
        </div>

        {setActiveRange && (
          <div className="inline-flex rounded-xl border border-outline-variant/50 bg-surface-container-low p-1">
            {["7 days", "30 days", "3 months", "12 months"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveRange(tab)}
                className={`cursor-pointer rounded-lg px-3 py-1 font-label-mono text-[11px] uppercase tracking-wider transition-all ${
                  activeRange === tab
                    ? "bg-primary text-on-primary font-semibold shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dual Axis Composed Chart */}
      <div className="relative mt-6 w-full overflow-hidden">
        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && coords[hoverIndex] && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl border border-outline-variant/60 bg-surface-container-highest/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md"
            style={{
              left: `${(coords[hoverIndex].x / width) * 100}%`,
              top: "10px",
            }}
          >
            <p className="font-label-mono text-[10px] uppercase font-semibold text-on-surface-variant">
              {coords[hoverIndex].day}
            </p>
            <p className="mt-0.5 font-semibold text-primary">
              Revenue: ${coords[hoverIndex].revenue.toLocaleString()}
            </p>
            <p className="text-on-surface font-medium">
              Orders: {coords[hoverIndex].orders.toLocaleString()}
            </p>
          </div>
        )}

        <div className="flex">
          {/* Left Y-Axis: Revenue labels */}
          <div className="flex flex-col justify-between pb-7 pr-2 font-label-mono text-[10px] text-outline text-right select-none w-12">
            {revenueLabels.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>

          {/* SVG Canvas */}
          <div className="flex-1 relative">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-64 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6d3bd7" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#6d3bd7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Background horizontal grid lines */}
              {[0.2, 0.45, 0.7, 0.95].map((ratio) => (
                <line
                  key={ratio}
                  x1={paddingX}
                  y1={height * ratio}
                  x2={width - paddingX}
                  y2={height * ratio}
                  stroke="currentColor"
                  className="text-outline-variant/30"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Bars: Orders (Right axis) */}
              {coords.map((c, i) => (
                <g key={c.day}>
                  <rect
                    x={c.x - 14}
                    y={c.yBar}
                    width={28}
                    height={Math.max(4, c.barHeight)}
                    rx={6}
                    className={`transition-all duration-200 cursor-pointer ${
                      hoverIndex === i
                        ? "fill-primary shadow-lg"
                        : c.active
                        ? "fill-primary/60 hover:fill-primary/80"
                        : "fill-primary/25 hover:fill-primary/45"
                    }`}
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(null)}
                  />
                </g>
              ))}

              {/* Area fill for Revenue line */}
              <path d={areaPath} fill="url(#revenueFill)" />

              {/* Smooth Bezier Line for Revenue */}
              <path
                d={linePath}
                fill="none"
                stroke="#6d3bd7"
                strokeWidth={3}
                strokeLinecap="round"
              />

              {/* Dots on line series */}
              {coords.map((c, i) => (
                <circle
                  key={c.day}
                  cx={c.x}
                  cy={c.yRev}
                  r={hoverIndex === i ? 6 : 4}
                  className={`transition-all ${
                    hoverIndex === i
                      ? "fill-primary stroke-white stroke-[3px]"
                      : "fill-primary stroke-white stroke-[2px]"
                  }`}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              ))}
            </svg>

            {/* X-Axis day labels */}
            <div className="flex justify-between px-8 pt-2 font-label-mono text-[11px] text-on-surface-variant select-none">
              {coords.map((c, i) => (
                <button
                  key={c.day}
                  type="button"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                  className={`cursor-pointer transition-colors ${
                    hoverIndex === i ? "text-primary font-bold" : ""
                  }`}
                >
                  {c.day}
                </button>
              ))}
            </div>
          </div>

          {/* Right Y-Axis: Orders labels */}
          <div className="flex flex-col justify-between pb-7 pl-2 font-label-mono text-[10px] text-outline select-none w-8">
            {orderLabels.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

ComposedSalesChart.propTypes = {
  activeRange: PropTypes.string,
  setActiveRange: PropTypes.func,
  chartdata: PropTypes.array,
};

// ── Sub-component: Top Selling Products List ────────────────────────────────
function TopSellingProductsList() {
  const products = [
    {
      name: "Wireless Headphones",
      category: "Electronics",
      revenue: "$59,760",
      salesCount: "482 sales",
      icon: "headphones",
    },
    {
      name: "Leather Backpack",
      category: "Accessories",
      revenue: "$45,540",
      salesCount: "396 sales",
      icon: "backpack",
    },
    {
      name: "Running Sneakers",
      category: "Footwear",
      revenue: "$57,564",
      salesCount: "351 sales",
      icon: "footwear",
    },
    {
      name: "Smart Watch S2",
      category: "Electronics",
      revenue: "$91,553",
      salesCount: "287 sales",
      icon: "watch",
    },
    {
      name: "Ceramic Mug Set",
      category: "Home",
      revenue: "$11,712",
      salesCount: "244 sales",
      icon: "coffee",
    },
  ];

  return (
    <article className={`${cardClass} flex flex-col justify-between`}>
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
        <div>
          <h2 className="font-title-md text-lg font-semibold text-on-surface">
            Top Selling Products
          </h2>
          <p className="text-xs text-on-surface-variant">
            Ranked by volume &amp; velocity
          </p>
        </div>
        <Link
          to="/inventory"
          className="font-label-mono text-[10px] uppercase tracking-wider text-primary hover:underline"
        >
          View all products
        </Link>
      </div>

      <div className="mt-4 divide-y divide-outline-variant/30">
        {products.map((item, idx) => (
          <div
            key={item.name}
            className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-label-mono text-xs font-semibold text-outline w-4">
                0{idx + 1}
              </span>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">
                  {item.icon}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                  {item.name}
                </p>
                <p className="text-xs text-on-surface-variant font-label-mono uppercase tracking-wider">
                  {item.category}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-on-surface tabular-nums">
                {item.revenue}
              </p>
              <p className="text-[11px] text-on-surface-variant font-label-mono">
                {item.salesCount}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

// ── Sub-component: Low Stock Products List with Interactive Reorder ──────────
function LowStockProductsList({ onReorderToast }) {
  const [items, setItems] = useState([
    {
      name: "Ceramic Mug Set",
      sku: "SKU: HM-2041",
      currentUnits: 6,
      maxUnits: 60,
      status: "Critical",
    },
    {
      name: "Desk Lamp Pro",
      sku: "SKU: HM-1187",
      currentUnits: 14,
      maxUnits: 80,
      status: "Low",
    },
    {
      name: "Wireless Headphones",
      sku: "SKU: EL-0932",
      currentUnits: 18,
      maxUnits: 120,
      status: "Low",
    },
    {
      name: "Yoga Mat Plus",
      sku: "SKU: FT-3310",
      currentUnits: 4,
      maxUnits: 50,
      status: "Critical",
    },
  ]);

  const [reorderingSku, setReorderingSku] = useState(null);

  const handleReorder = (sku, name) => {
    setReorderingSku(sku);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.sku === sku
            ? {
                ...item,
                currentUnits: Math.min(item.maxUnits, item.currentUnits + 50),
                status: "Restocked",
              }
            : item,
        ),
      );
      setReorderingSku(null);
      if (onReorderToast) {
        onReorderToast(`Restock order dispatched for ${name} (+50 units).`);
      }
    }, 450);
  };

  return (
    <article className={`${cardClass} flex flex-col justify-between`}>
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
        <div>
          <h2 className="font-title-md text-lg font-semibold text-on-surface">
            Low Stock Products
          </h2>
          <p className="text-xs text-on-surface-variant">
            Immediate inventory attention needed
          </p>
        </div>
        <Link
          to="/inventory"
          className="font-label-mono text-[10px] uppercase tracking-wider text-primary hover:underline"
        >
          Manage Inventory
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const isCritical = item.status === "Critical";
          const isRestocked = item.status === "Restocked";
          const ratio = Math.round((item.currentUnits / item.maxUnits) * 100);

          return (
            <div
              key={item.sku}
              className="flex items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-container-lowest/70 p-3.5 transition-all hover:border-primary/40"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-on-surface truncate">
                    {item.name}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 font-label-mono text-[9px] uppercase tracking-wider font-semibold border ${
                      isRestocked
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : isCritical
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-on-surface-variant font-label-mono">
                  <span>{item.sku}</span>
                  <span>·</span>
                  <span className="font-semibold text-on-surface">
                    {item.currentUnits} / {item.maxUnits} units ({ratio}%)
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={reorderingSku === item.sku || isRestocked}
                onClick={() => handleReorder(item.sku, item.name)}
                className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-label-mono text-xs uppercase tracking-wider font-semibold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-60 ${
                  isRestocked
                    ? "bg-emerald-500/15 text-emerald-700"
                    : "bg-primary text-on-primary hover:bg-primary/90 shadow-sm"
                }`}
              >
                {reorderingSku === item.sku ? (
                  <>
                    <span className="material-symbols-outlined text-[14px] animate-spin">
                      progress_activity
                    </span>
                    <span>Placing...</span>
                  </>
                ) : isRestocked ? (
                  <>
                    <span className="material-symbols-outlined text-[14px]">
                      check
                    </span>
                    <span>Queued</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">
                      refresh
                    </span>
                    <span>Reorder</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}

LowStockProductsList.propTypes = {
  onReorderToast: PropTypes.func,
};

// ── Sub-component: Customer Overview Card with Segmented Ratio & Sparkline ──
function CustomerOverviewCard() {
  return (
    <article className={`${cardClass} flex flex-col justify-between`}>
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
        <div>
          <h2 className="font-title-md text-lg font-semibold text-on-surface">
            Customer Overview
          </h2>
          <p className="text-xs text-on-surface-variant">
            Patron cohort balance &amp; acquisition
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-label-mono text-[10px] font-semibold text-emerald-600 border border-emerald-500/20">
          <span className="material-symbols-outlined text-[13px]">
            trending_up
          </span>
          +12.4% growth
        </span>
      </div>

      <div className="mt-5 space-y-6">
        {/* Split Stat Counters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/70 p-4">
            <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
              New customers
            </span>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-on-surface tabular-nums">
              684
            </p>
            <p className="mt-1 text-xs text-primary font-medium">
              38% of active patrons
            </p>
          </div>

          <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/70 p-4">
            <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
              Returning customers
            </span>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-on-surface tabular-nums">
              1,129
            </p>
            <p className="mt-1 text-xs text-on-surface-variant font-medium">
              62% loyal patronage
            </p>
          </div>
        </div>

        {/* Ratio Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-label-mono mb-2">
            <span className="font-medium text-primary">New: 38% (684)</span>
            <span className="text-on-surface-variant">
              Returning: 62% (1,129)
            </span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-container-high border border-outline-variant/30">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: "38%" }}
            />
            <div
              className="h-full bg-primary/30 transition-all duration-500"
              style={{ width: "62%" }}
            />
          </div>
        </div>

        {/* Sparkline mini trend */}
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest/60 p-3.5 flex items-center justify-between">
          <div>
            <p className="font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
              Customer growth
            </p>
            <p className="font-semibold text-sm text-on-surface">
              +12.4% net velocity
            </p>
          </div>
          {/* Sparkline SVG */}
          <svg className="w-32 h-10 overflow-visible" viewBox="0 0 120 40">
            <defs>
              <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6d3bd7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6d3bd7" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M0 32 Q 25 28, 45 18 T 85 14 T 120 4 L 120 40 L 0 40 Z"
              fill="url(#sparkFill)"
            />
            <path
              d="M0 32 Q 25 28, 45 18 T 85 14 T 120 4"
              fill="none"
              stroke="#6d3bd7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle
              cx="120"
              cy="4"
              r="3.5"
              fill="#6d3bd7"
              stroke="#fff"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>
    </article>
  );
}

// ── Main Dashboard Page (Default / Index Route) ──────────────────────────────
function Dashboard() {
  const [activeRange, setActiveRange] = useState("7 days");
  const [notificationToast, setNotificationToast] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, ordersRes] = await Promise.allSettled([
          getStoreAnalytics({ range: activeRange }),
          getOrders({ sortBy: "newest" }),
        ]);

        if (!ignore) {
          if (analyticsRes.status === "fulfilled" && analyticsRes.value?.data) {
            setAnalytics(analyticsRes.value.data);
          }

          if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value?.data)) {
            const mapped = ordersRes.value.data.slice(0, 6).map((o) => ({
              id: o.orderNumber || (o._id ? `#${String(o._id).slice(-5).toUpperCase()}` : "#10001"),
              rawId: o._id || o.id,
              customer: o.customer || (o.customerName || "Customer"),
              product:
                o.product ||
                (o.items?.[0]?.name
                  ? `${o.items[0].name}${o.items.length > 1 ? ` (+${o.items.length - 1} more)` : ""}`
                  : "Store Item"),
              date: o.createdAt
                ? new Date(o.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recent",
              amount:
                typeof o.total === "number"
                  ? `$${o.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : (o.total || "$0.00"),
              status: o.status || "Pending",
            }));
            setRecentOrders(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (!ignore) setOrdersLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      ignore = true;
    };
  }, [activeRange]);

  return (
    <>
      {/* Standard App Page Header */}
      <PageHeader
        title="Dashboard"
        buttonLabel="Create Order"
        buttonIcon="add"
        buttonTo="/orders/new"
        secondaryButtonLabel="Add Product"
        secondaryButtonIcon="add_shopping_cart"
        secondaryButtonTo="/inventory/add-product"
      />

      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-12">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">
          {/* Toast Notification */}
          {notificationToast && (
            <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary-container/80 p-3.5 text-xs text-on-primary-container shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  check_circle
                </span>
                <span className="font-medium">{notificationToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotificationToast(null)}
                className="cursor-pointer p-0.5 text-on-primary-container hover:opacity-75"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {/* ── Row 1: Welcome & Overview Section ── */}
          <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-label-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                Overview &amp; Telemetry
              </p>
              <h1 className="mt-1 font-headline-lg text-2xl tracking-tight text-on-surface md:text-headline-lg">
                Storefront Performance
              </h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                Live metrics, revenue velocity, and patron activity across your
                channels.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Timeframe Selector Pills */}
              <div className="inline-flex items-center rounded-xl border border-outline-variant/60 bg-surface-container/70 p-1 backdrop-blur-xl">
                {["7 days", "30 days", "3 months", "12 months"].map((range) => {
                  const active = activeRange === range;
                  return (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setActiveRange(range)}
                      className={`cursor-pointer rounded-lg px-3 py-1.5 font-label-mono text-[10px] uppercase tracking-widest transition-all ${
                        active
                          ? "bg-primary text-on-primary shadow-[0_4px_12px_rgba(109,59,215,0.22)]"
                          : "text-on-surface-variant hover:bg-primary/5 hover:text-primary"
                      }`}
                    >
                      {range}
                    </button>
                  );
                })}
              </div>

              {/* View/Export Report Button */}
              <button
                type="button"
                onClick={() => window.print()}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 font-label-mono text-xs uppercase tracking-wider font-semibold text-on-primary shadow-[0_4px_14px_rgba(109,59,215,0.25)] hover:bg-primary/90 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">
                  description
                </span>
                <span>View report</span>
              </button>
            </div>
          </section>

          {/* ── Row 2: KPISummaryGrid (4 Columns) ── */}
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {analytics &&
              analytics.kpiCards?.map((key, index) => (
                <KPICard
                  key={index}
                  title={key.label}
                  value={key.value}
                  changePercent={key.change}
                  comparisonText={key.period}
                  icon={key.icon}
                />
              ))}
          </section>

          {/* ── Row 3: SalesOverviewChart (Full Width) ── */}
          <section>
            <ComposedSalesChart
              activeRange={activeRange}
              setActiveRange={setActiveRange}
              chartdata={analytics?.revenueBars}
            />
          </section>

          {/* ── Row 4: Middle 2-Column Split Grid (RecentOrdersTable + TopSellingProductsList) ── */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: RecentOrdersTable (8 cols) */}
            <article
              className={`${cardClass} lg:col-span-8 flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
                <div>
                  <h2 className="font-title-md text-lg font-semibold text-on-surface">
                    Recent Orders
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    6 latest transactions across the storefront
                  </p>
                </div>
                <Link
                  to="/orders"
                  className="font-label-mono text-[10px] uppercase tracking-wider text-primary hover:underline"
                >
                  View all orders
                </Link>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[580px]">
                  <thead className="bg-surface-container-low font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {ordersLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-xs text-on-surface-variant font-label-mono"
                        >
                          <span className="material-symbols-outlined animate-spin text-[18px] text-primary mr-2 align-middle">
                            progress_activity
                          </span>
                          Loading recent orders...
                        </td>
                      </tr>
                    ) : recentOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-xs text-on-surface-variant"
                        >
                          <p className="font-medium text-on-surface">No orders placed yet</p>
                          <p className="mt-1 text-[11px] text-on-surface-variant font-label-mono">
                            Client transactions will show up here as soon as orders are placed.
                          </p>
                          <Link
                            to="/orders/new"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-label-mono text-xs uppercase font-semibold text-on-primary shadow-sm hover:bg-primary/90"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            <span>Create Order</span>
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((o) => (
                        <tr
                          key={o.id}
                          className="hover:bg-primary/5 transition-colors"
                        >
                          <td className="px-4 py-3.5 font-label-mono text-xs font-semibold text-primary">
                            <Link to="/orders" className="hover:underline">
                              {o.id}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-on-surface">
                            {o.customer}
                          </td>
                          <td className="px-4 py-3.5 text-on-surface-variant text-xs">
                            {o.product}
                          </td>
                          <td className="px-4 py-3.5 text-on-surface-variant text-xs font-label-mono">
                            {o.date}
                          </td>
                          <td className="px-4 py-3.5 text-right font-semibold text-on-surface tabular-nums">
                            {o.amount}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <StatusBadge status={o.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            {/* Right: TopSellingProductsList (4 cols) */}
            <div className="lg:col-span-4">
              <TopSellingProductsList />
            </div>
          </section>

          {/* ── Row 5: Lower 2-Column Split Grid (CustomerOverviewCard + LowStockProductsList) ── */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: CustomerOverviewCard (6 cols) */}
            <div className="lg:col-span-6">
              <CustomerOverviewCard />
            </div>

            {/* Right: LowStockProductsList (6 cols) */}
            <div className="lg:col-span-6">
              <LowStockProductsList
                onReorderToast={(msg) => setNotificationToast(msg)}
              />
            </div>
          </section>

          {/* ── Row 6: FooterBar ── */}
          {/* <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-outline-variant/40 pt-6 text-xs text-on-surface-variant sm:flex-row">
            <p>© 2026 NexaOps Storefront. All rights reserved.</p>
            <div className="flex items-center gap-6 font-label-mono text-[11px]">
              <Link
                to="/about"
                className="hover:text-primary transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/about"
                className="hover:text-primary transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/settings"
                className="hover:text-primary transition-colors"
              >
                Help &amp; Support
              </Link>
              <span className="rounded-md bg-surface-container-high px-2 py-0.5 font-semibold text-on-surface">
                v1.0.0
              </span>
            </div>
          </footer> */}
        </div>
      </main>
    </>
  );
}

export default Dashboard;
