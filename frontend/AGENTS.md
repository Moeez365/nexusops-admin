# nexusops-admin (NexaOps Admin) Frontend - AGENTS.md

## Project Overview

**nexusops-admin** (NexaOps Admin) is a commerce admin dashboard built with React + Vite. It provides a sophisticated interface for managing products, collections, inventory, orders, and media assets with a refined, editorial design system.

### Tech Stack
- **Framework**: React 19.2.7 with React Router 7.18.1
- **Build Tool**: Vite 8.1.1
- **Styling**: Tailwind CSS 4.3.3 with custom Design Tokens
- **Linting**: Oxlint with React rules
- **Icons**: Google Material Symbols Outlined
- **API Client**: Axios

## Directory Structure

```
frontend/
├── src/
│   ├── api/                    # API layer for backend communication
│   │   ├── axios.js           # Axios instance with /api base URL
│   │   ├── collections.js     # Collection CRUD endpoints
│   │   ├── image.js           # Image upload and retrieval
│   │   └── products.js        # Product CRUD endpoints
│   ├── components/             # Reusable UI components
│   │   ├── common/            # Design system primitives (StatusBadge, ConfirmModal, ShimmerImage)
│   │   ├── product/           # Domain components (ProductImagesManager)
│   │   ├── GalleryDialog.jsx  # Image gallery selection modal
│   │   ├── ImagePreview.jsx   # Individual image preview dialog
│   │   ├── ListFilterToolbar.jsx # Search, sort & filter controls
│   │   └── PageHeader.jsx     # Standard page header with navigation
│   ├── constants/              # Centralized data and navigation constants
│   │   ├── analytics.js       # KPI, metrics & chart configs
│   │   ├── customers.js       # Customer records & tier filters
│   │   ├── dashboard.js       # Overview metric cards & quick actions
│   │   ├── navigation.js      # App sidebar routes & badges
│   │   ├── orders.js          # Order status filters & mock order records
│   │   └── settings.js        # Logistics transit nodes & summary
│   ├── hooks/                  # Custom React hooks
│   │   └── useImageLoader.js  # Reactive image load status tracker
│   ├── utils/                  # Centralized utility functions
│   │   └── formatters.js      # formatCurrency, formatNumber, formatDate, slugify
│   ├── pages/                  # Page components (routes)
│   │   ├── AddCollection.jsx  # Create/edit collection form
│   │   ├── AddProduct.jsx     # Create/edit product form with ProductImagesManager
│   │   ├── Analytics.jsx      # Telemetry & performance analytics
│   │   ├── Collection.jsx     # Collections management
│   │   ├── Customers.jsx      # VIP & patron customer directory
│   │   ├── Dashboard.jsx      # Executive overview & quick actions
│   │   ├── Inventory.jsx      # Product inventory catalog
│   │   ├── MediaGallery.jsx   # Media asset library
│   │   ├── Orders.jsx         # Order management queue
│   │   ├── Settings.jsx       # Store configuration
│   │   └── UploadImages.jsx   # Bulk image upload interface
│   ├── App.jsx                 # Main app layout with navigation
│   ├── main.jsx               # React entry point
│   └── index.css              # Global styles and design utilities
├── public/                     # Static assets (favicon, icons)
├── DESIGN_SYSTEM.md           # Complete design system documentation
├── index.html                 # HTML entry point
├── package.json
├── tailwind.config.js         # Tailwind configuration with brand tokens
├── vite.config.js             # Vite configuration with proxy
└── .oxlintrc.json             # Oxlint linting rules
```

## Design System

The project follows a **luxury commerce design system** with these key characteristics:

### Visual Identity
- **Page Surface**: Pale lavender (`#fbf9ff`)
- **Primary Brand Color**: Saturated violet (`#6d3bd7`)
- **Typography**: Inter font family
- **Metadata Font**: JetBrains Mono
- **Card Style**: Glass-like with backdrop-blur and subtle shadows
- **Shadows**: 50,35,75 purple-based shadows for depth

### Component Patterns
1. **Cards**: `rounded-2xl` with `bg-surface-container/70`, backdrop-blur, subtle shadow
2. **Buttons**: `rounded-full` for primary actions, `rounded-xl` for secondary
3. **Inputs**: `rounded-xl` with `bg-surface-container-low`
4. **Status Badges**: `rounded-full` with primary-container colors

### Typography Scale
- Display: 48px, 600 weight
- Headline: 32px, 600 weight  
- Title: 18px, 500 weight
- Body: 14px, 400 weight
- Label: 12px, 500 weight (mono)

