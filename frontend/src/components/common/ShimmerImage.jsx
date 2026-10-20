import { useState } from "react";
import PropTypes from "prop-types";

/**
 * ShimmerImage component
 *
 * Automatically displays a subtle shimmer loading skeleton until the image finishes loading,
 * then smoothly fades the image in. Also gracefully falls back to an error placeholder if loading fails.
 */
function ShimmerImage({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  fallbackIcon = "broken_image",
  loading = "lazy",
  onLoad,
  onError,
  ...restProps
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    setIsLoaded(true);
    onError?.(e);
  };

  if (!src || hasError) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-surface-container-high text-on-surface-variant/40 ${containerClassName}`}
        title={alt || "Image not available"}
      >
        <span className="material-symbols-outlined text-3xl">
          {fallbackIcon}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${containerClassName}`}>
      {/* Shimmer skeleton shown while image is loading */}
      {!isLoaded && (
        <div
          className="media-image-loading absolute inset-0 z-10"
          aria-hidden="true"
        />
      )}

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-500 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${className}`}
        {...restProps}
      />
    </div>
  );
}

ShimmerImage.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  fallbackIcon: PropTypes.string,
  loading: PropTypes.oneOf(["lazy", "eager"]),
  onLoad: PropTypes.func,
  onError: PropTypes.func,
};

export default ShimmerImage;
