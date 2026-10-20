/**
 * Customer Directory Constants
 *
 * Mock customer records, summary KPIs, and tier filters for the Customers page.
 */

export const CUSTOMER_SUMMARY_CARDS = [
  { label: "Total Customers", value: "3,890", icon: "group" },
  { label: "VIP Patrons", value: "284", icon: "workspace_premium" },
  { label: "New This Month", value: "142", icon: "person_add" },
];

export const CUSTOMER_TIER_TABS = [
  { id: "all", label: "All Customers" },
  { id: "vip", label: "VIP" },
  { id: "active", label: "Active" },
  { id: "new", label: "New" },
];

export const SAMPLE_CUSTOMERS_DATA = [
  {
    id: "CUS-01",
    name: "Sophia Laurent",
    email: "s.laurent@paris.luxury",
    location: "Paris, France",
    orders: 14,
    tier: "VIP",
    spent: "$28,450.00",
  },
  {
    id: "CUS-02",
    name: "Marcus Chen",
    email: "m.chen@atelier.hk",
    location: "Hong Kong",
    orders: 6,
    tier: "Active",
    spent: "$9,120.00",
  },
  {
    id: "CUS-03",
    name: "Elena Dubois",
    email: "e.dubois@maison.fr",
    location: "Lyon, France",
    orders: 9,
    tier: "VIP",
    spent: "$16,780.00",
  },
  {
    id: "CUS-04",
    name: "Henri Vance",
    email: "h.vance@geneva.ch",
    location: "Geneva, Switzerland",
    orders: 1,
    tier: "New",
    spent: "$590.00",
  },
  {
    id: "CUS-05",
    name: "Amina Al-Fayed",
    email: "amina@atelier.ae",
    location: "Dubai, UAE",
    orders: 19,
    tier: "VIP",
    spent: "$41,900.00",
  },
];
