# NexusOps Admin (`nexusops-admin`) — Complete Project Documentation & Resume Dossier

> **Project**: NexusOps Admin — Full-Stack Luxury E-Commerce Operations & Storefront Administration Platform  
> **Architecture**: MERN Stack (MongoDB, Express.js v4, React 19, Node.js ES Modules, Tailwind CSS v4, Vite 8)  
> **Purpose**: Comprehensive single-source technical documentation, resume showcase summary, feature audit, and pending engineering roadmap.

---

## 1. Executive Summary & Resume Highlights

**NexusOps Admin** is an enterprise-grade full-stack e-commerce administration console built to oversee inventory, collections, orders, digital media assets, customers, revenue analytics, and multi-currency store configurations. Designed around a custom luxury glassmorphic UI system and a decoupled service-oriented backend, it ensures clean maintainability, high rendering speed, and production security hygiene.

### Ready-to-Use Resume Bullet Points

* **Full-Stack MERN Architecture**: Engineered **NexusOps Admin**, a full-stack e-commerce administration platform using **React 19**, **Node.js (ES Modules)**, **Express.js**, and **MongoDB/Mongoose**, structured with a clean separation of thin controllers, business-logic services, custom React hooks, and centralized error middleware.
* **Custom Data Visualization & Optimistic UI**: Built a responsive **SVG Dual-Axis Revenue & Volume Composed Chart**, interactive slide-over order inspection drawers, and optimistic order status transitions with automatic state rollback upon network failures.
* **Resilient Cloudinary Media Pipeline**: Implemented multi-file image uploads (up to 10 files / 5MB each) using **Multer** and **Cloudinary CDN**, featuring `@dnd-kit/react` drag-and-drop image reordering, automated temporary disk cleanup via `try...finally`, and bidirectional asset deletion across CDN and MongoDB.
* **Enterprise Store Configuration & Security**: Designed a 6-module configuration engine (Store Profile, Multi-Currency & Tax, Masked Payment Gateway Credentials, Transit Nodes, Security Rules, and Analytics Targets) protected by **ReDoS regex sanitization**, Mongoose validation handling, and **Oxlint** static analysis (`0 warnings, 0 errors`).

---

## 2. Technology Stack & Tooling

| Layer | Technologies & Libraries | Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | React `19.2.7`, React Router DOM `7.18.1`, Vite `8.1.1` | SPA routing, Hooks state architecture, `/api` dev proxy |
| **Styling & Design** | Tailwind CSS `v4.3.3` (`@tailwindcss/vite`), Material Symbols Outlined | Design token architecture, `Inter` & `Geist Mono` / `JetBrains Mono` typography, tabular numeric alignment |
| **UI Interactions** | `@dnd-kit/react` (`0.5.1`), PropTypes `15.8.1` | Drag-and-drop media reordering, runtime prop type safety |
| **HTTP Client** | Axios `1.18.1` | Centralized `/api` request layer with 10s standard / 120s upload timeouts |
| **Backend Core** | Node.js (native ESM), Express `4.21.0`, `bcryptjs` `3.0.3`, Morgan `1.10.0`, CORS `2.8.4` | RESTful API server, password hashing, request logging, centralized error handling |
| **Database** | MongoDB with Mongoose `7.7.0` | Schema modeling, text indexes, aggregation pipelines |
| **Media Storage** | Multer `1.4.4`, Cloudinary `2.10.0` | Disk storage buffering, file type/size filtering, CDN upload/destroy |
| **Testing & Linting** | Native `node:test`, Oxlint `1.71.0` | Automated backend/frontend unit tests, zero-warning linting |

---

## 3. Complete Architecture & Directory Structure

The codebase strictly follows the **Clean MERN** engineering standard:
* **Backend**: Thin Express route controllers $\rightarrow$ Dedicated Business Services (`backend/src/services/`) $\rightarrow$ Mongoose Models (`backend/src/models/`) + Global Error Middleware.
* **Frontend**: Declarative Page Views (`frontend/src/pages/`) $\rightarrow$ Custom React Hooks (`frontend/src/hooks/`) $\rightarrow$ Domain API Modules (`frontend/src/api/`).

