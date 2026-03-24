import React from 'react';

const MediaRenderer = ({ src, alt, className, onLoad }) => {
  if (!src) return null;

  const isVideo = src.match(/\.(mp4|webm|m4v|mov)$/i);

  if (isVideo) {
    return (
      <video
        src={src}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={onLoad}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt || "Product media"}
      className={className}
      onLoad={onLoad}
      loading="lazy"
    />
  );
};

export default MediaRenderer;
