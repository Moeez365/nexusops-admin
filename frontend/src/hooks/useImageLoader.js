import { useCallback, useState } from "react";

/**
 * Custom React hook for tracking image loading status across components.
 * Replaces repetitive loadedImages array boilerplate with an optimized Set-based tracker.
 *
 * @returns {{
 *   loadedImages: Set<string>,
 *   markImageLoaded: (key: string) => void,
 *   isImageLoaded: (key: string) => boolean,
 *   resetLoadedImages: () => void
 * }}
 */
export function useImageLoader() {
  const [loadedKeys, setLoadedKeys] = useState(() => new Set());

  const markImageLoaded = useCallback((key) => {
    if (!key) return;
    setLoadedKeys((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const isImageLoaded = useCallback(
    (key) => {
      return Boolean(key && loadedKeys.has(key));
    },
    [loadedKeys],
  );

  const resetLoadedImages = useCallback(() => {
    setLoadedKeys(new Set());
  }, []);

  return {
    loadedImages: loadedKeys,
    markImageLoaded,
    isImageLoaded,
    resetLoadedImages,
  };
}

export default useImageLoader;
