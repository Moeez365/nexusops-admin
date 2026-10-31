import { useEffect, useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import AddProduct from "./pages/AddProduct";
import Inventory from "./pages/Inventory";
import MediaGallery from "./pages/MediaGallery";
import Collection from "./pages/Collection";
import AddCollection from "./pages/AddCollection";
import Orders from "./pages/Orders";
import CreateOrder from "./pages/CreateOrder";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import Customers from "./pages/Customers";
import NexaOpsLogo from "./components/NexaOpsLogo";
import {
  NAV_ITEMS,
  DESKTOP_NAV_STORAGE_KEY,
  LEGACY_NAV_STORAGE_KEY,
} from "./constants/navigation";

function App() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
    try {
      const stored =
        localStorage.getItem(DESKTOP_NAV_STORAGE_KEY) ??
        localStorage.getItem(LEGACY_NAV_STORAGE_KEY);
      return stored === "true";
    } catch {
      return false;
    }
  });

  const toggleDesktopNav = () => {
    setIsDesktopCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(DESKTOP_NAV_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    const openMobileNav = () => setIsMobileNavOpen(true);
    const toggleDesktop = () => toggleDesktopNav();

    window.addEventListener("open-mobile-navigation", openMobileNav);
    window.addEventListener("toggle-desktop-navigation", toggleDesktop);
    return () => {
      window.removeEventListener("open-mobile-navigation", openMobileNav);
      window.removeEventListener("toggle-desktop-navigation", toggleDesktop);
    };
  }, []);

  const renderNavLink = (
    item,
    animationIndex = undefined,
    isCollapsed = false,
    onNavigate = undefined,
  ) => {
    if (isCollapsed) {
      return (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.to === "/"}
          title={item.label}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 hover:bg-primary/10 hover:text-primary ${
              isActive
                ? "bg-primary text-on-primary shadow-[0_4px_14px_rgba(109,59,215,0.28)]"
                : "text-on-surface-variant"
            }`
          }
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">
            {item.icon}
          </span>
          <span className="pointer-events-none absolute left-full ml-3 z-[70] hidden whitespace-nowrap rounded-lg border border-outline-variant/60 bg-surface-container-highest px-2.5 py-1 font-label-mono text-[10px] uppercase tracking-wider text-on-surface shadow-lg group-hover:block">
            {item.label}
          </span>
        </NavLink>
      );
    }

    return (
      <NavLink
        key={item.label}
        to={item.to}
        end={item.to === "/"}
        onClick={onNavigate}
        style={
          animationIndex === undefined
            ? undefined
            : { animationDelay: `${animationIndex * 34 + 90}ms` }
        }
        className={({ isActive }) =>
          `group relative flex items-center rounded-lg px-4 py-2 transition-all duration-300 hover:bg-primary/5 hover:text-primary ${
            animationIndex === undefined ? "" : "mobile-nav-link"
          } ${
            isActive
              ? "border-r-2 border-primary bg-primary/5 text-primary"
              : "text-on-surface-variant"
          }`
        }
      >
        <span className="material-symbols-outlined mr-4 transition-transform group-hover:scale-110">
          {item.icon}
        </span>
        <span className="font-label-mono text-label-mono uppercase tracking-widest">
          {item.label}
        </span>
      </NavLink>
    );
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-on-surface">
        <div className="flex min-h-screen flex-col md:flex-row">
          {isMobileNavOpen && (
            <div className="fixed inset-0 z-[60] md:hidden">
              <button
                className="mobile-nav-backdrop absolute inset-0 bg-inverse-surface/35 backdrop-blur-sm"
                type="button"
                aria-label="Close navigation"
                onClick={() => setIsMobileNavOpen(false)}
              />
              <aside className="mobile-nav-panel absolute left-0 top-0 flex h-full w-80 max-w-[86vw] flex-col border-r border-outline-variant/40 bg-surface-container-lowest/95 px-4 py-5 shadow-[0_24px_70px_rgba(50,35,75,0.22)] backdrop-blur-2xl">
                <div className="mobile-nav-brand mb-6 flex items-center justify-between">
                  <Link
                    to="/"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="inline-flex items-center"
                  >
                    <NexaOpsLogo size="md" />
                  </Link>
                  <button
                    className="rounded-full p-2 text-on-surface-variant transition-all hover:bg-primary/5 hover:text-primary active:scale-95"
                    type="button"
                    aria-label="Close navigation"
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto">
                  {NAV_ITEMS.map((item, index) =>
                    renderNavLink(
                      item,
                      index,
                      false,
                      () => setIsMobileNavOpen(false),
                    ),
                  )}
                </nav>

                <div className="mt-4 flex items-center justify-between border-t border-outline-variant/40 pt-4">
                  <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60">
                    NexaOps Admin v1.0.4
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-label-mono text-[9px] uppercase tracking-widest text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Secured
                  </span>
                </div>
              </aside>
            </div>
          )}
          <div
            className={`hidden shrink-0 transition-[width] duration-300 ease-in-out md:block ${
              isDesktopCollapsed ? "w-20" : "w-72"
            }`}
          />
          <aside
            className={`fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-outline-variant/40 bg-surface-container-lowest/90 py-6 backdrop-blur-2xl transition-[width,padding] duration-300 ease-in-out md:flex ${
              isDesktopCollapsed ? "w-20 px-2.5 items-center" : "w-72 px-4"
            }`}
          >
            {isDesktopCollapsed ? (
              <div className="mb-6 flex flex-col items-center gap-3">
                <Link to="/" title="NexaOps Admin" className="flex justify-center">
                  <NexaOpsLogo size="sm" showText={false} />
                </Link>
                <button
                  type="button"
                  onClick={toggleDesktopNav}
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-outline-variant/40 text-on-surface-variant transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    menu
                  </span>
                </button>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-outline-variant/60 bg-surface-container-high"
                  title="NexaOps Admin · Operations Console"
                >
                  <img
                    className="h-full w-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1CCh3L_4fxaMQP_SjCCOWhCoeuW4uNZjofWLrDFO5cLDc_b3HrWBYyML-9cNyGVCDuBrFNyO-JPKM0PHkhLMA0SmeBLokox0Zp840I_aBH1XwDA69EdHLFaJqbRhjTqMJUYdMBhSD5kyyvBoWyQRHJlCfIm1dxys6kEt_hwsAz40FWUjLjvzNxmTrGwL_Im2kIQ9z2AOTaoDlKzPDVhw6EgoT8zR_x_-7QoOwHg7wPhkojGZHKPP_WaWYHJGWXX0DURq1zJzyyNAo"
                    alt="NexaOps Admin"
                  />
                </div>
              </div>
            ) : (
              <div className="mb-6 flex flex-col">
                <div className="flex items-center justify-between px-1">
                  <Link to="/" className="inline-flex items-center">
                    <NexaOpsLogo size="lg" />
                  </Link>
                  <button
                    type="button"
                    onClick={toggleDesktopNav}
                    aria-label="Collapse sidebar"
                    title="Collapse sidebar (icons only)"
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-outline-variant/40 text-on-surface-variant transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      menu_open
                    </span>
                  </button>
                </div>
                <div className="mt-5 flex items-center rounded-xl border border-outline-variant/40 bg-surface-container/60 p-2.5 transition-colors hover:bg-primary/5">
                  <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-outline-variant/60 bg-surface-container-high">
                    <img
                      className="h-full w-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1CCh3L_4fxaMQP_SjCCOWhCoeuW4uNZjofWLrDFO5cLDc_b3HrWBYyML-9cNyGVCDuBrFNyO-JPKM0PHkhLMA0SmeBLokox0Zp840I_aBH1XwDA69EdHLFaJqbRhjTqMJUYdMBhSD5kyyvBoWyQRHJlCfIm1dxys6kEt_hwsAz40FWUjLjvzNxmTrGwL_Im2kIQ9z2AOTaoDlKzPDVhw6EgoT8zR_x_-7QoOwHg7wPhkojGZHKPP_WaWYHJGWXX0DURq1zJzyyNAo"
                      alt="NexaOps Admin"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-title-md text-xs leading-tight text-on-surface">
                      NexaOps Admin
                    </p>
                    <p className="truncate font-label-mono text-[9px] uppercase tracking-widest text-on-surface-variant">
                      Operations Console
                    </p>
                  </div>
                </div>
              </div>
            )}

            <nav
              className={`flex-1 space-y-1.5 ${
                isDesktopCollapsed
                  ? "flex w-full flex-col items-center overflow-visible"
                  : "w-full overflow-y-auto no-scrollbar"
              }`}
            >
              {NAV_ITEMS.map((item) =>
                renderNavLink(item, undefined, isDesktopCollapsed),
              )}
            </nav>

            <div
              className={`border-t border-outline-variant/40 pt-4 ${
                isDesktopCollapsed
                  ? "flex w-full items-center justify-center"
                  : "flex w-full items-center justify-between"
              }`}
            >
              {isDesktopCollapsed ? (
                <span
                  className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-primary/20"
                  title="NexaOps Admin v1.0.4 · Secured"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                </span>
              ) : (
                <>
                  <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60">
                    NexaOps Admin v1.0.4
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-label-mono text-[9px] uppercase tracking-widest text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Secured
                  </span>
                </>
              )}
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/about" element={<About />} />
              <Route path="/orders">
                <Route index element={<Orders />} />
                <Route path="create-order" element={<CreateOrder />} />
              </Route>
              <Route path="/settings" element={<Settings />} />
              <Route path="/inventory">
                <Route index element={<Inventory />} />
                <Route path="add-product" element={<AddProduct />} />
              </Route>
              <Route path="/media-gallery" element={<MediaGallery />} />
              <Route path="/collections">
                <Route index element={<Collection />} />
                <Route path="add-collection" element={<AddCollection />} />
              </Route>
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;