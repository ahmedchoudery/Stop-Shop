import React from 'react';

function parseEmbed(raw) {
  if (!raw?.trim()) return null;
  if (/^https?:\/\//.test(raw.trim()) && !raw.includes('<')) {
    const url = raw.trim();
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return { type: 'video', src: url };
    if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) return { type: 'image', src: url };
    return { type: 'iframe', src: url };
  }
  const srcMatch = raw.match(/src=["']([^"']+)["']/i);
  if (srcMatch) {
    const s = srcMatch[1];
    if (/\.(mp4|webm|ogg)/i.test(s)) return { type: 'video', src: s };
    return { type: 'iframe', src: s };
  }
  return { type: 'raw', html: raw };
}

const MediaRenderer = ({ src, embedCode, mediaType, alt, className, onLoad }) => {
  if (mediaType === 'embed' && embedCode?.trim()) {
    const parsed = parseEmbed(embedCode);
    if (!parsed) return null;
    if (parsed.type === 'iframe') {
      return (
        <iframe
          src={parsed.src}
          className={className}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={alt || 'Embedded media'}
        />
      );
    }
    if (parsed.type === 'video') {
      return (
        <video
          src={parsed.src}
          className={className}
          controls
          playsInline
          onLoadedData={onLoad}
        />
      );
    }
    if (parsed.type === 'image') {
      return (
        <img
          src={parsed.src}
          alt={alt || 'Embedded image'}
          className={className}
          onLoad={onLoad}
          loading="lazy"
        />
      );
    }
    if (parsed.type === 'raw') {
      return (
        <div
          className={className}
          dangerouslySetInnerHTML={{ __html: parsed.html }}
        />
      );
    }
    return null;
  }

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
