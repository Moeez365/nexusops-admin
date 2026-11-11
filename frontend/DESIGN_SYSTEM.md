# NexaOps Admin — Frontend Design System

Use this file as the single visual, structural, and component source of truth when building or updating pages in `frontend/`.

Every color, spacing token, utility class, component pattern, and route in this document maps directly to the live codebase (`tailwind.config.js`, `src/index.css`, `src/App.jsx`, `src/components/`, and `src/pages/`).

---

## 1. Product Direction & Aesthetic Principles

**NexaOps Admin** is a high-precision luxury e-commerce operations console. It uses a calm lavender-tinted neutral surface hierarchy paired with saturated violet primary actions, frosted glass cards, and crisp monospace metadata.

Core visual traits across the app:
- **Pale lavender canvas**: `#fbf9ff` (`bg-background` / `bg-surface`) with elevated white-violet cards (`bg-surface-container/70 backdrop-blur-xl`).
- **Saturated violet actions**: `#6d3bd7` (`bg-primary text-on-primary`) for primary CTAs and active states.
- **Restrained elevation**: Subtle purple-tinted shadows (`shadow-[0_16px_45px_rgba(50,35,75,0.08)]`) and hairline borders (`border-outline-variant/60`).
- **Editorial hierarchy**: `Inter` for headings and UI copy, `Geist Mono` / `JetBrains Mono` (`font-label-mono`) for eyebrow labels, tabular metrics, IDs, SKUs, and badges.
- **Scannable efficiency**: Sticky action headers, KPI summary rows, filter toolbars with live tab counts, and asymmetric 12-column create/edit layouts.

**Canonical reference implementations in `src/pages/`**:
- Overview & charts: `Dashboard.jsx`, `Analytics.jsx`
- Filterable lists & tables: `Inventory.jsx`, `Collection.jsx`, `Orders.jsx`, `Customers.jsx`
- Create / Edit forms: `AddProduct.jsx`, `AddCollection.jsx`, `CreateOrder.jsx`
- Media asset workflows: `MediaGallery.jsx`, `UploadImages.jsx`
- Multi-tab configuration: `Settings.jsx`

---

## 2. Design Tokens (`tailwind.config.js` & `src/index.css`)

**Rule:** Strictly use tokens defined in `tailwind.config.js`, custom utilities in `src/index.css`, or standard Tailwind utilities. **Do not invent undefined tokens** (such as `space-lg`, `space-md`, `font-headline-sm`, `font-body-md`, `font-label-sans`, or `text-label-mono-sm`).

### Color Tokens (`tailwind.config.js`)

| Role | Token / Class | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| Canvas / Page Background | `bg-background` / `bg-surface` | `#fbf9ff` | Main `<main>` canvas and modal shell |
| Lowest Elevated Input/Row | `bg-surface-container-lowest` | `#fffaff` | Modal panels, sidebar drawer, active pills |
| Input / Subtle Table Header | `bg-surface-container-low` | `#f5f2fa` | Text inputs, `<select>`, `<thead>` rows |
| Standard Surface / Card | `bg-surface-container` | `#efecf4` | Standard cards (`bg-surface-container/70`), pill tracks |
| Subtle Interactive Surface | `bg-surface-container-high` | `#e9e6ee` | Secondary pill buttons, hover fills, disabled states |
| Strong Container Accent | `bg-surface-container-highest` | `#e3e0e8` | Dense badges, count chips, switches |
| Primary Text | `text-on-surface` | `#1d1a20` | Headings, table values, input text |
| Secondary Text | `text-on-surface-variant` | `#4b4654` | Labels, descriptions, table subtitles |
| Muted / Helper Text | `text-outline` | `#7c7485` | Eyebrow slashes, placeholders, timestamps |
| Hairline Border | `border-outline-variant` | `#cdc4d2` | Card borders (`/60`), input borders (`/40`), dividers (`/30`–`/40`) |
| Primary Brand Action | `bg-primary` / `text-primary` | `#6d3bd7` | Primary buttons, focus rings, active nav links |
| Text on Primary | `text-on-primary` | `#fffaff` | Button text/icons on `bg-primary` |
| Soft Primary Fill | `bg-primary-container` | `#e9ddff` | Icon boxes, active status badges, toast banners |
| Text on Soft Primary | `text-on-primary-container` | `#23005c` | Text/icons inside `bg-primary-container` |
| Secondary Accent | `bg-secondary-container` / `text-on-secondary-container` | `#e9ddff` / `#22005d` | Section icon badges, tier pills |
| Tertiary Accent | `bg-tertiary-fixed` / `text-on-tertiary-fixed` | `#e3dfff` / `#181445` | Alternate tags / lot badges |
| Destructive / Error | `bg-error` / `text-error` / `bg-error-container` / `text-on-error-container` | `#ba1a1a` / `#ffdad6` / `#410002` | Required asterisks `*`, error banners, delete confirmation |
| Backdrop Overlay | `bg-inverse-surface/45` (`#322f35`) or `bg-black/30` | `#322f35` | Modal and drawer backdrops |

