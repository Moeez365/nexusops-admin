import { useEffect, useMemo, useState } from "react";
import { getImages } from "../api/image.js";
import { ShimmerImage } from "./common";

const assetId = (asset) => asset._id || asset.publicId || asset.url;

/**
 * GalleryDialog Component
 *
 * Media selection modal dialog with search filtering, view filtering, and asset picker checkboxes.
 */
function GalleryDialog({ open, onClose, onAdd, productImages }) {
  const [assets, setAssets] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState("all");

  useEffect(() => {
    if (!open) return;
    setSelectedIds(
      Array.isArray(productImages)
        ? productImages.map((img) => img?._id).filter(Boolean)
        : [],
    );
  }, [open, productImages]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);

    setLoading(true);
    getImages(50)
      .then((response) =>
        setAssets(Array.isArray(response?.data) ? response.data : []),
      )
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const filteredAssets = useMemo(() => {
    const search = query.trim().toLowerCase();
    const matchingAssets = search
      ? assets.filter((asset) =>
          (asset.altText || asset.publicId || "image")
            .toLowerCase()
            .includes(search),
        )
      : assets;

    return activeView === "recent"
      ? matchingAssets.slice(0, 8)
      : matchingAssets;
  }, [activeView, assets, query]);

  if (!open) return null;

  const toggleAsset = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [id, ...current],
    );
  };

  const addSelected = () => {
    onAdd(assets.filter((asset) => selectedIds.includes(assetId(asset))));
    setSelectedIds([]);
    setQuery("");
  };

  return (
    <div
      className="fixed inset-y-0 left-0 right-0 z-[100] flex bg-inverse-surface/45 p-3 backdrop-blur-sm sm:p-6 md:left-72"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-dialog-title"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-col overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-[0_24px_70px_rgba(50,35,75,0.18)]">
        <header className="flex shrink-0 items-center justify-between border-b border-outline-variant/60 px-5 py-4 sm:px-7">
          <div>
            <span className="font-label-mono text-[10px] uppercase tracking-[0.24em] text-primary">
              Product Media
            </span>
            <h2
              id="gallery-dialog-title"
              className="mt-1 font-headline-lg text-2xl text-on-surface sm:text-headline-lg"
            >
              Select from gallery
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close gallery"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/60 bg-primary/5 text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flex shrink-0 flex-col gap-4 border-b border-outline-variant/40 bg-surface-container/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="relative w-full sm:max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant/60">
              search
            </span>
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your media library..."
              className="w-full rounded-xl border border-outline-variant/60 bg-surface-container-low py-3 pl-12 pr-4 font-body-base text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <p className="font-label-mono text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">
            {selectedIds.length} selected · {filteredAssets.length} assets
          </p>
          <div className="flex gap-2 lg:hidden">
            {[
              { id: "all", label: "All media" },
              { id: "recent", label: "Recent" },
            ].map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`rounded-full border px-3 py-2 font-label-mono text-[9px] uppercase tracking-wider ${activeView === item.id ? "border-primary/30 bg-primary/10 text-primary" : "border-outline-variant/60 bg-primary/5 text-on-surface-variant"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-60 shrink-0 flex-col border-r border-outline-variant/60 bg-surface-container-low/70 p-4 lg:flex">
            <p className="px-3 pb-3 font-label-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/50">
              Library
            </p>
            <nav className="space-y-1" aria-label="Gallery collections">
              {[
                { id: "all", label: "All media", icon: "grid_view" },
                { id: "recent", label: "Recently added", icon: "schedule" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all ${activeView === item.id ? "border-primary/20 bg-primary/10 text-primary" : "border-transparent text-on-surface-variant hover:bg-primary/5 hover:text-on-surface"}`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span className="font-label-mono text-[10px] uppercase tracking-[0.14em]">
                    {item.label}
                  </span>
                  {item.id === "all" && (
                    <span className="ml-auto rounded-full bg-primary/5 px-2 py-1 text-[9px]">
                      {assets.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-6 border-t border-outline-variant/40 pt-5">
              <p className="px-3 pb-3 font-label-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/50">
                Collections
              </p>
              <div className="space-y-1">
                {["Products", "Campaigns", "Brand assets"].map((label) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-on-surface-variant/70"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      folder
                    </span>
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto rounded-xl border border-outline-variant/60 bg-surface-container p-4">
              <div className="flex items-center justify-between font-label-mono text-[9px] uppercase tracking-wider text-on-surface-variant">
                <span>Storage</span>
                <span className="text-primary">24.8%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/5">
                <div className="h-full w-[24.8%] rounded-full bg-primary shadow-[0_0_8px_rgba(109,59,215,0.4)]" />
              </div>
              <p className="mt-3 text-[10px] text-on-surface-variant/50">
                12.4 GB of 50 GB used
              </p>
            </div>
          </aside>

          <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square animate-pulse rounded-xl border border-outline-variant/40 bg-surface-container"
                  />
                ))}
              </div>
            ) : filteredAssets.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {filteredAssets.map((asset) => {
                  const id = assetId(asset);
                  const selected = selectedIds.includes(id);
                  const title =
                    asset.altText || asset.publicId || "Gallery image";
                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => toggleAsset(id)}
                      aria-pressed={selected}
                      className={`group overflow-hidden rounded-xl border bg-surface-container text-left transition-all ${selected ? "border-primary shadow-[0_0_0_2px_rgba(109,59,215,0.14),0_12px_28px_rgba(50,35,75,0.14)]" : "border-outline-variant/60 hover:border-primary/40 hover:shadow-[0_8px_22px_rgba(50,35,75,0.08)]"}`}
                    >
                      <div className="relative aspect-square overflow-hidden bg-surface-container-high">
                        <ShimmerImage
                          src={asset.url}
                          alt={title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                        />
                        <span
                          className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border transition-all ${selected ? "border-primary bg-primary text-on-primary" : "border-white/30 bg-black/40 text-transparent"}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            check
                          </span>
                        </span>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-10">
                          <p className="truncate text-sm font-medium text-white">
                            {title}
                          </p>
                          <p className="mt-1 font-label-mono text-[9px] uppercase tracking-widest text-white/55">
                            {asset.type || "Uploaded asset"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/60 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
                  image_search
                </span>
                <p className="mt-3 font-title-md text-on-surface">
                  No matching images
                </p>
                <p className="mt-1 text-sm text-on-surface-variant/60">
                  Try a different search term.
                </p>
              </div>
            )}
          </main>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-outline-variant/60 bg-surface-container-lowest/90 px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-3 font-label-mono text-[11px] uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:bg-primary/5 hover:text-on-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedIds.length}
            onClick={addSelected}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-label-mono text-[11px] font-bold uppercase tracking-[0.18em] text-on-primary shadow-[0_0_20px_rgba(109,59,215,0.24)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            <span className="material-symbols-outlined text-[18px]">
              add_photo_alternate
            </span>
            Add {selectedIds.length || ""} selected
          </button>
        </footer>
      </div>
    </div>
  );
}

export default GalleryDialog;
