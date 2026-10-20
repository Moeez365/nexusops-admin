import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import {
  TIME_RANGES,
  KPI_CARDS,
  REVENUE_BARS,
  CATEGORY_SHARE,
  CONVERSION_FUNNEL,
  REGIONAL_DEMAND,
} from "../constants";
import { getStoreAnalytics } from "../api/settings";

const cardClass =
  "rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-5 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl";

function Analytics() {
  const [selectedRange, setSelectedRange] = useState("7D");
  const [kpiCards, setKpiCards] = useState(KPI_CARDS);
  const [revenueBars, setRevenueBars] = useState(REVENUE_BARS);
  const [categoryShare, setCategoryShare] = useState(CATEGORY_SHARE);
  const [conversionFunnel, setConversionFunnel] = useState(CONVERSION_FUNNEL);
  const [regionalDemand, setRegionalDemand] = useState(REGIONAL_DEMAND);
  const [loading, setLoading] = useState(false);

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
                      onClick={() => setSelectedRange(range)}
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

          {/* Primary Graphs: Revenue Breakdown + Order Velocity */}
          <section className="grid grid-cols-1 gap-gutter xl:grid-cols-12">
            <article className={`${cardClass} xl:col-span-7`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-title-md text-xl font-semibold">
                    Revenue breakdown
                  </h3>
                  <p className="mt-1 text-body-base text-on-surface-variant">
                    {loading ? "Refreshing telemetry..." : "Gross revenue performance"}
                  </p>
                </div>
                <span className="rounded-lg bg-surface-container px-3 py-1.5 font-label-mono text-[10px] uppercase tracking-widest text-primary">
                  Velocity ({selectedRange})
                </span>
              </div>

              <div className="mt-8 flex h-56 items-end justify-between gap-3 border-b border-outline-variant/50 px-2">
                {revenueBars.map((bar) => (
                  <div
                    key={bar.day}
                    className="group flex h-full flex-1 flex-col justify-end gap-2"
                  >
                    <span
                      className={`text-center text-xs transition-opacity ${
                        bar.active
                          ? "font-semibold text-primary opacity-100"
                          : "text-on-surface-variant opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {bar.amount}
                    </span>
                    <div
                      style={{ height: bar.height }}
                      className={`rounded-t-lg transition-all duration-300 group-hover:bg-primary/60 ${
                        bar.active
                          ? "bg-primary shadow-[0_8px_20px_rgba(109,59,215,0.25)]"
                          : bar.shade
                      }`}
                    />
                    <span
                      className={`pb-2 text-center text-xs ${
                        bar.active
                          ? "font-semibold text-primary"
                          : "text-outline"
                      }`}
                    >
                      {bar.day}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className={`${cardClass} xl:col-span-5`}>
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
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Peak 18:00
                </span>
              </div>

              <div className="mt-10 rounded-2xl bg-surface-container-low p-4">
                <svg
                  className="h-48 w-full"
                  viewBox="0 0 360 180"
                  preserveAspectRatio="none"
                  aria-label="Order velocity chart"
                >
                  <defs>
                    <linearGradient id="velocityFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6d3bd7" stopOpacity=".35" />
                      <stop offset="100%" stopColor="#6d3bd7" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 145 C45 120 70 140 110 112 S175 100 210 70 S275 25 360 58 L360 180 L0 180Z"
                    fill="url(#velocityFill)"
                  />
                  <path
                    d="M0 145 C45 120 70 140 110 112 S175 100 210 70 S275 25 360 58"
                    fill="none"
                    stroke="#6d3bd7"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="285"
                    cy="37"
                    r="6"
                    fill="#6d3bd7"
                    stroke="#fffaff"
                    strokeWidth="3"
                  />
                </svg>
                <div className="flex justify-between text-[10px] font-medium text-outline">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span className="font-semibold text-primary">18:00</span>
                  <span>23:59</span>
                </div>
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
