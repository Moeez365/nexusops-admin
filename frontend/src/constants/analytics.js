/**
 * Analytics Dashboard Constants
 *
 * Mock KPI metrics, revenue charts, category share, conversion funnel, and regional demand data.
 */

export const TIME_RANGES = ["24H", "7D", "30D", "90D", "1Y"];

export const KPI_CARDS = [
  {
    label: "Total revenue",
    value: "$128,450",
    change: "14.2%",
    period: "vs last week",
    icon: "payments",
  },
  {
    label: "Order volume",
    value: "1,420",
    change: "8.5%",
    period: "completed orders",
    icon: "shopping_bag",
  },
  {
    label: "Active customers",
    value: "3,890",
    change: "12.1%",
    period: "registered",
    icon: "group",
  },
  {
    label: "Average order",
    value: "$90.45",
    change: "3.8%",
    period: "per cart",
    icon: "monitoring",
  },
];

export const REVENUE_BARS = [
  { day: "Mon", height: "48%", amount: "$14.2k", active: false, shade: "bg-primary/20" },
  { day: "Tue", height: "62%", amount: "$18.9k", active: false, shade: "bg-primary/25" },
  { day: "Wed", height: "52%", amount: "$15.6k", active: false, shade: "bg-primary/20" },
  { day: "Thu", height: "74%", amount: "$22.1k", active: false, shade: "bg-primary/30" },
  { day: "Fri", height: "88%", amount: "$29.4k", active: true, shade: "bg-primary" },
  { day: "Sat", height: "58%", amount: "$17.3k", active: false, shade: "bg-primary/25" },
  { day: "Sun", height: "44%", amount: "$10.9k", active: false, shade: "bg-primary/20" },
];

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

