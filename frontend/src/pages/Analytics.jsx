import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { Chart } from "@tanstack/react-charts";
import { defineChart, areaY, lineY, dot, d3Curve } from "@tanstack/charts";
import { scalePoint } from "@tanstack/charts/scales/point";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveMonotoneX } from "d3-shape";
import {
  ANALYTICS_PERIODS,
  ANALYTICS_DATA_BY_PERIOD,
  CATEGORY_SHARE,
  CONVERSION_FUNNEL,
  REGIONAL_DEMAND,
} from "../constants";
import { getAnalyticsData } from "../api/analytics";

const PERIOD_TO_RANGE = {
  today: "1D",
  this_month: "1M",
  this_year: "1Y",
};

/**
 * Formats percentage change between current and previous period values.
 */
function formatPercentDelta(current, previous) {
  if (!previous) return current > 0 ? "+100%" : "0.0%";
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/**
 * Builds KPI cards with real values and computed percentage deltas.
 */
function buildKpiCards(fallbackCards, curr, prev) {
  const currAvg = curr.orders > 0 ? curr.revenue / curr.orders : 0;
  const prevAvg = prev.orders > 0 ? prev.revenue / prev.orders : 0;

  return [
    {
      ...fallbackCards[0],
      value: `$${Math.round(curr.revenue).toLocaleString()}`,
      change: formatPercentDelta(curr.revenue, prev.revenue),
    },
    {
      ...fallbackCards[1],
      value: curr.orders.toLocaleString(),
      change: formatPercentDelta(curr.orders, prev.orders),
    },
    {
      ...fallbackCards[2],
      value: curr.customers.toLocaleString(),
      change: formatPercentDelta(curr.customers, prev.customers),
    },
    {
      ...fallbackCards[3],
      value: `$${currAvg.toFixed(2)}`,
      change: formatPercentDelta(currAvg, prevAvg),
    },
  ];
}

/**
 * Maps live GET /api/analytics overview payload into the selected period's UI state.
 */
function mapOverviewToPeriodData(selectedPeriod, data, fallback) {
  if (!data) return fallback;

  const liveTimestamp = data.generatedAt
    ? new Date(data.generatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : fallback.displayTimestamp;

  if (selectedPeriod === "today" && data.dailyAnalytics) {
    const {
      todayStats = [],
      yesterdayStats = [],
      todayCustomers = 0,
      yesterdayCustomers = 0,
      todaysTrends = [],
    } = data.dailyAnalytics;

    const curr = {
      revenue: todayStats.reduce((sum, s) => sum + (s.revenue || 0), 0),
      orders: todayStats.reduce((sum, s) => sum + (s.orders || 0), 0),
      customers: todayCustomers,
    };
    const prev = {
      revenue: yesterdayStats.reduce((sum, s) => sum + (s.revenue || 0), 0),
      orders: yesterdayStats.reduce((sum, s) => sum + (s.orders || 0), 0),
      customers: yesterdayCustomers,
    };

    const velocitySlots = [
      { label: "00:00", hours: [0, 1, 2, 3] },
      { label: "04:00", hours: [4, 5, 6, 7] },
      { label: "08:00", hours: [8, 9, 10, 11] },
      { label: "12:00", hours: [12, 13, 14, 15] },
      { label: "16:00", hours: [16, 17, 18, 19] },
      { label: "20:00", hours: [20, 21, 22] },
      { label: "23:59", hours: [23] },
    ];
    const orderVelocity = velocitySlots.map((slot) => ({
      label: slot.label,
      orders: slot.hours.reduce((sum, h) => sum + (todaysTrends[h]?.todayOrders || 0), 0),
    }));
    const peakBucket = orderVelocity.reduce(
      (max, item) => (item.orders > max.orders ? item : max),
      orderVelocity[0]
    );

    return {
      ...fallback,
      displayTimestamp: liveTimestamp,
      peakNote: peakBucket ? `Peak ${peakBucket.label} (${peakBucket.orders} orders)` : fallback.peakNote,
      trends: todaysTrends.length ? todaysTrends : fallback.trends,
      orderVelocity,
      kpiCards: buildKpiCards(fallback.kpiCards, curr, prev),
    };
  }

  if (selectedPeriod === "this_month" && data.monthlyAnalytics) {
    const { thisMonthStats = [], lastMonthStats = [], monthlyTrends = [] } = data.monthlyAnalytics;

    const curr = {
      revenue: thisMonthStats.reduce((sum, d) => sum + (d.revenue || 0), 0),
      orders: thisMonthStats.reduce((sum, d) => sum + (d.totalOrders || 0), 0),
      customers: thisMonthStats.reduce((sum, d) => sum + (d.newCustomers || 0), 0),
    };
    const prev = {
      revenue: lastMonthStats.reduce((sum, d) => sum + (d.revenue || 0), 0),
      orders: lastMonthStats.reduce((sum, d) => sum + (d.totalOrders || 0), 0),
      customers: lastMonthStats.reduce((sum, d) => sum + (d.newCustomers || 0), 0),
    };

    const dayBuckets = [
      { label: "Day 04", min: 1, max: 4 },
      { label: "Day 08", min: 5, max: 8 },
      { label: "Day 12", min: 9, max: 12 },
      { label: "Day 16", min: 13, max: 16 },
      { label: "Day 20", min: 17, max: 20 },
      { label: "Day 24", min: 21, max: 24 },
      { label: "Day 28", min: 25, max: 28 },
      { label: "Day 30", min: 29, max: 31 },
    ];
    const orderVelocity = dayBuckets.map((bucket) => ({
      label: bucket.label,
      orders: thisMonthStats
        .filter((d) => {
          const dayNum = new Date(d.date).getUTCDate();
          return dayNum >= bucket.min && dayNum <= bucket.max;
        })
        .reduce((sum, d) => sum + (d.totalOrders || 0), 0),
    }));
    const peakBucket = orderVelocity.reduce(
      (max, item) => (item.orders > max.orders ? item : max),
      orderVelocity[0]
    );

    return {
      ...fallback,
      displayTimestamp: liveTimestamp,
      peakNote: peakBucket ? `Peak ${peakBucket.label} (${peakBucket.orders} orders)` : fallback.peakNote,
      trends: monthlyTrends.length ? monthlyTrends : fallback.trends,
      orderVelocity,
      kpiCards: buildKpiCards(fallback.kpiCards, curr, prev),
    };
  }

  if (selectedPeriod === "this_year" && data.yearlyAnalytics) {
    const {
      thisYearStats = [],
      lastYearStats = [],
      thisYearCustomers = 0,
      lastYearCustomers = 0,
      yearlyTrends = [],
      yearlyVelocity = [],
    } = data.yearlyAnalytics;

    const curr = {
      revenue: thisYearStats.reduce((sum, m) => sum + (m.revenue || 0), 0),
      orders: thisYearStats.reduce((sum, m) => sum + (m.orders || 0), 0),
      customers: thisYearCustomers,
    };
    const prev = {
      revenue: lastYearStats.reduce((sum, m) => sum + (m.revenue || 0), 0),
      orders: lastYearStats.reduce((sum, m) => sum + (m.orders || 0), 0),
      customers: lastYearCustomers,
    };
    const peakBucket = yearlyVelocity.reduce(
      (max, item) => (item.orders > max.orders ? item : max),
      yearlyVelocity[0]
    );

    return {
      ...fallback,
      displayTimestamp: liveTimestamp,
      peakNote: peakBucket ? `Peak ${peakBucket.label} (${peakBucket.orders} orders)` : fallback.peakNote,
      trends: yearlyTrends.length ? yearlyTrends : fallback.trends,
      orderVelocity: yearlyVelocity.length ? yearlyVelocity : fallback.orderVelocity,
      kpiCards: buildKpiCards(fallback.kpiCards, curr, prev),
    };
  }

  return fallback;
}

const cardClass =
  "rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-5 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl";

const chartTheme = {
  foreground: "#948da5",
  grid: "rgba(148, 141, 165, 0.14)",
  muted: "#767086",
};

/**
 * Builds the dual-series comparison TanStack chart (Current vs Previous period).
 */
function buildTrendsChart(trends) {
  const data = (trends || []).map((item) => ({
    label: String(item.label ?? item.hour ?? ""),
    current:
      item.current === null || item.current === undefined
        ? item.today === null || item.today === undefined
          ? null
          : Number(item.today)
        : Number(item.current),
    previous: Number(item.previous ?? item.yesterday ?? 0),
  }));

  const currentData = data.filter((d) => d.current !== null);
  const allValues = [
    ...data.map((d) => d.previous),
    ...currentData.map((d) => d.current),
    10,
  ];
  const maxVal = Math.max(...allValues);
  const smooth = d3Curve(curveMonotoneX);

  return defineChart({
    data,
    theme: chartTheme,
    margin: { top: 18, right: 18, bottom: 28, left: 36 },
    scales: {
      x: {
        scale: scalePoint().domain(data.map((d) => d.label)),
        grid: false,
      },
      y: {
        scale: scaleLinear()
          .domain([0, Math.ceil(maxVal * 1.2)])
          .nice(),
        grid: true,
      },
    },
    marks: [
      lineY(data, {
        x: (d) => d.label,
        y: (d) => d.previous,
        stroke: "#948da5",
        strokeOpacity: 0.45,
        strokeWidth: 2,
        curve: smooth,
      }),
      ...(currentData.length > 0
        ? [
            areaY(currentData, {
              x: (d) => d.label,
              y: (d) => d.current,
              fill: "#6d3bd7",
              fillOpacity: 0.14,
              curve: smooth,
            }),
            lineY(currentData, {
              x: (d) => d.label,
              y: (d) => d.current,
              stroke: "#6d3bd7",
              strokeWidth: 2.5,
              curve: smooth,
            }),
            dot(currentData, {
              x: (d) => d.label,
              y: (d) => d.current,
              r: data.length > 20 ? 3.5 : 4,
              fill: "#ffffff",
              stroke: "#6d3bd7",
              strokeWidth: 2.5,
            }),
          ]
        : []),
    ],
  });
}

/**
 * Builds the Order Velocity area + line chart.
 */
function buildVelocityChart(velocityPoints) {
  const data = (velocityPoints || []).map((p) => ({
    label: p.label,
    orders: Number(p.orders) || 0,
  }));

  const maxVal = Math.max(...data.map((d) => d.orders), 10);
  const peakItem = data.reduce(
    (max, d) => (d.orders > max.orders ? d : max),
    data[0] || { label: "", orders: 0 }
  );
  const smooth = d3Curve(curveMonotoneX);

  return defineChart({
    data,
    theme: chartTheme,
    margin: { top: 16, right: 16, bottom: 28, left: 36 },
    scales: {
      x: {
        scale: scalePoint().domain(data.map((d) => d.label)),
        grid: false,
      },
      y: {
        scale: scaleLinear()
          .domain([0, Math.ceil(maxVal * 1.25)])
          .nice(),
        grid: true,
      },
    },
    marks: [
      areaY(data, {
        x: (d) => d.label,
        y: (d) => d.orders,
        fill: "#6d3bd7",
        fillOpacity: 0.18,
        curve: smooth,
      }),
      lineY(data, {
        x: (d) => d.label,
        y: (d) => d.orders,
        stroke: "#6d3bd7",
        strokeWidth: 3,
        curve: smooth,
      }),
      ...(peakItem?.label
        ? [
            dot([peakItem], {
              x: (d) => d.label,
              y: (d) => d.orders,
              r: 5,
              fill: "#6d3bd7",
              stroke: "#ffffff",
              strokeWidth: 2.5,
            }),
          ]
        : []),
    ],
  });
}

function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [periodData, setPeriodData] = useState(ANALYTICS_DATA_BY_PERIOD.today);
  const [categoryShare, setCategoryShare] = useState(CATEGORY_SHARE);
  const [conversionFunnel, setConversionFunnel] = useState(CONVERSION_FUNNEL);
  const [regionalDemand, setRegionalDemand] = useState(REGIONAL_DEMAND);
  const [loading, setLoading] = useState(false);

  const handlePeriodChange = (periodId) => {
    setSelectedPeriod(periodId);
    setPeriodData(ANALYTICS_DATA_BY_PERIOD[periodId] || ANALYTICS_DATA_BY_PERIOD.today);
  };

  useEffect(() => {
    let ignore = false;

    async function loadAnalytics() {
      try {
        setLoading(true);
        const range = PERIOD_TO_RANGE[selectedPeriod] || "1M";
        const res = await getAnalyticsData({ range });
        if (ignore || !res?.data) return;

        const data = res.data;
        const fallback = ANALYTICS_DATA_BY_PERIOD[selectedPeriod] || ANALYTICS_DATA_BY_PERIOD.today;

        setPeriodData(mapOverviewToPeriodData(selectedPeriod, data, fallback));

        if (data.categoryShare?.length) setCategoryShare(data.categoryShare);
        if (data.conversionFunnel?.length) setConversionFunnel(data.conversionFunnel);
        if (data.regionalDemand?.length) setRegionalDemand(data.regionalDemand);
      } catch (err) {
        console.warn("Using default analytics data:", err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadAnalytics();
    return () => {
      ignore = true;
    };
  }, [selectedPeriod]);

  const trendsChartDef = useMemo(() => buildTrendsChart(periodData.trends), [periodData.trends]);
  const velocityChartDef = useMemo(
    () => buildVelocityChart(periodData.orderVelocity),
    [periodData.orderVelocity]
  );

  return (
    <>
      <PageHeader
        title="Analytics"
        buttonLabel="Export Report"
        buttonIcon="download"
        onButtonClick={() => window.print()}
      />

      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-6">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
          {/* Header & Period Switcher */}
          <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-label-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                NexaOps intelligence
              </p>
              <h3 className="mt-1 font-headline-lg text-2xl tracking-tight md:text-headline-lg">
                Revenue &amp; telemetry analytics
              </h3>
              <p className="mt-1 text-body-base text-on-surface-variant">
                Compare store performance across Today, This Month, and This Year.
              </p>
            </div>

            <div className="inline-flex flex-wrap items-center rounded-xl border border-outline-variant/60 bg-surface-container/70 p-1 backdrop-blur-xl">
              {ANALYTICS_PERIODS.map((period) => {
                const active = selectedPeriod === period.id;
                return (
                  <button
                    key={period.id}
                    type="button"
                    onClick={() => handlePeriodChange(period.id)}
                    className={`cursor-pointer rounded-lg px-3 py-1.5 font-label-mono text-[10px] uppercase tracking-widest transition-all ${
                      active
                        ? "bg-primary text-on-primary shadow-[0_4px_12px_rgba(109,59,215,0.22)]"
                        : "text-on-surface-variant hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    {period.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* KPI Metric Cards */}
          <section
            aria-label="Key analytics metrics"
            className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4"
          >
            {periodData.kpiCards.map((item) => (
              <article key={item.label} className={cardClass}>
                <div className="flex items-center justify-between">
                  <p className="font-label-mono text-label-mono uppercase text-on-surface-variant">
                    {item.label}
                  </p>
                  <span className="material-symbols-outlined rounded-xl bg-primary-container p-2 text-primary">
                    {item.icon}
                  </span>
                </div>
                <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">
                  {item.value}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-2 py-1 font-semibold text-on-primary-container">
                    <span className="material-symbols-outlined text-[14px]">
                      trending_up
                    </span>
                    {item.change}
                  </span>
                  <span className="text-on-surface-variant">{item.period}</span>
                </div>
              </article>
            ))}
          </section>

          {/* Primary Graph: Dual-Series Trends Comparison */}
          <section className={cardClass}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-title-md text-xl font-semibold">
                  {periodData.title}
                </h3>
                <p className="mt-1 text-body-base text-on-surface-variant">
                  {loading ? "Refreshing telemetry..." : periodData.displayTimestamp}
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-container/70 px-3 py-1 font-label-mono text-[10px] uppercase tracking-widest text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {periodData.badgeLabel}
              </span>
            </div>

            <div className="mt-6 w-full">
              <Chart
                definition={trendsChartDef}
                ariaLabel={`${periodData.title} comparison chart`}
                height={280}
                className="w-full"
              />
            </div>

            <div className="mt-3 flex flex-col items-center justify-between gap-3 border-t border-outline-variant/30 pt-3 sm:flex-row">
              <span className="hidden w-32 sm:block" />
              <span className="font-label-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
                {periodData.xAxisLabel}
              </span>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                  <span className="font-label-mono text-xs text-on-surface">
                    {periodData.primaryLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-on-surface-variant/45" />
                  <span className="font-label-mono text-xs text-on-surface-variant">
                    {periodData.comparisonLabel}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Secondary Row: Order Velocity + Revenue by Category */}
          <section className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
            <article className={`${cardClass} flex flex-col justify-between lg:col-span-6`}>
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-title-md text-xl font-semibold">
                      Order velocity
                    </h3>
                    <p className="mt-1 text-body-base text-on-surface-variant">
                      Peak activity telemetry
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-container/70 px-2.5 py-1 font-label-mono text-[9px] uppercase tracking-widest text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    {periodData.peakNote}
                  </span>
                </div>

                <div className="mt-6 w-full">
                  <Chart
                    definition={velocityChartDef}
                    ariaLabel="Order velocity area and line chart"
                    height={230}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30 pt-3 text-[10px] text-outline">
                {periodData.orderVelocity.map((point) => (
                  <div key={point.label} className="text-center">
                    <span className="font-label-mono text-[11px] font-semibold text-primary tabular-nums">
                      {point.orders}
                    </span>
                    <span className="block font-label-mono text-[10px] text-on-surface-variant">
                      {point.label}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            {/* Category Performance */}
            <article className={`${cardClass} lg:col-span-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                    Collection Mix
                  </p>
                  <h3 className="mt-1 font-title-md text-xl font-semibold">
                    Revenue by category
                  </h3>
                </div>
                <span className="material-symbols-outlined rounded-xl bg-primary-container p-2 text-primary">
                  pie_chart
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {categoryShare.map((cat) => (
                  <div key={cat.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-on-surface">
                          {cat.name}
                        </span>
                        <span className="ml-2 font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
                          ({cat.orders} orders)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-on-surface">
                          {cat.revenue}
                        </span>
                        <span className="w-9 text-right font-label-mono text-xs text-primary">
                          {cat.share}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${cat.share}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {/* Tertiary Row: Conversion Funnel + Regional Demand */}
          <section className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
            {/* Conversion Funnel */}
            <article className={`${cardClass} lg:col-span-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                    Patron Journey
                  </p>
                  <h3 className="mt-1 font-title-md text-xl font-semibold">
                    Conversion funnel
                  </h3>
                </div>
                <span className="material-symbols-outlined rounded-xl bg-primary-container p-2 text-primary">
                  filter_alt
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {conversionFunnel.map((step, index) => (
                  <div
                    key={step.stage}
                    className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest/70 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                        0{index + 1} · {step.rate}
                      </span>
                      <span className="rounded-full bg-primary-container px-2 py-0.5 font-label-mono text-[10px] font-semibold text-primary">
                        {step.delta}
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-on-surface tabular-nums">
                      {step.count}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {step.stage}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            {/* Regional Demand */}
            <article className={`${cardClass} lg:col-span-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                    Global Footprint
                  </p>
                  <h3 className="mt-1 font-title-md text-xl font-semibold">
                    Regional patron demand
                  </h3>
                </div>
                <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  4 active luxury hubs
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {regionalDemand.map((hub) => (
                  <div
                    key={hub.region}
                    className="rounded-xl border border-outline-variant/50 bg-surface-container-low/60 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono text-xs font-semibold text-primary">
                        {hub.share} share
                      </span>
                      <span className="text-xs font-medium text-emerald-700">
                        {hub.trend}
                      </span>
                    </div>
                    <p className="mt-3 text-xl font-semibold text-on-surface tabular-nums">
                      {hub.value}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {hub.region}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </main>
    </>
  );
}

export default Analytics;
