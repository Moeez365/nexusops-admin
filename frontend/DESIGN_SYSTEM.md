# Lumina Frontend Design System

Use this file as the visual and structural source of truth when creating or modifying Lumina admin pages.

## Product Direction

Lumina is a refined luxury-commerce admin UI. It should feel calm, editorial, precise, and modern.

The interface is not a marketing website. It is an admin dashboard for repeated daily work, so pages should be clear, scannable, and efficient while still feeling premium.

Good Lumina pages use:

- Pale lavender page surfaces.
- Saturated violet primary actions.
- Soft glass-like cards.
- Restrained shadows.
- Generous whitespace.
- Compact uppercase metadata.
- Product imagery where it helps the user understand inventory, media, or collections.
- Clear actions in the sticky header.

Reference pages:

- `Dashboard.jsx` for analytics, metrics, alert cards, tables, and charts.
- `Inventory.jsx` for product grids, search, filters, and product cards.
- `MediaGallery.jsx` for asset-heavy layouts.
- `Collection.jsx` for collection management.
- `PageHeader.jsx` for the standard page header.

## Brand Tokens

Use `tailwind.config.js` as the token source. Do not create another color system.

Core colors:

- Page background: `bg-background`
- Main text: `text-on-surface`
- Secondary text: `text-on-surface-variant`
- Primary action: `bg-primary text-on-primary`
- Soft primary surface: `bg-primary-container text-on-primary-container`
- Standard card surface: `bg-surface-container/70`
- Input surface: `bg-surface-container-low`
- Subtle border: `border-outline-variant/60`
- Destructive action: `bg-error text-on-error`
- Destructive soft state: `bg-error-container text-on-error-container`

Typography:

- Main font: Inter.
- Metadata font: `font-label-mono`.
- Page title: `font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg`
- Section title: `text-xl font-semibold` or `font-title-md text-title-md`
- Body text: `text-body-base text-on-surface-variant`
- Metadata text: `font-label-mono text-[10px] uppercase tracking-widest`

Icon system:

- Use Google Material Symbols Outlined.
- Icon-only buttons must have `aria-label`.
- Good icon names: `dashboard`, `inventory_2`, `shopping_cart`, `cloud_upload`, `collections`, `insights`, `group`, `settings`, `person`, `lock`, `notifications`, `palette`, `storefront`, `payments`, `local_shipping`, `verified_user`.

## Standard Page Shell

Every normal admin page should follow this structure:

```jsx
<>
  <PageHeader title="Page Name" buttonLabel="Primary Action" />
  <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-6">
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">
      {/* page content */}
    </div>
  </main>
</>
```

Rules:

- `App.jsx` owns the sidebar. Do not duplicate sidebar navigation inside pages.
- Use `PageHeader` unless the page needs search, notifications, or multiple header actions like `Dashboard.jsx`.
- Custom headers must match the same shell: sticky, `h-20`, `bg-surface/90`, border, blur, and subtle shadow.
- Main content should use `max-w-7xl`, `px-4`, `md:px-8`, and vertical spacing between sections.

## Standard Components

### Card

Use this for repeated sections, metric cards, forms, profile panels, and settings groups:

```jsx
<section className="rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-5 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl">
  {/* content */}
</section>
```

### Toolbar

Use this for search, filter, sort, date range, and view controls:

```jsx
<div className="flex flex-col gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-4 shadow-lg backdrop-blur-xl md:flex-row md:items-center">
  {/* controls */}
</div>
```

### Search Input

```jsx
<label className="group relative w-full md:flex-1">
  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary">
    search
  </span>
  <input
    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low py-3 pl-12 pr-4 text-body-base text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
    placeholder="Search..."
    type="search"
  />
</label>
```

### Primary Button

```jsx
<button className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-title-md text-on-primary shadow-[0_6px_16px_rgba(109,59,215,0.16)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 active:scale-95 sm:px-6">
  <span className="material-symbols-outlined text-[20px]">add</span>
  <span className="hidden sm:inline">Add New</span>
</button>
```

### Secondary Button

```jsx
<button className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-2.5 text-on-surface-variant transition-all hover:bg-primary/5 hover:text-primary">
  <span className="material-symbols-outlined text-[20px]">filter_list</span>
  <span className="font-label-mono text-[10px] uppercase tracking-widest">Filter</span>
</button>
```

### Status Badge

