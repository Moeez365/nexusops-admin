/**
 * Dashboard Constants
 *
 * Overview metric cards, quick-action navigation links, and recent transaction feeds.
 */

export const OVERVIEW_CARDS = [
  {
    label: "Pending Orders",
    value: "18",
    note: "Ready for fulfillment",
    icon: "shopping_bag",
    to: "/orders",
  },
  {
    label: "Low Stock",
    value: "6",
    note: "Items need restocking",
    icon: "inventory_2",
    to: "/inventory",
  },
  {
    label: "Collections",
    value: "8",
    note: "Live on storefront",
    icon: "collections_bookmark",
    to: "/collections",
  },
];

export const QUICK_LINKS = [
  {
    label: "Add New Product",
    desc: "Create a product listing",
    icon: "add_box",
    to: "/inventory/add-product",
  },
  {
    label: "New Collection",
    desc: "Curate a product group",
    icon: "library_add",
    to: "/collections/add-collection",
  },
  {
    label: "Media Gallery",
    desc: "Manage uploaded images",
    icon: "photo_library",
    to: "/media-gallery",
  },
  {
    label: "Analytics",
    desc: "View revenue & graphs",
    icon: "insights",
    to: "/analytics",
  },
];

export const RECENT_ORDERS = [
  {
    id: "#VO-8921",
    customer: "Sophia Laurent",
    status: "Processing",
    total: "$2,450.00",
  },
  {
    id: "#VO-8920",
    customer: "Marcus Chen",
    status: "Delivered",
    total: "$370.00",
  },
  {
    id: "#VO-8919",
    customer: "Elena Dubois",
    status: "Shipped",
    total: "$1,120.00",
  },
  {
    id: "#VO-8918",
    customer: "Henri Vance",
    status: "Pending",
    total: "$590.00",
  },
];

