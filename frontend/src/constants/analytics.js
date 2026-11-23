/**
 * Analytics Dashboard Constants
 *
 * Range-aware KPI metrics, revenue charts, category share, conversion funnel,
 * and velocity telemetry data supporting 24H, 7D, 1M, and 1Y analytics views.
 */

export const TIME_RANGES = ["24H", "7D", "1M", "1Y"];

export const RANGE_TELEMETRY = {
  "24H": {
    period: "vs yesterday",
    peakNote: "Peak 16:00 (88 orders/hr)",
    peakTime: "16:00",
    revenueBars: [
      { day: "00:00", label: "00:00", revenue: 2300, amount: "$2.3k", orders: 8, active: false },
      { day: "04:00", label: "04:00", revenue: 1100, amount: "$1.1k", orders: 3, active: false },
      { day: "08:00", label: "08:00", revenue: 6800, amount: "$6.8k", orders: 24, active: false },
      { day: "12:00", label: "12:00", revenue: 12900, amount: "$12.9k", orders: 62, active: false },
      { day: "16:00", label: "16:00", revenue: 18400, amount: "$18.4k", orders: 88, active: true },
      { day: "20:00", label: "20:00", revenue: 11500, amount: "$11.5k", orders: 54, active: false },
      { day: "23:59", label: "23:59", revenue: 4600, amount: "$4.6k", orders: 19, active: false },
    ],
    velocityPoints: [
      { label: "00:00", orders: 8 },
      { label: "04:00", orders: 3 },
      { label: "08:00", orders: 24 },
      { label: "12:00", orders: 62 },
      { label: "16:00", orders: 88 },
      { label: "20:00", orders: 54 },
      { label: "23:59", orders: 19 },
    ],
    kpiCards: [
      {
        label: "Total revenue",
        value: "$57,600",
        change: "+9.4%",
        period: "vs yesterday",
        icon: "payments",
      },
      {
        label: "Order volume",
        value: "258",
        change: "+12.1%",
        period: "past 24 hours",
        icon: "shopping_bag",
      },
      {
        label: "Active customers",
        value: "640",
        change: "+7.8%",
        period: "active today",
        icon: "group",
      },
      {
        label: "Average order",
        value: "$223.25",
        change: "+2.4%",
        period: "per cart",
        icon: "monitoring",
      },
    ],
  },
  "7D": {
    period: "vs last week",
    peakNote: "Peak Friday (340 orders)",
    peakTime: "Friday",
    revenueBars: [
      { day: "Mon", label: "Mon", revenue: 14200, amount: "$14.2k", orders: 160, active: false, shade: "bg-primary/20" },
      { day: "Tue", label: "Tue", revenue: 18900, amount: "$18.9k", orders: 210, active: false, shade: "bg-primary/25" },
      { day: "Wed", label: "Wed", revenue: 15600, amount: "$15.6k", orders: 175, active: false, shade: "bg-primary/20" },
      { day: "Thu", label: "Thu", revenue: 22100, amount: "$22.1k", orders: 245, active: false, shade: "bg-primary/30" },
      { day: "Fri", label: "Fri", revenue: 29400, amount: "$29.4k", orders: 340, active: true, shade: "bg-primary" },
      { day: "Sat", label: "Sat", revenue: 17300, amount: "$17.3k", orders: 190, active: false, shade: "bg-primary/25" },
      { day: "Sun", label: "Sun", revenue: 10900, amount: "$10.9k", orders: 100, active: false, shade: "bg-primary/20" },
    ],
    velocityPoints: [
      { label: "Mon", orders: 160 },
      { label: "Tue", orders: 210 },
      { label: "Wed", orders: 175 },
      { label: "Thu", orders: 245 },
      { label: "Fri", orders: 340 },
      { label: "Sat", orders: 190 },
      { label: "Sun", orders: 100 },
    ],
    kpiCards: [
      {
        label: "Total revenue",
        value: "$128,450",
        change: "+14.2%",
        period: "vs last week",
        icon: "payments",
      },
      {
        label: "Order volume",
        value: "1,420",
        change: "+8.5%",
        period: "completed orders",
        icon: "shopping_bag",
      },
      {
        label: "Active customers",
        value: "3,890",
        change: "+12.1%",
        period: "registered",
        icon: "group",
      },
      {
        label: "Average order",
        value: "$90.45",
        change: "+3.8%",
        period: "per cart",
        icon: "monitoring",
      },
    ],
  },
  "1M": {
    period: "vs last month",
    peakNote: "Peak Day 24 (960 orders)",
    peakTime: "Day 24",
    revenueBars: [
      { day: "Day 04", label: "Day 04", revenue: 58400, amount: "$58.4k", orders: 640, active: false },
      { day: "Day 08", label: "Day 08", revenue: 62100, amount: "$62.1k", orders: 680, active: false },
      { day: "Day 12", label: "Day 12", revenue: 59800, amount: "$59.8k", orders: 660, active: false },
      { day: "Day 16", label: "Day 16", revenue: 71200, amount: "$71.2k", orders: 790, active: false },
      { day: "Day 20", label: "Day 20", revenue: 68500, amount: "$68.5k", orders: 760, active: false },
      { day: "Day 24", label: "Day 24", revenue: 86400, amount: "$86.4k", orders: 960, active: true },
      { day: "Day 28", label: "Day 28", revenue: 64200, amount: "$64.2k", orders: 710, active: false },
      { day: "Day 30", label: "Day 30", revenue: 42200, amount: "$42.2k", orders: 480, active: false },
    ],
    velocityPoints: [
      { label: "Day 04", orders: 640 },
      { label: "Day 08", orders: 680 },
      { label: "Day 12", orders: 660 },
      { label: "Day 16", orders: 790 },
      { label: "Day 20", orders: 760 },
      { label: "Day 24", orders: 960 },
      { label: "Day 28", orders: 710 },
      { label: "Day 30", orders: 480 },
    ],
    kpiCards: [
      {
        label: "Total revenue",
        value: "$512,800",
        change: "+18.6%",
        period: "vs last month",
        icon: "payments",
      },
      {
        label: "Order volume",
        value: "5,680",
        change: "+11.3%",
        period: "monthly orders",
        icon: "shopping_bag",
      },
      {
        label: "Active customers",
        value: "14,250",
        change: "+15.7%",
        period: "patrons active",
        icon: "group",
      },
      {
        label: "Average order",
        value: "$90.28",
        change: "+4.1%",
        period: "per cart",
        icon: "monitoring",
      },
    ],
  },
  "1Y": {
    period: "vs last year",
    peakNote: "Peak Dec (1,820 orders)",
    peakTime: "Dec",
    revenueBars: [
      { day: "Jan", label: "Jan", revenue: 64000, amount: "$64k", orders: 720, active: false },
      { day: "Feb", label: "Feb", revenue: 58000, amount: "$58k", orders: 680, active: false },
      { day: "Mar", label: "Mar", revenue: 72000, amount: "$72k", orders: 810, active: false },
      { day: "Apr", label: "Apr", revenue: 70000, amount: "$70k", orders: 790, active: false },
      { day: "May", label: "May", revenue: 84000, amount: "$84k", orders: 920, active: false },
      { day: "Jun", label: "Jun", revenue: 81000, amount: "$81k", orders: 890, active: false },
      { day: "Jul", label: "Jul", revenue: 92000, amount: "$92k", orders: 960, active: false },
      { day: "Aug", label: "Aug", revenue: 88000, amount: "$88k", orders: 940, active: false },
      { day: "Sep", label: "Sep", revenue: 99000, amount: "$99k", orders: 1050, active: false },
      { day: "Oct", label: "Oct", revenue: 112000, amount: "$112k", orders: 1180, active: false },
      { day: "Nov", label: "Nov", revenue: 142000, amount: "$142k", orders: 1580, active: false },
      { day: "Dec", label: "Dec", revenue: 168000, amount: "$168k", orders: 1820, active: true },
    ],
    velocityPoints: [
      { label: "Jan", orders: 720 },
      { label: "Feb", orders: 680 },
      { label: "Mar", orders: 810 },
      { label: "Apr", orders: 790 },
      { label: "May", orders: 920 },
      { label: "Jun", orders: 890 },
      { label: "Jul", orders: 960 },
      { label: "Aug", orders: 940 },
      { label: "Sep", orders: 1050 },
      { label: "Oct", orders: 1180 },
      { label: "Nov", orders: 1580 },
      { label: "Dec", orders: 1820 },
    ],
    kpiCards: [
      {
        label: "Total revenue",
        value: "$1,130,000",
        change: "+28.4%",
        period: "vs last year",
        icon: "payments",
      },
      {
        label: "Order volume",
        value: "12,440",
        change: "+22.7%",
        period: "annual completed",
        icon: "shopping_bag",
      },
      {
        label: "Active customers",
        value: "42,600",
        change: "+31.2%",
        period: "total patron base",
        icon: "group",
      },
      {
        label: "Average order",
        value: "$90.83",
        change: "+5.6%",
        period: "per cart",
        icon: "monitoring",
      },
    ],
  },
};