**Contrast Warning:** Never pair `bg-primary-container` (`#e9ddff`) with `text-on-primary` (`#fffaff`) on buttons or badges—both are light colors. Always pair `bg-primary` with `text-on-primary`, and `bg-primary-container` with `text-primary` or `text-on-primary-container`.

### Typography & Numeric Formatting

Font imports are loaded in `index.html` and wired in `src/index.css`:
- **Sans (`--font-sans`)**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Mono (`--font-mono`)**: `'Geist Mono', 'JetBrains Mono', ui-monospace, monospace`
- **Tabular figures**: `table`, `.metric-value`, and `.tabular-data` automatically apply `font-feature-settings: "tnum" 1, "zero" 1` (`src/index.css`), or use Tailwind `tabular-nums` on KPI counts and prices.

Exact font tokens in `tailwind.config.js` and `src/index.css`:
- `font-display-lg` / `text-display-lg`: `48px`, `line-height: 1.1`, `letter-spacing: -0.04em`, weight `600` (use responsive sizing such as `text-2xl md:text-3xl` inside narrow sidebars)
- `font-headline-lg` / `text-headline-lg`: `32px`, `line-height: 1.2`, `letter-spacing: -0.02em`, weight `600` (page `<h1>` pattern: `font-headline-lg text-2xl tracking-tight text-on-surface md:text-headline-lg`)
- `font-headline-md` (`src/index.css`): `1.25rem` (`20px`), `line-height: 1.75rem`, weight `600`
- `font-title-md` / `text-title-md`: `18px`, `line-height: 1.5`, `letter-spacing: -0.01em`, weight `500` (card headers & button titles: `font-title-md text-title-md font-semibold` or `font-title-md text-sm`)
- `font-label-md` (`src/index.css`): `0.875rem` (`14px`), `line-height: 1.25rem`, weight `500`
- `text-body-base`: `14px`, `line-height: 1.6`, weight `400`
- `font-label-mono` / `text-label-mono`: `12px`, `line-height: 1`, `letter-spacing: 0.05em`, weight `500` (section eyebrows and table headers commonly use `font-label-mono text-[10px] uppercase tracking-widest` or `tracking-[0.2em]`)
- `text-label-sm` (`src/index.css`): `0.75rem` (`12px`), `line-height: 1rem`

### Spacing, Radii, Shadows & Custom Utilities

- **Radii (`tailwind.config.js`)**: `rounded` (`0.25rem`), `rounded-lg` (`0.5rem`), `rounded-xl` (`0.75rem` for inputs, inner panels, icon boxes), `rounded-2xl` (primary glass cards, tables, modals), `rounded-full` (pills, primary header CTA, status badges).
- **Spacing**: `gap-gutter` (`20px` / `1.25rem`), `p-container-padding` (`32px`), `px-margin-mobile` (`1rem`), `px-margin-desktop` (`2rem`), `gap-stack-sm` (`0.75rem`), `p-stack-md` (`1.5rem`), `mt-stack-md` (`1.5rem`).
- **Component CSS helpers (`src/index.css`)**:
  - `.glass-card`: border + translucent `#fffaff` + `16px` blur + shadow.
  - `.media-image-loading`: gradient shimmer overlay used automatically inside `ShimmerImage`.
  - `.no-scrollbar` & `.custom-scrollbar`: consistent overflow scrollbars.

### Icon System (Material Symbols Outlined)

