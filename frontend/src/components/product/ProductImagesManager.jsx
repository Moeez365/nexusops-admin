import { useState, useRef } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { ShimmerImage } from "../common";

/**
 * ProductImagesManager
 *
 * Dedicated image manager component for product forms.
 * Supports:
 * - Primary cover image hero preview
 * - Drag-and-drop thumbnail reordering
 * - Instant promote-to-cover action
 * - Image removal
 * - Direct file upload trigger & Gallery modal trigger
 *
 * @param {Object} props
 * @param {Array<Object>} props.images - Current list of product image objects
 * @param {string} [props.productName] - Product title fallback for image alt tags
 * @param {boolean} [props.isUploading] - Whether an upload network request is in flight
 * @param {(fromIndex: number, toIndex: number) => void} props.onMoveImage - Reorder callback
 * @param {(index: number) => void} props.onRemoveImage - Remove callback
 * @param {(index: number) => void} props.onMakePrimary - Promote index to cover (index 0)
 * @param {() => void} props.onOpenGallery - Opens the media gallery modal
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} props.onFileChange - Handler for file input change
 */
export default function ProductImagesManager({
  images = [],
  productName = "",
  isUploading = false,
  onMoveImage,
  onRemoveImage,
  onMakePrimary,
  onOpenGallery,
  onFileChange,
}) {
  const fileInputRef = useRef(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);

  const handleDragStart = (index, e) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDrop = (targetIndex, e) => {
    e.preventDefault();
    const fromStr = e.dataTransfer.getData("text/plain");
    const from = draggedIndex !== null ? draggedIndex : parseInt(fromStr, 10);
    if (!Number.isNaN(from) && from !== targetIndex && onMoveImage) {
      onMoveImage(from, targetIndex);
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  return (
    <section className="rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-6 shadow-[0_16px_45px_rgba(50,35,75,0.08)] backdrop-blur-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
            <span className="material-symbols-outlined text-[19px]">
              photo_library
            </span>
          </div>
          <div>
            <h2 className="font-title-md text-title-md font-semibold text-on-surface">
              Product Media
            </h2>
            <p className="text-xs text-on-surface-variant">
              Drag images to reorder. First image is the storefront cover.
            </p>
          </div>
        </div>
        {images.length > 0 && (
          <span className="font-label-mono text-xs px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-semibold">
            {images.length} {images.length === 1 ? "image" : "images"}
          </span>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {images.length > 0 ? (
        <DragDropProvider>
          <div className="space-y-3 bg-surface-container/60 p-4 rounded-xl border border-outline-variant/30">
            {/* Primary Cover Image Card (Index 0) */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(0, e)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDragEnter={() => setDropTargetIndex(0)}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget)) return;
                setDropTargetIndex((prev) => (prev === 0 ? null : prev));
              }}
              onDrop={(e) => handleDrop(0, e)}
              className={`group/cover relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-dashed transition-all duration-200 cursor-grab active:cursor-grabbing ${
                dropTargetIndex === 0
                  ? "border-primary ring-2 ring-primary ring-offset-2 scale-[0.99] shadow-xl bg-primary/10"
                  : "border-primary/30 bg-surface-container-high"
              } ${draggedIndex === 0 ? "opacity-40 scale-[0.98]" : ""}`}
            >
              <ShimmerImage
                src={images[0].url}
                className="h-full w-full rounded-xl object-cover pointer-events-none select-none"
                alt={images[0].altText || productName || "Product cover preview"}
              />

              {/* Cover Badge */}
              <span className="absolute left-3 top-3 z-10 rounded-full bg-surface-container-lowest/90 px-2.5 py-1 font-label-mono text-[9px] font-semibold uppercase tracking-widest text-primary backdrop-blur-md pointer-events-none">
                Cover Image
              </span>

              {/* Drag Indicator */}
              <span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-surface-container-lowest/90 px-2.5 py-1 font-label-mono text-[9px] uppercase tracking-wider text-on-surface-variant backdrop-blur-md opacity-80 transition-opacity group-hover/cover:opacity-100 pointer-events-none">
                <span className="material-symbols-outlined text-[13px]">
                  drag_indicator
                </span>
                <span>Drag to reorder</span>
              </span>

              {isUploading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/45 text-white backdrop-blur-[2px]">
                  <span className="material-symbols-outlined animate-spin text-4xl">
                    progress_activity
                  </span>
                  <span className="text-sm font-semibold">
                    Uploading images...
                  </span>
                </div>
              )}

              {!isUploading && (
                <div
                  draggable={false}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/55 p-4 text-white opacity-0 transition-opacity group-hover/cover:opacity-100"
                >
                  <span className="material-symbols-outlined text-3xl">edit</span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      draggable={false}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="cursor-pointer rounded-lg bg-primary px-3.5 py-2 font-label-md text-xs text-on-primary shadow-sm hover:bg-primary/90 transition-colors"
                    >
                      Add / Change
                    </button>
                    <button
                      type="button"
                      draggable={false}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenGallery?.();
                      }}
                      className="cursor-pointer flex items-center gap-1 rounded-lg border border-white/40 bg-white/20 px-3 py-2 font-label-md text-xs text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        photo_library
                      </span>
                      Gallery
                    </button>
                  </div>
                  <button
                    type="button"
                    draggable={false}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage?.(0);
                    }}
                    className="cursor-pointer flex items-center gap-1 rounded-md bg-error px-3 py-1.5 text-xs font-medium text-on-error hover:bg-error/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      delete
                    </span>
                    Remove Cover
                  </button>
                </div>
              )}
            </div>

            {/* Secondary Thumbnails Grid (Indices 1..n) */}
            <div className="grid grid-cols-3 gap-3">
              {images.slice(1).map((image, index) => {
                const realIndex = index + 1;
                const imgKey =
                  image._id ||
                  image._tempId ||
                  image.publicId ||
                  image.url ||
                  realIndex;
                const isBeingDragged = draggedIndex === realIndex;
                const isDropTarget = dropTargetIndex === realIndex;

                return (
                  <div
                    key={imgKey}
                    draggable
                    onDragStart={(e) => handleDragStart(realIndex, e)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDragEnter={() => setDropTargetIndex(realIndex)}
                    onDragLeave={(e) => {
                      if (e.currentTarget.contains(e.relatedTarget)) return;
                      setDropTargetIndex((prev) =>
                        prev === realIndex ? null : prev,
                      );
                    }}
                    onDrop={(e) => handleDrop(realIndex, e)}
                    className={`group/thumb relative aspect-square overflow-hidden rounded-lg border border-dashed transition-all duration-200 cursor-grab active:cursor-grabbing ${
                      isDropTarget
                        ? "border-primary ring-2 ring-primary ring-offset-2 scale-95 shadow-lg bg-primary/15"
                        : "border-outline-variant/80 bg-surface-container-high"
                    } ${isBeingDragged ? "opacity-30 scale-90" : ""}`}
                  >
                    <ShimmerImage
                      src={image.url}
                      alt={image.altText || `Product image ${realIndex + 1}`}
                      className="h-full w-full object-cover pointer-events-none select-none"
                    />

                    {/* Position indicator */}
                    <span className="absolute bottom-1.5 left-1.5 z-10 rounded bg-black/60 px-1.5 py-0.5 font-label-mono text-[8px] font-semibold text-white backdrop-blur-sm pointer-events-none">
                      #{realIndex + 1}
                    </span>

                    {/* Drag handle icon */}
                    <span className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white/80 opacity-0 transition-opacity group-hover/thumb:opacity-100 pointer-events-none">
                      <span className="material-symbols-outlined text-[13px]">
                        drag_indicator
                      </span>
                    </span>

                    {/* Hover actions */}
                    <div
                      draggable={false}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-black/60 p-1 opacity-0 transition-opacity group-hover/thumb:opacity-100"
                    >
                      <button
                        type="button"
                        draggable={false}
                        title="Make Primary Cover"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMakePrimary?.(realIndex);
                        }}
                        className="cursor-pointer flex items-center gap-1 rounded bg-white/25 px-2 py-1 font-label-mono text-[9px] uppercase tracking-wider text-white backdrop-blur-sm hover:bg-primary hover:text-on-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          star
                        </span>
                        Cover
                      </button>
                      <button
                        type="button"
                        draggable={false}
                        title="Remove Image"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveImage?.(realIndex);
                        }}
                        className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-full bg-error/90 text-on-error hover:bg-error transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={onOpenGallery}
                className="cursor-pointer flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed border-outline-variant/80 bg-surface-container-low text-primary hover:bg-primary/5 transition-colors"
                title="Add from Media Gallery"
              >
                <span className="material-symbols-outlined text-3xl">add</span>
              </button>
            </div>
          </div>
        </DragDropProvider>
      ) : (
        /* Empty State Dropzone */
        <div className="relative aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-8 group transition-all overflow-hidden border-outline-variant/50 bg-surface-container-low/30 hover:border-primary/50 hover:bg-primary/5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-4xl">
              cloud_upload
            </span>
          </div>
          <p className="font-label-md text-on-surface mb-1">
            Add Product Images
          </p>
          <p className="text-label-sm text-on-surface-variant">
            PNG, JPG, or WebP
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-lg bg-primary px-4 py-2 font-label-md text-xs text-on-primary shadow-sm hover:bg-primary/90 transition-colors"
            >
              Browse Files
            </button>
            <button
              type="button"
              onClick={onOpenGallery}
              className="cursor-pointer flex items-center gap-1 rounded-lg border border-outline-variant/60 bg-white/50 px-3.5 py-2 font-label-md text-xs text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-sm">
                photo_library
              </span>
              Gallery
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