// Aliases for compatibility
RANGE_TELEMETRY["30D"] = RANGE_TELEMETRY["1M"];
RANGE_TELEMETRY["90D"] = RANGE_TELEMETRY["1M"];

export const KPI_CARDS = RANGE_TELEMETRY["7D"].kpiCards;
export const REVENUE_BARS = RANGE_TELEMETRY["7D"].revenueBars;

export const CATEGORY_SHARE = [
  { name: "Haute Horlogerie", revenue: "$58,400", share: 45, orders: 412 },
  { name: "Fine Jewelry & Solitaires", revenue: "$39,120", share: 30, orders: 518 },
  { name: "Atelier Leather Goods", revenue: "$20,540", share: 16, orders: 310 },
  { name: "Bespoke Accessories", revenue: "$10,390", share: 9, orders: 180 },
];

export const CONVERSION_FUNNEL = [
  { stage: "Storefront Visits", count: "48,920", rate: "100%", delta: "+18.4%" },
  { stage: "Product Views", count: "19,410", rate: "39.7%", delta: "+11.2%" },
  { stage: "Added to Bag", count: "4,280", rate: "8.7%", delta: "+6.4%" },
  { stage: "Completed Checkout", count: "1,420", rate: "2.9%", delta: "+8.5%" },
];

export const REGIONAL_DEMAND = [
  { region: "Paris & Western Europe", share: "38%", value: "$48,811", trend: "+16.2%" },
  { region: "New York & North America", share: "31%", value: "$39,820", trend: "+12.8%" },
  { region: "Dubai & GCC Private Clients", share: "19%", value: "$24,405", trend: "+21.5%" },
  { region: "Tokyo & Asia-Pacific", share: "12%", value: "$15,414", trend: "+9.4%" },
];
