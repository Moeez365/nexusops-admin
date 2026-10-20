import { useEffect, useRef, useState } from "react";

function ImagePreview({ src, alt = "Media asset" }) {
  const dialogRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-primary"
        type="button"
        aria-label={`Preview ${alt}`}
        onClick={() => {
          setFailed(false);
          setLoaded(false);
          setOpen(true);
        }}
      >
        <span className="material-symbols-outlined">visibility</span>
      </button>
      <dialog
        ref={dialogRef}
        aria-label={`Image preview: ${alt}`}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className="fixed inset-0 m-auto max-h-none max-w-none overflow-visible border-0 bg-transparent p-4 text-on-surface backdrop:bg-inverse-surface/70 backdrop:backdrop-blur-sm sm:p-6"
      >
        {open && (
          <div className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3 shadow-[0_24px_70px_rgba(50,35,75,0.18)] sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="min-w-0 truncate font-label-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                Image preview
              </p>
              <button
                type="button"
                autoFocus
                aria-label="Close image preview"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary cursor-pointer hover:bg-primary/10"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {failed ? (
              <p role="alert" className="p-8 text-sm text-on-surface-variant">
                This image could not be loaded.
              </p>
            ) : (
              <div className="relative min-h-[160px] min-w-[200px] overflow-hidden rounded-lg bg-surface-container-high">
                <img
                  src={src}
                  alt={alt}
                  onLoad={() => setLoaded(true)}
                  onError={() => setFailed(true)}
                  className={`mx-auto block h-auto max-h-[75dvh] w-auto max-w-[calc(100vw-5rem)] rounded-lg object-contain transition-opacity duration-300 ${
                    loaded ? "opacity-100" : "media-image-loading opacity-0"
                  }`}
                />
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

export default ImagePreview;