- Loaded via `#google-material-symbols` in `index.html`.
- `src/main.jsx` calls `waitForGoogleIcons()` and adds `.icons-loaded` to `<html>`; `.material-symbols-outlined` remains hidden until loaded to prevent raw ligature text flash.
- Always reserve icon space with `<span className="material-symbols-outlined text-[18px]">icon_name</span>` (or `text-[16px]`, `text-[20px]`, `text-2xl`).
- Every icon-only button **must** include `aria-label="..."`.
- Common icon names in NexaOps: `dashboard`, `inventory_2`, `collections_bookmark`, `photo_library`, `shopping_cart`, `group`, `insights`, `settings`, `add`, `save`, `lock`, `local_shipping`, `edit`, `delete`, `close`, `search`, `check_circle`, `error`, `progress_activity`, `expand_more`.

---

## 3. Navigation & Standard Page Shell

Sidebar navigation is owned exclusively by [`App.jsx`](src/App.jsx) using `NAV_ITEMS` from [`src/constants/navigation.js`](src/constants/navigation.js). **Never duplicate the sidebar inside page components.**

### Registered Routes (`src/App.jsx` & `src/constants/navigation.js`)

| Route | Component | Sidebar Label & Icon |
| :--- | :--- | :--- |
| `/` | `Dashboard` | `Dashboard` (`dashboard`) |
| `/inventory` | `Inventory` | `Inventory` (`inventory_2`) |
| `/inventory/add-product` | `AddProduct` | — (child of Inventory) |
| `/collections` | `Collection` | `Collections` (`collections_bookmark`) |
| `/collections/add-collection` | `AddCollection` | — (child of Collections) |
| `/media-gallery` | `MediaGallery` | `Media Gallery` (`photo_library`) |
| `/orders` | `Orders` | `Orders` (`shopping_cart`) |
| `/orders/create-order` | `CreateOrder` | — (child of Orders) |
| `/customers` | `Customers` | `Customers` (`group`) |
| `/customers/add-customer` | `AddCustomer` | — (child of Customers) |
| `/analytics` | `Analytics` | `Analytics` (`insights`) |
| `/settings` | `Settings` | `Settings` (`settings`) |
| `/about` | `About` | — (standalone route) |

Desktop sidebar supports collapse (`w-20` vs `w-72`, saved under `nexaops_desktop_nav_collapsed`), triggered by [`PageHeader`](src/components/PageHeader.jsx) dispatching `"open-mobile-navigation"` (`< 768px`) or `"toggle-desktop-navigation"` (`>= 768px`).

### Standard Page Shell

Every top-level and form page follows this shell:

```jsx
<>
  <PageHeader
    title="Page Name"
    buttonLabel="Primary Action"
    buttonIcon="add"
    onButtonClick={handlePrimaryAction}
  />

  <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-8">
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      {/* Page sections */}
    </div>
  </main>
</>
```

*Note:* `Dashboard.jsx` uses its own sticky search/notification `<header>` tailored to `h-20` with the same `border-b border-outline-variant/60 bg-surface/90 backdrop-blur-xl` contract; all other pages use `<PageHeader />`.

---

## 4. Standard Components & Patterns

### `<PageHeader />` (`src/components/PageHeader.jsx`)

Props:
- `title`: Header heading (eyebrow displays `"NexaOps Console"`)
- `buttonLabel`, `buttonIcon`, `onButtonClick`, `buttonTo`, `buttonDisabled`
- `secondaryButtonLabel`, `secondaryButtonIcon`, `onSecondaryButtonClick`, `secondaryButtonTo`

When `buttonDisabled={true}` (used during saving or missing required fields in `AddProduct.jsx` and `AddCollection.jsx`), `PageHeader` applies muted disabled styles (`disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant/50 disabled:shadow-none`) and displays `"lock"` as `buttonIcon`.

### Glassmorphic Card

Used for form sections, metric cards, panels, and settings groups across all pages:

```jsx
const cardClass =
  "rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-6 shadow-[0_16px_45px_rgba(50,35,75,0.08)] backdrop-blur-xl";
```

*(Compact summary/analytics cards may use `p-5`.)*

### Form Inputs & Labels

