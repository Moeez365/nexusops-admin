import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { Chart } from "@tanstack/react-charts";
import { defineChart, barY, areaY, lineY, dot, d3Curve } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scalePoint } from "@tanstack/charts/scales/point";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { curveMonotoneX } from "d3-shape";
import {
  TIME_RANGES,
  RANGE_TELEMETRY,
  CATEGORY_SHARE,
  CONVERSION_FUNNEL,
  REGIONAL_DEMAND,
} from "../constants";
import { getStoreAnalytics } from "../api/settings";

const cardClass =
  "rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-5 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl";

function Analytics() {
  const [selectedRange, setSelectedRange] = useState("7D");
  const [kpiCards, setKpiCards] = useState(() => RANGE_TELEMETRY["7D"].kpiCards);
  const [revenueBars, setRevenueBars] = useState(() => RANGE_TELEMETRY["7D"].revenueBars);
  const [velocityPoints, setVelocityPoints] = useState(() => RANGE_TELEMETRY["7D"].velocityPoints);
  const [peakNote, setPeakNote] = useState(() => RANGE_TELEMETRY["7D"].peakNote);
  const [categoryShare, setCategoryShare] = useState(CATEGORY_SHARE);
  const [conversionFunnel, setConversionFunnel] = useState(CONVERSION_FUNNEL);
  const [regionalDemand, setRegionalDemand] = useState(REGIONAL_DEMAND);
  const [loading, setLoading] = useState(false);

  const handleRangeChange = (range) => {
    setSelectedRange(range);
    const fallback = RANGE_TELEMETRY[range] || RANGE_TELEMETRY["7D"];
    setKpiCards(fallback.kpiCards);
    setRevenueBars(fallback.revenueBars);
    setVelocityPoints(fallback.velocityPoints);
    setPeakNote(fallback.peakNote);
  };

  useEffect(() => {
    let ignore = false;
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await getStoreAnalytics({ range: selectedRange });
        if (!ignore && res?.data) {
          const data = res.data;
          if (data.kpiCards && data.kpiCards.length > 0) {
            setKpiCards(data.kpiCards);
          }
          if (data.revenueBars && data.revenueBars.length > 0) {
            setRevenueBars(data.revenueBars);
          }
          if (data.velocityData && data.velocityData.length > 0) {
            setVelocityPoints(data.velocityData);
          }
          if (data.peakNote) {
            setPeakNote(data.peakNote);
          }
          if (data.categoryShare && data.categoryShare.length > 0) {
            setCategoryShare(data.categoryShare);
          }
          if (data.conversionFunnel && data.conversionFunnel.length > 0) {
            setConversionFunnel(data.conversionFunnel);
          }
          if (data.regionalDemand && data.regionalDemand.length > 0) {
            setRegionalDemand(data.regionalDemand);
          }
        }
      } catch (err) {
        console.warn("Using offline analytics defaults:", err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadAnalytics();
    return () => {
      ignore = true;
    };
  }, [selectedRange]);

  // TanStack Revenue Breakdown Bar Chart definition
  const revenueChartDef = useMemo(() => {
    const data = (revenueBars || []).map((b) => {
      const label = b.label || b.day || "";
      const val =
        typeof b.revenue === "number"
          ? b.revenue
          : parseFloat(String(b.amount || "").replace(/[^0-9.]/g, "")) * 1000 || 0;
      return {
        label,
        revenue: val,
        amount: b.amount || `$${(val / 1000).toFixed(1)}k`,
        orders: b.orders || 0,
        active: Boolean(b.active),
      };
    });

    const maxVal = Math.max(...data.map((d) => d.revenue), 1000);

    return defineChart({
      data,
      theme: {
        foreground: "#948da5",
        grid: "rgba(255, 255, 255, 0.06)",
        muted: "#767086",
      },
      margin: { top: 16, right: 14, bottom: 28, left: 44 },
      scales: {
        x: {
          scale: scaleBand().domain(data.map((d) => d.label)),
          grid: false,
        },
        y: {
          scale: scaleLinear()
            .domain([0, Math.ceil(maxVal * 1.15)])
            .nice(),
          grid: true,
        },
      },
      marks: [
        barY(data, {
          x: (d) => d.label,
          y: (d) => d.revenue,
          fill: (d) => (d.active ? "#8250df" : "#6d3bd7"),
          fillOpacity: (d) => (d.active ? 1 : 0.75),
          radius: { end: 6 },
          maxThickness: 38,
        }),
      ],
    });
  }, [revenueBars]);

  // TanStack Order Velocity Area + Line Chart definition
  const velocityChartDef = useMemo(() => {
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
      theme: {
        foreground: "#948da5",
        grid: "rgba(255, 255, 255, 0.06)",
        muted: "#767086",
      },
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
        dot([peakItem], {
          x: (d) => d.label,
          y: (d) => d.orders,
          r: 5,
          fill: "#6d3bd7",
          stroke: "#ffffff",
          strokeWidth: 2.5,
        }),
      ],
    });
  }, [velocityPoints]);

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
          {/* Header & Timeframe Selector */}
          <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-label-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                NexaOps intelligence
              </p>
              <h3 className="mt-1 font-headline-lg text-2xl tracking-tight md:text-headline-lg">
                Revenue &amp; telemetry analytics
              </h3>
              <p className="mt-1 text-body-base text-on-surface-variant">
                Deep-dive performance metrics, revenue velocity, and patron conversion across your NexaOps storefront.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-xl border border-outline-variant/60 bg-surface-container/70 p-1 backdrop-blur-xl">
                {TIME_RANGES.map((range) => {
                  const active = selectedRange === range;
                  return (
                    <button
                      key={range}
                      type="button"
                      onClick={() => handleRangeChange(range)}
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
            </div>
          </section>

          {/* KPI Metric Cards */}
          <section
            aria-label="Key analytics metrics"
            className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4"
          >
            {kpiCards.map((item) => (
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

          {/* Primary Graphs: TanStack Revenue Breakdown + TanStack Order Velocity */}
          <section className="grid grid-cols-1 gap-gutter xl:grid-cols-12">
            <article className={`${cardClass} flex flex-col justify-between xl:col-span-7`}>
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-title-md text-xl font-semibold">
                      Revenue breakdown
                    </h3>
                    <p className="mt-1 text-body-base text-on-surface-variant">
                      {loading
                        ? "Refreshing telemetry..."
                        : `Gross revenue performance (${selectedRange})`}
                    </p>
                  </div>
                  <span className="rounded-lg bg-surface-container px-3 py-1.5 font-label-mono text-[10px] uppercase tracking-widest text-primary">
                    Cadence: {selectedRange}
                  </span>
                </div>

                {/* TanStack Bar Chart */}
                <div className="mt-6 w-full">
                  <Chart
                    definition={revenueChartDef}
                    ariaLabel="Revenue breakdown bar chart"
                    height={230}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Exact revenue amounts for each segment */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30 pt-3">
                {revenueBars.map((bar) => {
                  const label = bar.label || bar.day;
                  return (
                    <div key={label} className="flex flex-col items-center">
                      <span
                        className={`font-label-mono text-[11px] tabular-nums ${
                          bar.active ? "font-semibold text-primary" : "text-on-surface"
                        }`}
                      >
                        {bar.amount}
                      </span>
                      <span
                        className={`font-label-mono text-[10px] ${
                          bar.active ? "font-semibold text-primary" : "text-on-surface-variant"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className={`${cardClass} flex flex-col justify-between xl:col-span-5`}>
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
                    {peakNote}
                  </span>
                </div>

                {/* TanStack Area + Line Chart */}
                <div className="mt-6 w-full">
                  <Chart
                    definition={velocityChartDef}
                    ariaLabel="Order velocity area and line chart"
                    height={230}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Cadence intervals and order volume */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30 pt-3 text-[10px] text-outline">
                {velocityPoints.map((point) => (
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
          </section>

          {/* Secondary Analytics Row: Category Share & Conversion Funnel */}
          <section className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
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
          </section>

          {/* Regional Demand Table */}
          <section className={cardClass}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          </section>
        </div>
      </main>
    </>
  );
}

export default Analytics;