```
nexusops-admin/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── cloudinary.js         # Cloudinary SDK credentials configuration
│   │   │   ├── env.js                # Environment variable loader
│   │   │   └── mongoose.js           # MongoDB connection setup
│   │   ├── middleware/
│   │   │   ├── errorHandler.js       # Global 404, CastError, ValidationError & 11000 duplicate key handler
│   │   │   └── upload.js             # Multer file filter (image/*) & 5MB size limit
│   │   ├── models/                   # 6 Mongoose Data Schemas
│   │   │   ├── productModel.js       # Catalog items, prices, stock, SEO slug, tags, images ref
│   │   │   ├── collectionModel.js    # Product collections, hierarchy, cover image ref
│   │   │   ├── orderModel.js         # Order items, billing/shipping address, status & payment tracking
│   │   │   ├── userModel.js          # Customer patron accounts, tiers (VIP/Active/New), spend, addresses
│   │   │   ├── imageModel.js         # Cloudinary publicId, URL, altText
│   │   │   └── storeSettingsModel.js # Singleton store profile, commerce, gateways, fulfillment & targets
│   │   ├── services/                 # Dedicated Business Logic & Aggregation Layer
│   │   │   ├── productService.js     # Catalog filtering, sorting, tab counts, bidirectional Collection sync
│   │   │   ├── collectionService.js  # Collection queries, product population, hierarchy
│   │   │   ├── orderService.js       # Order search (ObjectId or #orderNumber), status transitions, revenue KPIs
│   │   │   ├── userService.js        # User CRUD, tier counts, monthly acquisition & spend metrics
│   │   │   ├── imageService.js       # Cloudinary pipeline & guaranteed local temp file cleanup
│   │   │   └── settingsService.js    # Settings persistence, gateway secret masking, store analytics
│   │   ├── controllers/              # Thin Async Controllers (wrapped in asyncHandler)
│   │   │   ├── productController.js
│   │   │   ├── collectionController.js
│   │   │   ├── orderController.js
│   │   │   ├── userController.js
│   │   │   ├── imageController.js
│   │   │   └── settingsController.js
│   │   ├── routes/                   # Modular Express Routers mounted under /api
│   │   │   ├── index.js              # Router aggregator
│   │   │   ├── products.js
│   │   │   ├── collections.js
│   │   │   ├── orders.js
│   │   │   ├── users.js
│   │   │   ├── upload.js
│   │   │   └── settings.js
│   │   ├── utils/
│   │   │   ├── asyncHandler.js       # High-order promise rejection forwarder to Express error middleware
│   │   │   ├── cloudinaryUpload.js   # Cloudinary upload & delete helpers
│   │   │   ├── logger.js             # Structured console logger
│   │   │   └── sanitize.js           # escapeRegex() utility protecting against ReDoS attacks
│   │   ├── app.js                    # Express app pipeline (CORS, JSON, Morgan, /health, /api, errorHandler)
│   │   └── server.js                 # Database bootstrap & HTTP listener
│   └── tests/                        # Unit Tests (node --test) — 16 Passing Tests
│       ├── models/userModel.test.js
│       ├── services/orderService.test.js
│       ├── services/userService.test.js
│       └── utils/sanitize.test.js
├── frontend/
│   ├── src/
│   │   ├── api/                      # Axios HTTP Modules
│   │   │   ├── axios.js              # Base instance (/api, 10s timeout)
│   │   │   ├── products.js
│   │   │   ├── collections.js
│   │   │   ├── orders.js
│   │   │   ├── image.js
│   │   │   └── settings.js
│   │   ├── hooks/                    # Custom React Hooks (Decoupled State & Side Effects)
│   │   │   ├── useDashboard.js       # Fetches store analytics & recent orders
│   │   │   ├── useOrders.js          # Order fetching, search/status/sort & optimistic status updates
│   │   │   ├── useProducts.js        # Catalog fetching, filtering & tab counts
│   │   │   ├── useImageLoader.js     # O(1) Set-based tracker for grid cover image loads
│   │   │   └── index.js
│   │   ├── components/               # Reusable Design System & Domain Components
│   │   │   ├── common/               # StatusBadge, ConfirmModal, ShimmerImage
│   │   │   ├── product/              # ProductImagesManager (drag-and-drop & hero cover selector)
│   │   │   ├── PageHeader.jsx        # Sticky header with dual action buttons & nav trigger
│   │   │   ├── ListFilterToolbar.jsx # Standardized search, tab count pills & select dropdowns
│   │   │   ├── GalleryDialog.jsx     # Modal asset picker connected to Cloudinary library
│   │   │   ├── UploadDialog.jsx      # Drag & drop direct upload dialog
│   │   │   ├── ImagePreview.jsx      # Lightbox preview modal
│   │   │   ├── NexaOpsLogo.jsx       # Responsive brand mark & admin badge
│   │   │   └── VaultOSLogo.jsx       # Backwards-compatibility re-export of NexaOpsLogo
│   │   ├── pages/                    # Application Routes
│   │   │   ├── Dashboard.jsx         # Index (/): KPI cards, SVG chart, recent orders, quick alerts
│   │   │   ├── Inventory.jsx         # /inventory: Product catalog grid, stock status & filtering
│   │   │   ├── AddProduct.jsx        # /inventory/add-product: Create/edit product, pricing, tags, images
│   │   │   ├── Collection.jsx        # /collections: Visual lookbook grid & tab counts
│   │   │   ├── AddCollection.jsx     # /collections/add-collection: Create/edit collection & assign products
│   │   │   ├── Orders.jsx            # /orders: Order queue, KPI summary cards & slide-over drawer
│   │   │   ├── CreateOrder.jsx       # /orders/create-order: Bespoke order creation with line items & fees
│   │   │   ├── MediaGallery.jsx      # /media-gallery: Digital asset manager & Cloudinary deletion
│   │   │   ├── Customers.jsx         # /customers: Customer tier directory (Currently using sample constants)
│   │   │   ├── Analytics.jsx         # /analytics: Telemetry dashboard, funnel & regional breakdown
│   │   │   ├── Settings.jsx          # /settings: 6-tab store settings, gateways & logistics editor
│   │   │   ├── About.jsx             # /about: Platform overview
│   │   │   ├── Home.jsx              # Legacy starter page (unmounted in App.jsx)
│   │   │   └── UploadImages.jsx      # Legacy standalone uploader page (unmounted in App.jsx)
│   │   ├── constants/                # Navigation routes, filter tabs & fallback baselines (analytics, customers, dashboard, navigation, orders, settings)
│   │   ├── utils/                    # formatCurrency, formatNumber, formatDate, slugify + index.js
│   │   │   └── __tests__/formatters.test.js # Unit Tests — 5 Passing Tests
│   │   ├── App.jsx                   # BrowserRouter, responsive collapsible sidebar, mobile drawer
│   │   └── index.css                 # Tailwind v4 setup, root font vars (--font-sans, --font-mono), tnum rules
│   ├── tailwind.config.js            # Brand palette, border radius & font family tokens
│   └── vite.config.js                # Vite config & proxy (/api -> http://localhost:5000)
├── .agents/skills/                   # Custom AI Engineering Protocols (code-review, clean-mern, unit-testing, git-workflow, architecture-scaffold)
└── README.md
```

