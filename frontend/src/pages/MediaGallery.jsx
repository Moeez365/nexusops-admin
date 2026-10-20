import { useEffect, useState } from "react";
import { deleteImage, getImages } from "../api/image";
import PageHeader from "../components/PageHeader";
import ImagePreview from "../components/ImagePreview";
import UploadDialog from "../components/UploadDialog";
import { ConfirmModal, ShimmerImage } from "../components/common";

/**
 * MediaGallery Component
 *
 * Visual digital asset manager for product photography and brand collateral.
 * Features:
 * - Responsive masonry/grid layout with shimmer placeholders
 * - High-res lightbox modal via ImagePreview
 * - Direct upload trigger with UploadDialog
 * - Standardized ConfirmModal for deletion
 */
function MediaGallery() {
  const [assets, setAssets] = useState([]);
  const [limit, setLimit] = useState(12);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let ignore = false;
    async function loadAssets() {
      try {
        setLoading(true);
        const response = await getImages(limit);
        if (!ignore) setAssets(response.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadAssets();
    return () => {
      ignore = true;
    };
  }, [limit]);

  const handleConfirmDelete = async () => {
    if (!assetToDelete?._id || isDeleting) return;

    try {
      setIsDeleting(true);
      setDeleteError("");
      await deleteImage(assetToDelete._id);
      setAssets((prev) =>
        prev.filter((item) => item._id !== assetToDelete._id),
      );
      setAssetToDelete(null);
    } catch (error) {
      setDeleteError(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete image. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Media Gallery"
        buttonLabel="Upload New"
        onButtonClick={() => setIsUploadOpen(true)}
      />
      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-6">
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">
          <section className="grid gap-6 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-7">
              <p className="font-label-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                Asset library
              </p>
              <h3 className="mt-1 font-headline-lg text-2xl tracking-tight md:text-headline-lg">
                Your visual collection
              </h3>
              <p className="mt-2  text-body-base text-on-surface-variant">
                Manage product photography and brand assets from one curated
                library.
              </p>
            </div>
            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-5 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl lg:col-span-5">
              <div className="flex justify-between font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                <span>Storage status</span>
                <span className="text-primary">12.4 GB / 50 GB</span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary/5">
                <div className="h-full w-[24.8%] rounded-full bg-primary shadow-[0_0_10px_rgba(109,59,215,0.35)]" />
              </div>
              <p className="mt-3 text-xs text-on-surface-variant/70">
                24.8% used across 12 CDN regions.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl  border-outline-variant/60 bg-surface-container/70 p-4 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
            <div className="group relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary">
                search
              </span>
              <input
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low py-3 pl-12 pr-4 text-body-base focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Search media assets..."
                type="search"
              />
            </div>
            <div className="flex w-full gap-2 md:w-auto">
              {[
                ["filter_list", "Filter"],
                ["swap_vert", "Sort"],
              ].map(([icon, label]) => (
                <button
                  key={label}
                  className="glass-card flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-on-surface-variant hover:bg-primary/5 md:flex-none"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {icon}
                  </span>
                  <span className="font-label-mono text-[10px] uppercase tracking-wider">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-label-mono text-label-mono uppercase tracking-widest text-on-surface-variant">
                All assets
              </h3>
              <span className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant/60">
                {assets.length} files
              </span>
            </div>
            {loading && assets.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-outline-variant/60 bg-surface-container/70 text-on-surface-variant shadow-[0_16px_45px_rgba(50,35,75,0.10)]">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">
                  progress_activity
                </span>
                <p className="mt-3 font-label-mono text-[10px] uppercase tracking-widest">
                  Loading assets
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {assets.map((asset, index) => (
                  <article
                    key={asset._id || asset.publicId || asset.url || index}
                    className="group overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container/70 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-high">
                      <ShimmerImage
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 motion-reduce:transition-none"
                        src={asset.url}
                        alt={asset.altText || "Media asset"}
                      />
                      {asset.badge && (
                        <span className="absolute left-3 top-3 rounded-full bg-primary/90 px-3 py-1 font-label-mono text-[9px] uppercase tracking-widest text-on-primary">
                          {asset.badge}
                        </span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-inverse-surface/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <ImagePreview
                          src={asset.url}
                          alt={asset.altText || "Media asset"}
                        />
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-primary"
                          type="button"
                          aria-label="Edit asset"
                        >
                          <span className="material-symbols-outlined">
                            edit
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant/60">
                            {asset.type || "Image asset"}
                          </p>
                          <h4 className="mt-1 truncate font-title-md text-title-md group-hover:text-primary">
                            {asset.altText ||
                              asset.publicId ||
                              "Untitled asset"}
                          </h4>
                        </div>
                        <button
                          className="shrink-0 cursor-pointer p-1 text-on-surface-variant transition-colors hover:text-error"
                          type="button"
                          aria-label="Delete asset"
                          onClick={() => {
                            setDeleteError("");
                            setAssetToDelete(asset);
                          }}
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      </div>
                      <div className="flex justify-between font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                        <span>CDN ready</span>
                        <span className="text-primary">
                          {asset.size || "Optimized"}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
                <a
                  href="/upload-images"
                  className="group flex min-h-72 items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/60 bg-primary/[0.02] hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="flex flex-col items-center gap-3 text-center text-on-surface-variant group-hover:text-primary">
                    <span className="material-symbols-outlined text-4xl">
                      cloud_upload
                    </span>
                    <span className="font-title-md text-title-md">
                      Add more assets
                    </span>
                    <span className="font-label-mono text-[9px] uppercase tracking-widest opacity-60">
                      Up to 5 MB per file
                    </span>
                  </div>
                </a>
              </div>
            )}
          </section>

          <div className="flex flex-col items-center gap-4 pb-8 pt-2">
            <p className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant/60">
              Showing {assets.length} media assets
            </p>
            <button
              className="glass-card group flex items-center gap-3 rounded-full px-6 py-3 hover:bg-primary/10 disabled:cursor-wait disabled:opacity-60"
              type="button"
              disabled={loading}
              onClick={() => setLimit((current) => current + 12)}
            >
              <span className="font-label-mono text-label-mono uppercase tracking-[0.2em] group-hover:text-primary">
                {loading ? "Loading" : "Load More"}
              </span>
              <span
                className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : "group-hover:translate-y-1"}`}
              >
                {loading ? "progress_activity" : "expand_more"}
              </span>
            </button>
          </div>
        </div>
      </main>
      <UploadDialog
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={(newAssets) =>
          setAssets((prev) => [...newAssets, ...prev])
        }
      />

      <ConfirmModal
        isOpen={Boolean(assetToDelete)}
        onClose={() => setAssetToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete this image?"
        subtitle="Confirm deletion"
        message="This will permanently delete the image from Cloudinary and your media library."
        itemName={assetToDelete?.altText || assetToDelete?.publicId || "Untitled asset"}
        itemImage={assetToDelete?.url}
        confirmLabel="Delete"
        confirmingLabel="Deleting..."
        isLoading={isDeleting}
        error={deleteError}
        variant="danger"
      />
    </>
  );
}

export default MediaGallery;
