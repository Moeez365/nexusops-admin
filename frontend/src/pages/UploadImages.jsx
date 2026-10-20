import { useEffect, useState } from "react";
import uploadImages, { getImages } from "../api/image.js";
import { ShimmerImage } from "../components/common";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const INITIAL_IMAGE_LIMIT = 4;

/**
 * UploadImages Component
 *
 * Batch file upload interface with dropzone, upload queue progression, and recent asset gallery.
 */
function UploadImages() {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [uploadMessage, setUploadMessage] = useState("");
  const [cloudImages, setCloudImages] = useState([]);
  const [initialImages, setInitialImages] = useState([]);

  const handleImages = (files) => {
    const selectedImages = Array.from(files || []);
    const invalidFile = selectedImages.find(
      (file) => !file.type.startsWith("image/") || file.size > MAX_FILE_SIZE,
    );

    if (invalidFile) {
      setUploadMessage("Only image files up to 5 MB can be uploaded.");
      return;
    }

    if (images.length + selectedImages.length > MAX_FILES) {
      setUploadMessage(`You can upload at most ${MAX_FILES} images at a time.`);
      return;
    }

    setUploadMessage("");
    setImages((previous) => [...previous, ...selectedImages]);
  };

  const handleUpload = async () => {
    let uploadSucceeded = false;

    try {
      setIsUploading(true);
      setUploadMessage("");
      const result = await uploadImages(images);
      setUploadMessage(result.message);
      // This state intentionally lives only in memory. It lets an admin see
      // completed uploads in the queue, while a browser refresh clears it.
      setCloudImages((previous) => [
        ...(Array.isArray(result.data) ? result.data : []),
        ...previous,
      ]);
      uploadSucceeded = true;
    } catch (error) {
      setUploadMessage(
        error.response?.data?.message ||
          error.message ||
          "Image upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
      if (uploadSucceeded) {
        setImages([]);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleImages(e.dataTransfer.files);
  };

  useEffect(() => {
    let ignoreResult = false;

    const loadImages = async () => {
      try {
        const response = await getImages(INITIAL_IMAGE_LIMIT);

        if (!ignoreResult) {
          setInitialImages(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (!ignoreResult) {
          setIsLoadingImages(false);
        }
      }
    };

    loadImages();

    return () => {
      ignoreResult = true;
    };
  }, []);
  
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-1 flex-col px-4 pb-32 pt-8 text-on-surface md:px-8 md:pt-8">
      <div className="mb-8 flex items-center gap-2 font-label-mono text-label-mono uppercase tracking-widest text-on-surface-variant opacity-60">
        <span>Admin</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span>E-Commerce</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-primary">Media Asset Upload</span>
      </div>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <input
            id="myFile"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImages(e.target.files)}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          />

          <label
            htmlFor="myFile"
            className={`group relative flex min-h-[400px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-8 text-center shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl transition-all ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-primary/20 bg-primary/[0.02]"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="pointer-events-none absolute inset-0 opacity-10" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <span className="material-symbols-outlined text-5xl text-primary">
                  cloud_upload
                </span>
              </div>
              <h2 className="mb-3 font-headline-lg text-headline-lg">
                Drag &amp; Drop Assets
              </h2>
              <p className="mb-8 max-w-full text-body-base text-on-surface-variant">
                Upload high-resolution product images. Support for HEIC, PNG,
                and WebP up to 5 MB. Maximum 10 files per upload.
              </p>
              <span className="rounded-full bg-primary px-6 py-3 font-label-mono text-label-mono uppercase tracking-widest text-on-primary transition-all hover:scale-105 active:scale-95">
                Browse Files
              </span>
            </div>
            <div className="absolute right-4 top-4 flex gap-1">
              <div className="h-8 w-1 rounded-full bg-primary/20" />
              <div className="h-12 w-1 rounded-full bg-primary/40" />
              <div className="h-8 w-1 rounded-full bg-primary/20" />
            </div>
          </label>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="flex items-center gap-2 font-label-mono text-label-mono uppercase tracking-widest text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-primary">
                  pending_actions
                </span>
                Current Queue ({images.length + cloudImages.length})
              </h3>
              <button
                className="rounded-full bg-primary px-4 py-2 font-label-mono text-label-mono uppercase tracking-widest text-on-primary transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleUpload}
                disabled={isUploading || images.length === 0}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>

            {uploadMessage && (
              <div
                className={`rounded-xl border p-3 text-sm ${
                  uploadMessage.toLowerCase().includes("success")
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-error/20 bg-error/10 text-error"
                }`}
              >
                {uploadMessage}
              </div>
            )}

            {isLoadingImages ? (
              <div className="rounded-xl border border-outline-variant/60 bg-surface-container/70 p-4 text-sm text-on-surface-variant">
                Loading uploaded images...
              </div>
            ) : images.length === 0 && cloudImages.length === 0 ? (
              <div className="rounded-xl border border-outline-variant/60 bg-surface-container/70 p-4 text-sm text-on-surface-variant">
                No images added yet.
              </div>
            ) : (
              <>
                {images.map((image, index) => (
                  <div
                    key={`pending-${image.name}-${index}`}
                    className={`flex items-center gap-4 rounded-xl border border-outline-variant/60 bg-surface-container/70 p-4 backdrop-blur-xl ${isUploading && "pointer-events-none cursor-not-allowed"}`}
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container relative">
                      <img
                        className="h-full w-full object-cover"
                        src={URL.createObjectURL(image)}
                        alt={image.name}
                      />
                      {isUploading && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary animate-spin">
                            sync
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="truncate font-label-mono text-label-mono">
                          {image.name}
                        </span>
                        {isUploading ? (
                          <span className="font-label-mono text-label-mono text-on-surface-variant">
                            Processing...
                          </span>
                        ) : (
                          <span className="font-label-mono text-label-mono  text-primary">
                            Ready
                          </span>
                        )}
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-primary/5">
                        <div className="h-full w-full bg-primary" />
                      </div>
                    </div>
                    <button
                      className="p-2 text-on-surface-variant transition-colors hover:text-error"
                      onClick={() =>
                        setImages((prev) => prev.filter((_, i) => i !== index))
                      }
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                ))}

                {cloudImages.map((image, index) => (
                  <div
                    key={image._id || image.publicId || `uploaded-${index}`}
                    className="flex items-center gap-4 rounded-xl border border-outline-variant/60 bg-surface-container/70 p-4 backdrop-blur-xl"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container">
                      <ShimmerImage
                        className="h-full w-full object-cover"
                        src={image.url}
                        alt={image.altText || "Uploaded image"}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate font-label-mono text-label-mono">
                          {image.altText || image.publicId || "Uploaded image"}
                        </span>
                        <span className="shrink-0 font-label-mono text-label-mono text-primary">
                          Uploaded
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-primary/5">
                        <div className="h-full w-full bg-primary" />
                      </div>
                    </div>
                    <span
                      className="material-symbols-outlined p-2 text-primary"
                      title="Uploaded successfully"
                    >
                      check
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="space-y-8 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="font-label-mono text-label-mono uppercase tracking-widest text-on-surface-variant">
              Recently Added
            </h3>
            <div className="flex gap-2">
              <button className="rounded p-2 text-on-surface-variant transition-colors hover:text-primary">
                <span className="material-symbols-outlined text-sm">
                  grid_view
                </span>
              </button>
              {/* <button className="rounded p-2 text-on-surface-variant transition-colors hover:text-primary">
                <span className="material-symbols-outlined text-sm">
                  reorder
                </span>
              </button> */}
            </div>
          </div>

          <div className="grid max-h-[750px] grid-cols-2 gap-4 overflow-y-auto pr-1">
            {initialImages && initialImages.map((asset, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container/70"
              >
                <div className="aspect-square relative">
                  <ShimmerImage
                    className="h-full w-full object-cover"
                    src={asset.url}
                    alt="Asset preview"
                  />
                  {/* {asset.badge && (
                    <div className="absolute left-2 top-2">
                      <span className="rounded-full bg-primary/90 px-2 py-1 text-[10px] font-label-mono uppercase tracking-widest text-on-primary">
                        {asset.badge}
                      </span>
                    </div>
                  )} */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="material-symbols-outlined cursor-pointer text-white hover:text-primary">
                      drag_indicator
                    </span>
                    <div className="flex gap-2">
                      <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-white hover:bg-white/20">
                        <span className="material-symbols-outlined text-sm">
                          visibility
                        </span>
                      </button>
                      <button className="flex h-8 w-8 items-center justify-center rounded-full bg-error/20 text-error hover:bg-error/40">
                        <span className="material-symbols-outlined text-sm">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-xl border border-outline-variant/60 bg-surface-container/70 p-4">
            <div className="flex items-center justify-between font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
              <span>Total Storage</span>
              <span className="text-primary">12.4 GB / 50 GB</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-primary/5">
              <div className="h-full w-[24.8%] bg-primary/40" />
            </div>
            <p className="text-[11px] text-on-surface-variant/50">
              Your library is synced with CDN servers in 12 regions.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default UploadImages;
