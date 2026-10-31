# NexusOps Admin (`nexusops-admin`)

> **Next-Generation Luxury E-Commerce Operations & Administration Platform**  
> Built with modern full-stack JavaScript (React 19, Tailwind CSS v4, Express, and MongoDB Mongoose).

[![React](https://img.shields.io/badge/React-19.2.7-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.1.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-ES_Modules-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21.0-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_7.7-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![Oxlint](https://img.shields.io/badge/Oxlint-0_Warnings_/_0_Errors-brightgreen)](https://oxc.rs/)

---

## 🌟 Overview

**NexusOps Admin** is a luxury commerce administration dashboard and enterprise operations engine. Designed for high-volume retail management, it pairs an editorial, glassmorphic UI with a clean, decoupled backend architecture.

### ✨ Key Features

* **Executive Analytics & Telemetry**: Dual-axis composed SVG revenue and volume velocity charts, conversion funnels, regional demand tracking, and real-time KPI metrics.
* **Order Management & Workflow**: Interactive status transition pipeline (`Pending` $\rightarrow$ `Processing` $\rightarrow$ `Shipped` $\rightarrow$ `Delivered`), optimistic updates with rollback, quick drawer inspection, and CSV/ID clipboard utilities.
* **Product Catalog & Inventory**: Granular pricing tiers, comparison values, dynamic stock monitors (`active`, `low_stock`, `out_of_stock`, `draft`), and synchronized multi-collection assignment.
* **Cloudinary Media Pipeline**: Drag-and-drop bulk uploads, automated temporary file unlinking, image CDN hosting, and asset gallery selection.
* **Collection Architecture**: Visual lookbooks, parent-child categorization, and auto-computed product counts.
* **Enterprise Store Configuration**: Masked payment secrets (Stripe, PayPal, Bank Wire, Escrow), logistics transit nodes, multi-currency support, and live toggle rules.

---

## 🏗️ Architecture & Project Structure

The codebase adheres strictly to the **Senior MERN Clean Architecture** standard:
* **Backend**: Thin Express controllers, dedicated business logic services in `services/`, centralized async error handling, and ReDoS-safe queries.
* **Frontend**: Declarative UI components decoupled from data fetching via custom hooks, design system tokens, and zero Oxlint errors.

```
nexusops-admin/
├── backend/
│   ├── src/
│   │   ├── utils/
│   │   │   ├── asyncHandler.js       # Global async wrapper forwarding to next(error)
│   │   │   ├── sanitize.js           # escapeRegex utility guarding against ReDoS
│   │   │   └── logger.js             # Formatted system logging
│   │   ├── middleware/
│   │   │   ├── errorHandler.js       # Centralized 404 & Mongoose error handling
│   │   │   └── upload.js             # Multer upload limits and storage engine
│   │   ├── services/                 # Dedicated Business Logic & Query Layer
│   │   │   ├── orderService.js       # Orders queries, aggregations & stats
│   │   │   ├── productService.js     # Catalog queries, stock & collections sync
│   │   │   ├── collectionService.js  # Collections hierarchy & population
│   │   │   ├── imageService.js       # Cloudinary pipeline & unlink cleanup
│   │   │   └── settingsService.js    # Store settings, analytics & payment sanitization
│   │   ├── controllers/              # Thin Controllers (HTTP parsing & envelopes only)
│   │   │   ├── orderController.js
│   │   │   ├── productController.js
│   │   │   ├── collectionController.js
│   │   │   ├── imageController.js
│   │   │   └── settingsController.js
│   │   ├── models/                   # Mongoose Data Schemas
│   │   │   ├── userModel.js
│   │   │   ├── orderModel.js
│   │   │   ├── productModel.js
│   │   │   ├── collectionModel.js
│   │   │   ├── imageModel.js
│   │   │   └── storeSettingsModel.js
│   │   ├── routes/                   # Modular Express Routers
│   │   ├── config/                   # Database & Cloudinary Environment Configurations
│   │   ├── app.js                    # Express app configuration & middleware pipeline
│   │   └── server.js                 # HTTP listener & database connection
│   └── tests/                        # Production Unit Test Suites (node:test)
│       ├── services/                 # Order service & query tests
│       └── utils/                    # Sanitizer & security tests
└── frontend/
    ├── src/
    │   ├── api/                      # Axios HTTP API client modules
    │   │   ├── axios.js              # Configured instance with /api base URL
    │   │   ├── orders.js
    │   │   ├── products.js
    │   │   ├── collections.js
    │   │   ├── image.js
    │   │   └── settings.js
    │   ├── hooks/                    # Extracted State & Side-Effect Layer
    │   │   ├── useOrders.js          # Encapsulated orders fetching, filters & updates
    │   │   ├── useDashboard.js       # Encapsulated analytics telemetry & recent orders
    │   │   ├── useProducts.js        # Product catalog filtering & pagination
    │   │   ├── useImageLoader.js     # Reactive image load status tracker
    │   │   └── index.js              # Centralized hook exports
    │   ├── components/               # Modular UI Component Library
    │   │   ├── common/               # Design Primitives (StatusBadge, ConfirmModal, ShimmerImage)
    │   │   ├── product/              # Domain-specific components (ProductImagesManager)
    │   │   ├── ListFilterToolbar.jsx # Search, sort, and status filtering controls
    │   │   ├── PageHeader.jsx        # Standardized page headers and quick actions
    │   │   ├── GalleryDialog.jsx     # Asset selector modal
    │   │   └── NexaOpsLogo.jsx       # Brand mark & responsive logo artwork
    │   ├── constants/                # Navigation, statuses, and fallback configs
    │   ├── pages/                    # Pure, Declarative UI Views
    │   │   ├── Dashboard.jsx         # Executive overview & composed sales charts
    │   │   ├── Orders.jsx            # Order management queue & detail drawer
    │   │   ├── Inventory.jsx         # Product inventory & stock levels
    │   │   ├── AddProduct.jsx        # Product creator & editor form
    │   │   ├── Collection.jsx        # Collections lookbook directory
    │   │   ├── AddCollection.jsx     # Collection creator & editor form
    │   │   ├── MediaGallery.jsx      # Cloudinary digital asset manager
    │   │   ├── UploadImages.jsx      # Bulk asset uploader
    │   │   ├── Analytics.jsx         # Performance metrics & telemetry
    │   │   ├── Customers.jsx         # Client directory & VIP tiers
    │   │   └── Settings.jsx          # Store profile, payments & logistics
    │   ├── utils/                    # Formatters (currency, numbers, dates, slugs)
    │   │   └── __tests__/            # Formatting & SEO Slug Unit Tests
    │   ├── App.jsx                   # React Router v7 routes configuration
    │   ├── main.jsx                  # Application entry point
    │   └── index.css                 # Tailwind CSS v4 & custom design tokens
    ├── tailwind.config.js             # NexaOps design token definitions
    └── vite.config.js                 # Vite bundler configuration with /api proxy
```

---

## 🎨 NexaOps Design System

The visual design is grounded in an editorial luxury aesthetic:

* **Surface Palette**: Pale lavender base (`#fbf9ff`) paired with saturated violet primary brand accents (`#6d3bd7`).
* **Glassmorphic Cards**: `rounded-2xl` with `bg-surface-container/70`, `backdrop-blur-xl`, subtle border outlines (`border-outline-variant/60`), and ambient shadows (`shadow-[0_16px_45px_rgba(50,35,75,0.08)]`).
* **Typography**: Clean `Inter` font pairings for displays and headlines, alongside `JetBrains Mono` for tabular metadata and monetary values.
* **Icon System**: Google Material Symbols Outlined integrated with `.icons-loaded` CSS transition guards against FOIT (Flash of Unstyled Icons).

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
* [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)
* [Cloudinary Account](https://cloudinary.com/) (For media asset storage)

---

### Installation & Environment Setup

#### 1. Clone the repository
```bash
git clone https://github.com/your-username/nexusops-admin.git
cd nexusops-admin
```

#### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/nexusops
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 💻 Running the Application

### Start Backend Development Server
```bash
cd backend
npm run dev
# Server runs at http://localhost:5000
# Health check available at http://localhost:5000/health
```

### Start Frontend Development Server
```bash
cd frontend
npm run dev
# Vite runs at http://localhost:5173
```

---

## 🧪 Testing & Code Quality

### Running Unit Tests
Both backend and frontend feature automated native unit tests:

```bash
# Run backend test suites (orderService, regex sanitizer)
cd backend
npm test

# Run frontend test suites (currency formatters, SEO slugifier)
cd frontend
npm test
```

### Linting
The frontend is strictly verified using Oxlint (targeted at 0 warnings and 0 errors):
```bash
cd frontend
npm run lint
```

### Production Build
To create an optimized production bundle:
```bash
cd frontend
npm run build
```

---

## 🤖 Built-In Agent Skills (`.agents/skills/`)

This repository is equipped with tailored agent skills configured for autonomous pair programming:

| Skill | Configuration | Description |
| :--- | :--- | :--- |
| **`clean-mern`** | [`.agents/skills/clean-mern/SKILL.md`](.agents/skills/clean-mern/SKILL.md) | Enforces thin controllers, dedicated services, custom hooks, guard clauses, and ES6+ standards. |
| **`code-review`** | [`.agents/skills/code-review/SKILL.md`](.agents/skills/code-review/SKILL.md) | Audits pull requests and diffs for React 19 hook safety, NexaOps design token compliance, and security. |
| **`unit-testing`** | [`.agents/skills/unit-testing/SKILL.md`](.agents/skills/unit-testing/SKILL.md) | Provides testing patterns, mock blueprints, and test runner execution commands. |
| **`git-workflow`** | [`.agents/skills/git-workflow/SKILL.md`](.agents/skills/git-workflow/SKILL.md) | Enforces Conventional Commits (`feat:`, `fix:`) with scoped tags (`orders`, `products`, `dashboard`). |
| **`architecture-scaffold`** | [`.agents/skills/architecture-scaffold/SKILL.md`](.agents/skills/architecture-scaffold/SKILL.md) | Scaffolds new full-stack features following established backend and frontend patterns. |

---

## 📜 License

Private and proprietary. Developed for **NexusOps Admin**. All rights reserved.

