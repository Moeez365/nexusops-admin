/**
 * @file orders.js
 * @description Constants, summary cards, and sample dataset for order management.
 */

export const ORDER_SUMMARY_CARDS = [
  { label: "Total Orders", value: "1,420", icon: "shopping_bag" },
  { label: "Pending", value: "18", icon: "schedule" },
  { label: "Completed", value: "1,402", icon: "check_circle" },
];

export const ORDER_STATUS_FILTERS = [
  "All",
  "Processing",
  "Shipped",
  "Delivered",
  "Pending",
  "Cancelled",
];

export const SAMPLE_ORDERS_DATA = [
  {
    id: "#VO-8921",
    customer: "Sophia Laurent",
    email: "s.laurent@paris.luxury",
    product: "Chronos Elite MK II",
    date: "Today, 10:42",
    status: "Processing",
    statusClass: "bg-secondary-container text-on-secondary-container",
    total: "$2,450.00",
  },
  {
    id: "#VO-8920",
    customer: "Marcus Chen",
    email: "m.chen@atelier.hk",
    product: "Aura Diamond Solitaire",
    date: "Today, 09:18",
    status: "Delivered",
    statusClass: "bg-primary-container text-on-primary-container",
    total: "$370.00",
  },
  {
    id: "#VO-8919",
    customer: "Elena Dubois",
    email: "e.dubois@maison.fr",
    product: "Noir Pearl Ensemble",
    date: "Yesterday, 18:06",
    status: "Shipped",
    statusClass: "bg-surface-container-high text-on-surface-variant",
    total: "$1,120.00",
  },
  {
    id: "#VO-8918",
    customer: "Henri Vance",
    email: "h.vance@geneva.ch",
    product: "Celeste Sapphire Cuff",
    date: "Yesterday, 16:34",
    status: "Pending",
    statusClass: "bg-error-container text-on-error-container",
    total: "$590.00",
  },
  {
    id: "#VO-8917",
    customer: "Amina Al-Fayed",
    email: "amina@atelier.ae",
    product: "Atelier Weekender Bag",
    date: "Oct 9, 14:15",
    status: "Delivered",
    statusClass: "bg-primary-container text-on-primary-container",
    total: "$3,650.00",
  },
];