```jsx
const inputClass =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-body-base text-on-surface placeholder:text-on-surface-variant/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

const inputWithIconClass =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-low pl-10 pr-4 py-2.5 text-body-base text-on-surface placeholder:text-on-surface-variant/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
```

Label convention:

```jsx
<label className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
  Field Name <span className="text-error">*</span>
</label>
```

### Buttons (Primary, Secondary, & Locked Validation State)

**Primary Pill CTA** (used in `PageHeader`, `AddProduct.jsx`, `AddCollection.jsx`, `CreateOrder.jsx`):

```jsx
<button
  type="button"
  disabled={isSaveDisabled}
  onClick={handleSubmit}
  className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2 font-title-md text-sm text-on-primary shadow-[0_6px_16px_rgba(109,59,215,0.18)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
>
  <span className="material-symbols-outlined text-[18px]">
    {isSaveDisabled && !isSubmitting ? "lock" : "save"}
  </span>
  <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
</button>
```

**Secondary Outline Pill** (Cancel / Draft / Reset):

```jsx
<button
  type="button"
  onClick={() => navigate("/parent-route")}
  className="cursor-pointer rounded-full border border-outline-variant/60 bg-surface-container-high/60 px-5 py-2 font-label-mono text-xs uppercase tracking-wider text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
>
  Cancel
</button>
```

### `<ListFilterToolbar />` & `<ToolbarSelect />` (`src/components/ListFilterToolbar.jsx`)

Standard toolbar for list pages (`Inventory.jsx`, `Collection.jsx`, `Orders.jsx`, `Customers.jsx`). Supports:
- Status/tier filter `tabs` (`[{ id, label, count }]`) with tabular pill counts
- Debounced/controlled `searchQuery` input with left `search` icon and clear button
- Child filter dropdown slots rendered with `<ToolbarSelect ariaLabel="..." value={...} onChange={...} options={[...]} />`
- Active filter count banner and `Reset filters` action (`hasActiveFilters`, `onResetFilters`)

### `<StatusBadge />` (`src/components/common/StatusBadge.jsx`)

Use `<StatusBadge status="..." />` instead of ad-hoc badge spans where supported. Supported status keys (case-insensitive):
- Green (`emerald-500`): `active`, `delivered`, `completed`
- Violet (`primary-container`): `processing`, `vip`
- Blue (`blue-500`): `shipped`
- Amber (`amber-500`): `pending`, `low_stock`
- Sky (`sky-500`): `new`
- Red (`error-container`): `out_of_stock`, `cancelled`
- Neutral (`surface-container-high`): `draft`, `scheduled`

### `<ShimmerImage />` (`src/components/common/ShimmerImage.jsx`)

Wraps product and media images with `.media-image-loading` skeleton shimmer during load and falls back cleanly to a Material symbol (`fallbackIcon="broken_image"`) when missing or errored.

### `<ConfirmModal />` & Dialog Modals (`src/components/common/ConfirmModal.jsx`, `GalleryDialog.jsx`)

- Overlay: `fixed inset-0 z-50` (or `z-[100]`) `flex items-center justify-center bg-inverse-surface/45 p-4 backdrop-blur-sm`
- Panel: `rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-[0_24px_70px_rgba(50,35,75,0.18)]`
- Behavior: `role="dialog" aria-modal="true"`, Escape-key dismissal, backdrop click dismissal when not loading, explicit loading state labels (`Deleting...`).

### Notification / Alert Banner

```jsx
{notification && (
  <div
    className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm transition-all ${
      notification.type === "error"
        ? "border-error/30 bg-error-container/80 text-on-error-container"
        : "border-primary/30 bg-primary-container/80 text-on-primary-container"
    }`}
  >
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-[20px]">
        {notification.type === "error" ? "error" : "check_circle"}
      </span>
      <span className="font-medium">{notification.message}</span>
    </div>
    <button
      type="button"
      aria-label="Dismiss notification"
      onClick={() => setNotification(null)}
      className="cursor-pointer p-1 hover:opacity-80"
    >
      <span className="material-symbols-outlined text-sm">close</span>
    </button>
  </div>
)}
```

---

## 5. Standard Page Layouts

### A. List / Directory Page (`Orders.jsx`, `Inventory.jsx`, `Collection.jsx`, `Customers.jsx`)

1. `<PageHeader />` routing to the create view or opening a creation modal.
2. Minimal title section (`font-label-mono text-[10px] uppercase tracking-[0.2em] text-primary` eyebrow + `<h1>` + subtitle).
3. Optional 3-column or 4-column KPI summary row (`grid-cols-1 gap-6 md:grid-cols-3` or `sm:grid-cols-2 xl:grid-cols-4`).
4. `<ListFilterToolbar>` with status tabs, search, and `<ToolbarSelect>` filters.
5. Glassmorphic table (`<div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">`) or responsive card grid (`grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3`).