---

## 4. Database Schemas (MongoDB / Mongoose)

### 1. Product (`backend/src/models/productModel.js`)
* **Core Fields**: `name`, `slug` (unique, lowercase), `description`, `price` (min 0), `comparePrice` (min 0), `category`, `brand`, `stock` (min 0).
* **Media & Merchandising**: `images` (Array of `ObjectId` refs to `Image`), `isFeatured` (Boolean), `isActive` (Boolean), `tags` (`[String]`).
* **Audit**: `createdBy`, `createdAt`, `updatedAt`.

### 2. Collection (`backend/src/models/collectionModel.js`)
* **Core Fields**: `name` (unique), `slug` (unique, lowercase), `description`, `parentCollection` (hierarchy label, default `'None (Top Level)'`).
* **Relationships**: `image` (`ObjectId` ref `Image`), `thumbnail` (`ObjectId` ref `Image`), `products` (`[ObjectId]` refs `Product`).
* **Visibility & SEO**: `isActive` (Boolean), `sortOrder` (Number), `seoDescription`, `createdBy`.

### 3. Order (`backend/src/models/orderModel.js`)
* **Identifiers**: `orderNumber` (unique uppercase, e.g., `#VO-8921`, auto-generated on validate if omitted) + `id` virtual alias.
* **Customer Info**: `customer`, `email`, `phone`, `product` (primary product summary label).
* **Line Items (`orderItemSchema`)**: `product` (ref `Product`), `name`, `price`, `quantity` (min 1), `image` + `totalItems` virtual sum.
* **Financials**: `subtotal`, `tax`, `shippingFee`, `discount`, `total`, `currency`.
* **Workflow & Logistics**: `status` (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`), `paymentMethod`, `paymentStatus`, `shippingAddress` (`street`, `city`, `state`, `postalCode`, `country`), `trackingNumber`, `notes`.

### 4. User / Patron (`backend/src/models/userModel.js`)
* **Scope**: Storefront shopping clients and patrons (administrative roles intentionally excluded).
* **Identity**: `name`, `email` (unique, RFC regex validated), `password` (`select: false`, auto-hashed with `bcryptjs` salt factor 12 on `save`), `avatar`, `phone`.
* **Customer Telemetry & Status**: `tier` (`VIP`, `Active`, `New`), `location`, `ordersCount`, `totalSpent`, `addresses` (Array of `addressSchema`), `isActive`, `isEmailVerified`, `lastLogin`.
* **Virtuals & Indexes**: `initials` virtual (`"Sophia Laurent"` $\rightarrow$ `"SL"`), compound text index on `{ name, email, location }`.

### 5. Image (`backend/src/models/imageModel.js`)
* **Fields**: `publicId` (Cloudinary ID), `url` (CDN HTTPS URL), `altText`, `isPrimary`, `_tempId`, `createdAt`.

### 6. StoreSettings (`backend/src/models/storeSettingsModel.js`)
* **Singleton Pattern**: Single document fetched/auto-initialized via `StoreSettings.getSettings()` (`singletonId: "STORE_CONFIG_PRIMARY"`).
* **Sections**:
  * `storeProfile`: Store name, support email, timezone, status (`Live` / `Maintenance`).
  * `commerce`: `defaultCurrency`, `currencySymbol`, `supportedCurrencies`, tax rate, low-stock threshold.
  * `payments`: `defaultMethod`, `escrowStatus`, `gateways` (`stripe`, `paypal`, `bankTransfer`, `cashOnDelivery`, `cryptoEscrow`).
  * `fulfillment`: `shippingZones`, `transitNodes` (logistics hubs & active dispatches).
  * `securityAndAlerts`: `staffUsersCount`, 2FA flags, alert preferences.
  * `analyticsDefaults`: `defaultTimeRange`, `targets`, `conversionFunnelBaseline`, `regionalDemandTargets`.

---

## 5. Complete REST API Documentation

Base URL: `/api` (Proxied from Vite frontend `http://localhost:5173/api` $\rightarrow$ `http://localhost:5000/api`)

### Health Check
* `GET /health` — Verifies server availability (`{ status: "ok", message: "Backend is running" }`).
* `GET /api` — Returns API readiness status.

### Products (`/api/products`)
* `GET /api/products` — List products with query filters (`search`, `status` [`active`, `low_stock`, `out_of_stock`, `draft`], `category`, `collection`, `sortBy`). Returns `count`, `total`, `data`, `tabCounts`, and `categories`.
* `GET /api/products/:id` — Fetch single product with populated `images`.
* `POST /api/products` — Create a new product (or upsert if `id`/`_id` provided) and automatically sync references inside assigned `Collection.products`.
* `PUT /api/products/:id` — Update product details and synchronize collections.
* `DELETE /api/products/:id` — Delete product and pull its ID from all associated `Collection` documents.

### Collections (`/api/collections`)
* `GET /api/collections` — List collections with filters (`search`, `status` [`active`, `draft`, `has_products`, `empty`], `sortBy` [`newest`, `oldest`, `name_asc`, `name_desc`]) and `tabCounts`.
* `GET /api/collections/:id` — Fetch single collection with populated cover image and nested products/images.
* `POST /api/collections` — Create or upsert a collection.
* `PUT /api/collections/:id` — Update collection details.
* `DELETE /api/collections/:id` — Remove collection.

### Orders (`/api/orders`)
* `GET /api/orders/stats` — Aggregates total orders, pending count, completed count, and total non-cancelled revenue.
* `GET /api/orders` — List orders with `status`, `search` (matches `orderNumber`, `customer`, `email`, `product`), and `sortBy`.
* `GET /api/orders/:id` — Fetch order by either MongoDB `_id` or human-readable `orderNumber` (e.g., `VO-8921`).
* `POST /api/orders` — Create a new order (or update existing if ID provided).
* `PUT /api/orders/:id` — Update order fields.
* `PATCH /api/orders/:id/status` — Quick status update (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).
* `DELETE /api/orders/:id` — Delete an order.

### Users / Customers (`/api/users`)
* `GET /api/users/stats` — Computes Total Customers, VIP Patrons, New This Month, and total lifetime spend.
* `GET /api/users` — List users with filtering (`tier`, `search`, `sortBy`, `page`, `limit`) and `tierCounts`.
* `GET /api/users/:id` — Fetch single user profile.
* `POST /api/users` — Register user with duplicate email prevention (`409 Conflict`).
* `PUT /api/users/:id` — Update user profile (prevents email collision across accounts).
* `DELETE /api/users/:id` — Delete user account.

### Media Uploads (`/api/upload`)
* `GET /api/upload?limit=N` — Fetch uploaded image metadata sorted newest first (requires positive integer `limit`).
* `POST /api/upload` — Upload up to 10 images (`multipart/form-data`, field `images`, max 5MB each) to Cloudinary and store records in MongoDB, automatically unlinking local temporary files.
* `DELETE /api/upload/:id` — Deletes image from Cloudinary CDN and MongoDB.

### Store Settings & Analytics (`/api/settings`)
* `GET /api/settings` — Returns `{ settings, summaryCards, transitNodes }` with gateway secrets masked (`••••••••••••••••`).
* `PUT / PATCH /api/settings` — Deep-update store sections while preserving masked secrets unless replaced.
* `GET /api/settings/analytics` — Merges live MongoDB Order counts/revenue and Product category distribution with configured targets.
* `PUT /api/settings/analytics` — Update baseline targets, conversion funnel, and regional demand benchmarks.
* `GET /api/settings/payment` — Returns safe public checkout gateway configuration (excludes secret keys/webhooks).
* `PUT /api/settings/payment` — Updates payment methods and gateway credentials.
* `POST /api/settings/reset` — Restores store settings singleton to factory defaults.

---

## 6. Feature Audit: Completed vs. Pending

### ✅ Completed & Production-Functional Features

1. **Full Clean-MERN Architecture Refactor**:
   * Thin controllers using `asyncHandler`, isolated `services/` layer, custom React hooks (`useDashboard`, `useOrders`, `useProducts`, `useImageLoader`), `bcryptjs` password hashing on `User` creation (`userModel.js` `pre('save')` hook + `select: false`), ReDoS-safe `escapeRegex()`, and centralized Express error handling (`errorHandler.js`).
2. **Product Inventory & Form Management (`Inventory.jsx`, `AddProduct.jsx`)**:
   * Full CRUD connected to `/api/products`, debounced search, status tabs (`active`, `low_stock`, `out_of_stock`, `draft`), category & collection filters, drag-and-drop image reordering via `ProductImagesManager`, auto SEO slugification, and real-time pricing discount preview.
3. **Collection Architecture (`Collection.jsx`, `AddCollection.jsx`)**:
   * Full CRUD connected to `/api/collections`, lookbook cards using `useImageLoader` $O(1)$ Set tracking, product assignment selector, parent hierarchy, and live delete confirmation modal.
4. **Cloudinary Media Library (`MediaGallery.jsx`, `GalleryDialog.jsx`, `UploadDialog.jsx`)**:
   * Bulk drag-and-drop upload, lightbox preview (`ImagePreview.jsx`), asset picker modal inside product/collection forms, and permanent CDN + DB deletion.
5. **Order Queue & Bespoke Order Creation (`Orders.jsx`, `CreateOrder.jsx`)**:
   * Live order listing from `/api/orders`, KPI summary cards, interactive slide-over detail drawer, clipboard copy for Order IDs, and optimistic status transitions with instant rollback on API errors.
6. **6-Tab Store Settings Console (`Settings.jsx`)**:
   * Wired to `/api/settings` to persist Store Profile, Multi-Currency/Tax rules, Payment Gateways (Stripe, PayPal, Bank Transfer, COD, Crypto Escrow) with secret masking, Shipping Zones & Transit Nodes, Security toggles, and Analytics targets, plus Factory Reset (`POST /api/settings/reset`).
7. **Typography & Design System**:
   * Unified `Inter` + `Geist Mono` / `JetBrains Mono` stack, tabular number alignment (`font-feature-settings: "tnum" 1, "zero" 1`), glassmorphic surfaces, and responsive collapsible sidebar + mobile drawer.
8. **Automated Testing & Static Analysis**:
   * **Backend Tests**: 16/16 passing (`node --test`).
   * **Frontend Tests**: 5/5 passing (`node --test`).
   * **Oxlint**: 0 warnings, 0 errors across 52 files.

---

### ⚠️ Partially Completed Features (Live Backend + Static/Hybrid Frontend or Payload Mismatches)

1. **Customers Directory (`frontend/src/pages/Customers.jsx`)**:
   * **Status**: Backend API (`/api/users`, `/api/users/stats`) and Mongoose `User` model are complete, **but** `Customers.jsx` still renders static `SAMPLE_CUSTOMERS_DATA` from `constants/customers.js` and `frontend/src/api/users.js` does not exist yet.
2. **Executive Dashboard & Analytics Telemetry (`Dashboard.jsx`, `Analytics.jsx`, `settingsService.js`)**:
   * **Live**: `KPICard` metrics, `ComposedSalesChart` wrapper, and `RecentOrdersTable` consume `/api/settings/analytics` and `/api/orders`.
   * **Still Mocked / Hybrid**:
     * In `Dashboard.jsx`, `TopSellingProductsList` uses a hardcoded 5-product array, `LowStockProductsList` uses a hardcoded 4-item array with a simulated 450ms `setTimeout` restock button, and `CustomerOverviewCard` renders static numbers (`684` new / `1,129` returning).
     * In `settingsService.js`, `computeStoreAnalytics()` falls back to hardcoded demo numbers (`$128,450`, `1,420` orders, `3,890` customers, `"90.45"` avg order) if database counts are zero, returns hardcoded `Mon–Sun` `revenueBars` and static percentage deltas (`"14.2%"`, `"8.5%"`), estimates category revenue (`count * 450`), and reads `conversionFunnel` and `regionalDemand` from baseline config rather than dynamically aggregating `Order` timestamps by range (`7D` / `30D` / `90D` / `1Y`).
3. **Settings API Response Unwrapping (`settingsService.js` vs. `Settings.jsx`, `CreateOrder.jsx`, `useOrders.js`)**:
   * **Status**: `GET /api/settings` returns `data: { settings, summaryCards, transitNodes }`, **but** `Settings.jsx` (`applyLoadedSettings(res.data)`), `CreateOrder.jsx` (`const { commerce, payments } = settingsRes.value.data`), and `useOrders.js` (`settingsRes?.data?.commerce`) read top-level `data.commerce` / `data.payments` instead of `data.settings.*`, causing saved settings to be skipped on reload in favor of local defaults.
4. **Collection Product-Count Sorting & User Password Updates**:
   * **Collection Sort**: `Collection.jsx` sends `products_desc` and `products_asc`, whereas `collectionService.js` `sortMap` only handles `newest`, `oldest`, `name_asc`, and `name_desc`.
   * **Password Updates**: `userModel.js` hashes passwords in a `pre('save')` hook on creation, **but** `updateUserDetails` (`userService.js`) uses `User.findByIdAndUpdate`, bypassing `pre('save')` if a password update is submitted.

---

### ⏳ Pending Features, Bug Fixes & Roadmap

#### Priority 1: Critical Security & Bug Fixes
1. **Hash Password Updates in `userService.js`**: Refactor `updateUserDetails` so password changes hash via `bcryptjs` or `user.save()` instead of bypassing Mongoose `pre('save')` hooks via `findByIdAndUpdate`.
2. **Remove Hardcoded Cloudinary Fallbacks**: Remove default credential strings from `backend/src/config/env.js` lines 16–18 (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) so secrets come strictly from `.env`.
3. **Lock Down Production CORS & Clean Mongoose Options**: Restrict `app.use(cors())` in `backend/src/app.js` to an explicit `origin` whitelist (`process.env.CLIENT_URL`), and remove deprecated `{ useNewUrlParser: true, useUnifiedTopology: true }` options from `backend/src/config/mongoose.js`.
4. **Fix Settings Payload Unwrapping**: Read `data.settings` consistently across `Settings.jsx`, `CreateOrder.jsx`, and `useOrders.js` (or flatten the response) so persisted currency, tax, and payment gateway preferences apply everywhere.
5. **Fix Broken Dashboard Order Links & Collection Sort**: Update `buttonTo="/orders/new"` (line 752) and `<Link to="/orders/new">` (line 913) in `Dashboard.jsx` to `/orders/create-order` to match `App.jsx`, and add `products_desc` / `products_asc` sorting in `collectionService.js`.

#### Priority 2: Complete Full-Stack Integration
6. **Connect `Customers.jsx` to `/api/users`**: Create `frontend/src/api/users.js` and `useCustomers` hook, and add a "Create Customer" modal/form on the Customers page.
7. **Make All Dashboard Cards 100% Live**:
   * Fetch real low-stock items via `GET /api/products?status=low_stock` and wire the "Reorder" button to call `PUT /api/products/:id` to increment real MongoDB `stock`.
   * Aggregate real top-selling products and customer cohorts from `Order` and `User` collections.
8. **Dynamic Date-Range Aggregation in Analytics**: Implement MongoDB `$group` time-series pipelines over `Order.createdAt` so switching between `7D`, `30D`, `90D`, and `1Y` (and removing demo fallbacks in `computeStoreAnalytics()`) computes real trend metrics.
9. **Auto-Inventory & Customer Telemetry Hooks**:
   * Automatically decrement `Product.stock` when a new order is placed (and restore stock if an order is `Cancelled`).
   * Automatically increment `User.ordersCount`, `User.totalSpent`, and upgrade `tier` (`New` $\rightarrow$ `Active` $\rightarrow$ `VIP`) upon order completion.

#### Priority 3: Resume-Boosting Production Features
10. **Admin Authentication & Role-Based Guard (JWT)**: Add admin login page, HTTP-only cookie or Bearer JWT middleware (`protect`) securing `POST`/`PUT`/`PATCH`/`DELETE` routes.
11. **True CSV / PDF Export**: Replace `window.print()` in `Dashboard.jsx` and `Analytics.jsx` with structured PDF/CSV download generators for Analytics, Orders, and Inventory tables.
12. **PropTypes, Design Token & Dead-Code Cleanup**:
    * Add `PropTypes` definitions to `PageHeader.jsx`, `GalleryDialog.jsx`, and `NexaOpsLogo.jsx`, and replace hardcoded `text-[#20123d]` in `NexaOpsLogo.jsx` with a Tailwind design token.
    * Wire `Inventory.jsx` through the existing `useProducts` hook (or consolidate) and remove unused starter/legacy files (`Home.jsx`, `UploadImages.jsx`, and `VaultOSLogo.jsx`).
13. **CI/CD & Cloud Deployment**: Add a `.github/workflows/ci.yml` pipeline to run `npm test`, `npm run lint`, and `npm run build` automatically on pull requests, plus deployment configs for Render/Railway (Backend) and Vercel/Netlify (Frontend).
