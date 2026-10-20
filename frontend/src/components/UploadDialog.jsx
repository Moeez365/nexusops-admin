import { useEffect, useMemo, useState } from "react";
import uploadImages from "../api/image.js";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadDialog({ open, onClose, onUploaded }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previews]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isUploading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, isUploading]);

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setIsDragging(false);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const addFiles = (fileList) => {
    const selected = Array.from(fileList || []);
    if (!selected.length) return;

    const invalid = selected.find(
      (file) => !file.type.startsWith("image/") || file.size > MAX_FILE_SIZE,
    );
    if (invalid) {
      setError("Only image files up to 5 MB can be uploaded.");
      return;
    }

    if (files.length + selected.length > MAX_FILES) {
      setError(`You can upload at most ${MAX_FILES} images at a time.`);
      return;
    }

    setError("");
    setFiles((prev) => [...prev, ...selected]);
  };

  const handleFileChange = (event) => {
    addFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (!isUploading) {
      addFiles(event.dataTransfer.files);
    }
  };

  const handleUpload = async () => {
    if (!files.length || isUploading) return;

    try {
      setIsUploading(true);
      setError("");
      const result = await uploadImages(files);
      if (onUploaded && Array.isArray(result?.data)) {
        onUploaded(result.data);
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Image upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-dialog-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isUploading) onClose();
      }}
    >
      <div className="mx-auto flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-[0_24px_70px_rgba(50,35,75,0.18)]">
        <header className="flex shrink-0 items-center justify-between border-b border-outline-variant/60 px-5 py-4 sm:px-7">
          <div>
            <span className="font-label-mono text-[10px] uppercase tracking-[0.24em] text-primary">
              Asset Library
            </span>
            <h2
              id="upload-dialog-title"
              className="mt-1 font-headline-lg text-2xl text-on-surface sm:text-headline-lg"
            >
              Upload new media
            </h2>
          </div>
          <button
            type="button"
            disabled={isUploading}
            onClick={onClose}
            aria-label="Close upload dialog"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-outline-variant/60 bg-primary/5 text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7">
          <label
            onDragOver={(event) => {
              event.preventDefault();
              if (!isUploading) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-outline-variant/60 bg-primary/[0.02] hover:border-primary/50 hover:bg-primary/5"
            } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              disabled={isUploading}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-primary transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-3xl">
                cloud_upload
              </span>
            </div>
            <p className="mt-4 font-title-md text-title-md text-on-surface">
              Drag &amp; drop assets or browse
            </p>
            <p className="mt-1 text-body-base text-on-surface-variant">
              Supports PNG, JPG, and WebP up to 5 MB per file (max {MAX_FILES}{" "}
              files).
            </p>
            <span className="mt-5 rounded-full bg-primary px-5 py-2 font-label-mono text-[10px] uppercase tracking-widest text-on-primary shadow-[0_6px_16px_rgba(109,59,215,0.16)] transition-all group-hover:bg-primary/90">
              Select Files
            </span>
          </label>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-error/20 bg-error-container px-4 py-3 text-xs font-medium text-on-error-container"
            >
              <span className="material-symbols-outlined text-[18px] text-error">
                error
              </span>
              <span>{error}</span>
            </div>
          )}

          {previews.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                  Selected queue ({previews.length}/{MAX_FILES})
                </p>
                <span className="rounded-full bg-primary-container px-2.5 py-1 text-xs font-medium text-on-primary-container">
                  {isUploading ? "Uploading" : "Ready"}
                </span>
              </div>

              <ul className="max-h-52 space-y-2.5 overflow-y-auto pr-1">
                {previews.map(({ file, url }, index) => (
                  <li
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="flex items-center gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-3 backdrop-blur-xl"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-high">
                      <img
                        src={url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-mono text-label-mono text-on-surface">
                        {file.name}
                      </p>
                      <p className="mt-1 font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, i) => i !== index))
                      }
                      aria-label={`Remove ${file.name}`}
                      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-error disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        close
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-outline-variant/60 bg-surface-container-lowest/90 px-5 py-4 sm:px-7">
          <button
            type="button"
            disabled={isUploading}
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-2.5 font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant transition-all hover:bg-primary/5 hover:text-primary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!files.length || isUploading}
            onClick={handleUpload}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-title-md text-on-primary shadow-[0_6px_16px_rgba(109,59,215,0.16)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <span
              className={`material-symbols-outlined text-[20px] ${isUploading ? "animate-spin" : ""}`}
            >
              {isUploading ? "progress_activity" : "cloud_upload"}
            </span>
            <span>
              {isUploading
                ? "Uploading..."
                : `Upload${files.length ? ` (${files.length})` : ""}`}
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
}

export default UploadDialog;