### B. Create / Edit Form Page (`AddProduct.jsx`, `AddCollection.jsx`, `CreateOrder.jsx`)

1. `<PageHeader />` with `buttonDisabled` and `lock` icon until required fields pass validation.
2. Top Breadcrumb + Action Row:
   - Parent `<Link>` (`text-primary font-label-mono text-[10px] uppercase tracking-widest hover:underline`) + `/` + protocol label
   - `<h1>` (`font-headline-lg text-2xl tracking-tight text-on-surface md:text-headline-lg`)
   - Action pills (`Cancel`, optional secondary draft/add pill, primary `Save` / `Save & Dispatch` pill).
3. Dismissible feedback banner (`error` / `success`).
4. Asymmetric 12-column grid (`grid grid-cols-1 gap-gutter lg:grid-cols-12 items-start`):
   - **Main stream** (`space-y-6 lg:col-span-8` or `lg:col-span-7`): Form detail cards, line items, addresses, media manager, notes.
   - **Sticky sidebar** (`space-y-6 lg:col-span-4 lg:sticky lg:top-28` or `lg:col-span-5`): Workflow selects, statuses, payment configuration, summary/financial ledger card, primary authorize CTA.

---

## 6. Responsive & Accessibility Checklist

- **Mobile-first grids**: Always stack in `grid-cols-1` on phones and expand cleanly at `sm:`, `md:`, `lg:`, `xl:`.
- **Prevent text collision**: Apply `min-w-0` on flex children and `truncate` on dynamic names/emails; keep tables inside `overflow-x-auto`.
- **Page spacing**: Use `px-4 md:px-8` horizontal padding and `pb-24 md:pb-8` bottom clearance.
- **Interactive polish**: All clickable buttons include `cursor-pointer`; avoid disabling focus outlines without `:focus-visible` fallback (`index.css` sets `outline: 2px solid #6d3bd7`).
- **Accessible dialogs & drawers**: Use `role="dialog"`, `aria-modal="true"`, Escape listeners, and explicit `aria-label` on close/step/remove buttons.

---

## 7. Frontend Architecture & Verification Rules

Directory conventions in `frontend/src/`:
- `api/` — Axios client (`axios.js`) and endpoint wrappers (`products.js`, `collections.js`, `orders.js`, `settings.js`, `image.js`).
- `components/` — Shared layout (`PageHeader`, `ListFilterToolbar`, `NexaOpsLogo`, `GalleryDialog`, `UploadDialog`, `ImagePreview`), `common/` (`StatusBadge`, `ConfirmModal`, `ShimmerImage`), and domain folders (`product/`).
- `constants/` — UI static datasets, navigation items, and filter definitions (`navigation.js`, `orders.js`, `customers.js`, `analytics.js`, `dashboard.js`, `settings.js`).
- `hooks/` — Data fetching and state orchestration hooks (`useOrders.js`, `useProducts.js`, `useDashboard.js`, `useImageLoader.js`) exported through `hooks/index.js`. Keep complex `useEffect` fetching out of JSX pages where hooks fit.
- `utils/` — Pure helpers (`formatCurrency`, `formatNumber`, `formatDate`, `slugify` in `utils/formatters.js`). Always use `formatCurrency` instead of hardcoding currency symbols inside summaries.

Required checks before finishing any frontend change (run inside `frontend/`):
- `npm run lint` (`oxlint` — `.oxlintrc.json` enforces `react/rules-of-hooks: error` and `react/only-export-components: warn`; avoid exporting constants/helpers alongside components in `.jsx` files).
- `npm test` (`node --test src/**/__tests__/*.test.js`).
- `npm run build` (`vite build`).