```jsx
<span className="rounded-full bg-primary-container px-2.5 py-1 text-xs font-medium text-on-primary-container">
  Active
</span>
```

Use `error-container` for warnings, `surface-container-high` for neutral statuses, and `primary-container` for positive statuses.

## Layout Patterns

### Metrics Row

Use for dashboard, user profile stats, store health, revenue, or settings summary.

```jsx
<section className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
  {/* metric cards */}
</section>
```

### Main And Side Panel

Use for user detail pages and settings pages.

```jsx
<section className="grid grid-cols-1 gap-gutter xl:grid-cols-12">
  <div className="space-y-6 xl:col-span-8">
    {/* primary content */}
  </div>
  <aside className="space-y-6 xl:col-span-4">
    {/* summary, quick actions, notes */}
  </aside>
</section>
```

### Table

Use for orders, user activity, addresses, staff members, payments, and audit logs.

```jsx
<section className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container/70 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl">
  <div className="border-b border-outline-variant/40 p-5">
    <h3 className="text-xl font-semibold">Table Title</h3>
    <p className="mt-1 text-body-base text-on-surface-variant">Short helpful description.</p>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full min-w-[680px] text-left text-sm">
      {/* table rows */}
    </table>
  </div>
</section>
```

## Forms

Use forms for add product, profile editing, store settings, shipping settings, and security settings.

Form rules:

- Group related fields inside standard cards.
- Keep labels small and clear.
- Use `rounded-xl` inputs.
- Use `bg-surface-container-low` for input backgrounds.
- Put save actions either in `PageHeader` or at the bottom of the form card.
- Use two columns at `md` and above only when fields are short.

Input style:

```jsx
<label className="block">
  <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
    Store name
  </span>
  <input
    className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-body-base text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
    type="text"
  />
</label>
```

## Responsive Rules

- Start with one column.
- Expand at `sm`, `md`, `lg`, or `xl`.
- Use `px-4` on mobile and `md:px-8` on larger screens.
- Hide nonessential text labels on small screens.
- Wrap tables with `overflow-x-auto`.
- Keep cards readable on mobile; do not force dense desktop layouts onto phones.
- Avoid text overlap by using `min-w-0`, `truncate`, and responsive wrapping.

## Navigation System

Sidebar navigation lives in `App.jsx`.

Recommended routes:

```jsx
{ label: "Dashboard", to: "/", icon: "dashboard" }
{ label: "Inventory", to: "/inventory", icon: "inventory_2" }
{ label: "Orders", to: "/orders", icon: "shopping_cart" }
{ label: "Upload Images", to: "/upload-images", icon: "cloud_upload" }
{ label: "Media Gallery", to: "/media-gallery", icon: "collections" }
{ label: "Collections", to: "/collections", icon: "collections" }
{ label: "Analytics", to: "/analytics", icon: "insights" }
{ label: "Customers", to: "/customers", icon: "group" }
{ label: "Users", to: "/users", icon: "person" }
{ label: "Settings", to: "/settings", icon: "settings" }
```

Suggested page files:

- `src/pages/Users.jsx`
- `src/pages/UserDetails.jsx`
- `src/pages/Settings.jsx`
- `src/pages/Orders.jsx`
- `src/pages/Analytics.jsx`
- `src/pages/Customers.jsx`

## User Page Blueprint

Use the User page for admin/staff account management. This is different from Customers, which should represent shoppers.

Recommended route:

- List page: `/users`
- Detail page: `/users/:id`

Recommended header:

```jsx
<PageHeader title="Users" buttonLabel="Invite User" />
```

Recommended sections:

- Summary metrics: total users, active users, pending invites, admin users.
- Toolbar: search by name/email, filter by role, filter by status.
- User table: name, email, role, status, last active, actions.
- Invite panel or modal: email, role, optional message.
- Activity side panel: latest logins, permission changes, password resets.

Useful user roles:

- Owner
- Admin
- Manager
- Editor
- Support
- Viewer

Useful statuses:

- Active
- Pending invite
- Suspended
- Two-factor required

Recommended table columns:

- User
- Role
- Status
- Last active
- Access
- Actions

Visual idea:

- Put the user avatar or initials in a rounded circle.
- Use `primary-container` for Active.
- Use `surface-container-high` for Pending invite.
- Use `error-container` for Suspended.
- Use icon actions: `visibility`, `edit`, `more_vert`.

## User Details Page Blueprint

Recommended header:

```jsx
<PageHeader title="User Profile" buttonLabel="Save Changes" />
```