## Navigation Structure

```
Dashboard (Home)
Inventory
  ├── List Products
  └── Add/Edit Product
Orders
Media Gallery
Collections
  ├── List Collections
  └── Add/Edit Collection
Settings
```

## Key Features

### Dashboard
- Analytics metrics (revenue, orders, customers, AOV)
- charts (revenue breakdown, order velocity)
- Recent orders table
- Real-time status alerts

### Inventory Management
- Product grid with search and filters
- Bulk actions and sorting
- Visual product cards with status indicators
- Stock level monitoring

### Product Creation/Editing
- Multi-step form with validation
- Image gallery integration
- SEO-friendly slug generation
- Pricing architecture (price, compare price, discount)
- Taxonomy and tags management
- Product visibility toggles

### Media Management
- Drag & drop image upload (up to 5MB, 10 files max)
- Cloudinary CDN integration
- Preview dialog for image inspection
- Bulk upload queue
- Gallery search and filtering

### Collection Management
- Visual collection cards with cover images
- Product assignment system
- Parent collection hierarchy
- SEO meta descriptions
- Visibility scheduling

### Settings
- Store profile configuration
- Commerce settings (currency, tax, inventory thresholds)
- Notification preferences
- Security and two-factor authentication
- Fulfillment network monitoring

## API Endpoints

### Products (`/api/products`)
- `GET /` - List all active products
- `POST /` - Create product
- `GET /:id` - Get product by ID
- `PUT /:id` - Update product
- `DELETE /:id` - Delete product

### Collections (`/api/collections`)
- `GET /` - List collections (with isActive filter)
- `POST /` - Create collection
- `GET /:id` - Get collection by ID
- `PUT /:id` - Update collection
- `DELETE /:id` - Delete collection

### Uploads (`/api/upload`)
- `GET /?limit=N` - Get uploaded images (pagination)
- `POST /` - Upload images (multipart/form-data)

## Configuration

### Vite Proxy (`vite.config.js`)
```javascript
target: 'http://localhost:5000'
changeOrigin: true
```

### Tailwind Configuration (`tailwind.config.js`)
- Custom color palette with MUI Design Tokens
- Extended spacing system (`gutter: 20px`, `unit: 4px`)
- Custom font families (Inter, JetBrains Mono)
- Custom border radius scale
- Extended fontSize definitions

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Lint check
npm run lint

# Preview build
npm run preview
```

## Environment Requirements

- Node.js 18+ recommended
- Backend server running on port 5000 (default)
- Cloudinary account for image storage (configured in `.env`)

## Best Practices

1. **Design Consistency**: Always reference `DESIGN_SYSTEM.md` before adding new components
2. **Color Tokens**: Use only Tailwind classes from `tailwind.config.js`, never hardcode colors
3. **Responsive Design**: Start with mobile-first, expand at `sm`, `md`, `lg`, `xl`
4. **Icon Usage**: Use Material Symbols Outlined with semantic names
5. **Form Validation**: Validate before API calls, show clear error messages
6. **Loading States**: Always show loading indicators for async operations
7. **Image Optimization**: Use Cloudinary for production images
8. **Code Style**: Follow Oxlint rules, export only components

## Common Patterns

### Page Structure
```jsx
<>
  <PageHeader title="Page Name" buttonLabel="Action" />
  <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-6">
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">
      {/* content */}
    </div>
  </main>
</>
```

### Card Component
```jsx
<section className="rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-5 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl">
  {/* content */}
</section>
```

### Status Badge
```jsx
<span className="rounded-full bg-primary-container px-2.5 py-1 text-xs font-medium text-on-primary-container">
  Active
</span>
```

## Troubleshooting

### Common Issues
1. **Cloudinary Upload Failures**: Check `.env` credentials, verify Cloudinary account
2. **CORS Errors**: Ensure backend has CORS enabled (already configured in `app.js`)
3. **Tailwind Not Applying**: Verify `tailwind.config.js` content paths match project structure
4. **Image Loading**: Check Cloudinary public IDs and URL formats

## Project Goals

- Provide a premium admin experience for luxury e-commerce
- Enable rapid product and collection management
- Maintain visual consistency through design system
- Support high-volume media asset management
- Enable granular control over product presentation and pricing

## API Integration Notes

- All API calls go through `/api` proxy to avoid CORS
- Axios instance configured with 10-second timeout
- Image uploads have extended 120-second timeout
- Error handling should include user-friendly messages
- Use abort controllers for cancelable requests
