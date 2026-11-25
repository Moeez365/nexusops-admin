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
import { getStoreAnalytics } from "../api/settings";

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
        const res = await getStoreAnalytics({ period: selectedPeriod });
        if (ignore || !res?.data) return;

        const data = res.data;
        const fallback = ANALYTICS_DATA_BY_PERIOD[selectedPeriod] || ANALYTICS_DATA_BY_PERIOD.today;

        setPeriodData({
          ...fallback,
          ...(data.title ? { title: data.title } : {}),
          ...(data.displayTimestamp ? { displayTimestamp: data.displayTimestamp } : {}),
          ...(data.peakNote ? { peakNote: data.peakNote } : {}),
          ...(data.kpiCards?.length ? { kpiCards: data.kpiCards } : {}),
          ...(data.trends?.length ? { trends: data.trends } : {}),
          ...(data.todaysTrends?.length ? { trends: data.todaysTrends } : {}),
          ...(data.orderVelocity?.length ? { orderVelocity: data.orderVelocity } : {}),
        });

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