Recommended layout:

- Left side: profile form, permissions, assigned store areas.
- Right side: avatar card, account status, security summary, quick actions.

Recommended cards:

- Profile Information: name, email, phone, role.
- Permissions: inventory, orders, media, collections, analytics, settings.
- Security: two-factor status, password updated date, active sessions.
- Activity Log: recent login and admin actions.

Good actions:

- Save changes.
- Send password reset.
- Require two-factor authentication.
- Suspend user.

## Settings Page Blueprint

Use Settings as a grouped admin control center. Keep it calm and organized.

Recommended route:

- `/settings`

Recommended header:

```jsx
<PageHeader title="Settings" buttonLabel="Save Changes" />
```

Recommended top summary:

- Store status.
- Payment status.
- Shipping zones.
- Team access.

Recommended settings groups:

- Store Profile: store name, support email, phone, country, timezone.
- Brand Appearance: logo, favicon, accent color preview, storefront name.
- Commerce: currency, tax mode, inventory tracking, low-stock threshold.
- Payments: payment provider status, payout account, test mode toggle.
- Shipping: default shipping method, free shipping threshold, zones.
- Notifications: order emails, low-stock alerts, customer messages.
- Security: two-factor requirement, staff invite rules, session timeout.
- Integrations: analytics, email provider, image storage, webhooks.

Recommended layout:

```jsx
<section className="grid grid-cols-1 gap-gutter xl:grid-cols-12">
  <div className="space-y-6 xl:col-span-8">
    {/* settings forms */}
  </div>
  <aside className="space-y-6 xl:col-span-4">
    {/* status summary and quick links */}
  </aside>
</section>
```

Recommended controls:

- Text inputs for store identity.
- Select menus for currency, timezone, tax mode, and session timeout.
- Toggles for notifications, test mode, and security rules.
- Numeric inputs for low-stock threshold and free shipping minimum.
- File/image picker for logo and favicon.

## Additional Page Ideas

High-priority pages for this frontend:

- Orders page: order queue, statuses, fulfillment actions, payment status.
- Customers page: shopper list, lifetime value, order history, segments.
- Analytics page: sales trends, conversion, average order value, top products.
- Discounts page: coupon codes, automatic discounts, eligibility rules.
- Reviews page: product reviews, moderation, response status.
- Shipping page: shipping zones, carrier rules, delivery estimates.
- Payments page: transactions, refunds, payout status.
- Storefront page: homepage sections, featured products, hero banners.
- Notifications page: email templates and alert preferences.

Best next pages to build:

1. `Users.jsx` because it matches the existing sidebar idea and is useful for admin access.
2. `Settings.jsx` because it gives the store a control center.
3. `Orders.jsx` because the dashboard already links to order management.
4. `Customers.jsx` because it completes the ecommerce admin flow.

## Implementation Checklist

Before building a new page:

1. Inspect `tailwind.config.js`.
2. Inspect a nearby existing page.
3. Use `PageHeader` unless a custom header is needed.
4. Use the standard shell.
5. Reuse the card, toolbar, input, badge, and table patterns above.
6. Add the route in `App.jsx`.
7. Add or update the sidebar item in `App.jsx`.
8. Keep API/state behavior separate from visual markup.
9. Run `npm.cmd run build`.
10. Run `npm.cmd run lint` if the project has a lint script.

## Quick Starter: Users Page

```jsx
import PageHeader from "../components/PageHeader";

function Users() {
  return (
    <>
      <PageHeader title="Users" buttonLabel="Invite User" />
      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-6">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">
          <section className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
            {/* metric cards */}
          </section>

          <section className="rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-4 shadow-lg backdrop-blur-xl">
            {/* search, filter, role controls */}
          </section>

          <section className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container/70 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl">
            {/* users table */}
          </section>
        </div>
      </main>
    </>
  );
}

export default Users;
```

## Quick Starter: Settings Page

```jsx
import PageHeader from "../components/PageHeader";

function Settings() {
  return (
    <>
      <PageHeader title="Settings" buttonLabel="Save Changes" />
      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-6">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">
          <section className="grid grid-cols-1 gap-gutter xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-8">
              {/* store profile, commerce, notifications, security */}
            </div>
            <aside className="space-y-6 xl:col-span-4">
              {/* settings status and quick actions */}
            </aside>
          </section>
        </div>
      </main>
    </>
  );
}

export default Settings;
```
