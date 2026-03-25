import React, { useEffect } from 'react';

function parseEmbed(raw) {
  if (!raw?.trim()) return null;
  if (/^https?:\/\//.test(raw.trim()) && !raw.includes('<')) {
    const url = raw.trim();
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    if (url.includes('instagram.com')) {
      const igEmbed = url.replace(/\/$/, '').replace(/(\/p\/|\/reel\/|\/tv\/)/, (m) => `${m}`) + '/embed';
      return { type: 'iframe', src: igEmbed };
    }
    if (url.includes('facebook.com')) {
      const fbEmbed = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true`;
      return { type: 'iframe', src: fbEmbed };
    }
    if (url.includes('twitter.com') || url.includes('x.com')) {
      const twEmbed = `https://twitframe.com/show?url=${encodeURIComponent(url)}`;
      return { type: 'iframe', src: twEmbed };
    }
    const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (ttMatch) {
      const ttEmbed = `https://www.tiktok.com/embed/v2/video/${ttMatch[1]}`;
      return { type: 'iframe', src: ttEmbed };
    }
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
      useEffect(() => {
        if (embedCode.includes('instagram-media') || embedCode.includes('instagram.com/embed.js')) {
          const existing = document.querySelector('script[src*="instagram.com/embed.js"]');
          if (!existing) {
            const s = document.createElement('script');
            s.async = true;
            s.src = 'https://www.instagram.com/embed.js';
            s.onload = () => {
              if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
            };
            document.body.appendChild(s);
          } else {
            if (window.instgrm?.Embeds?.process) window.instgrm.Embeds.process();
          }
        }
        if (embedCode.includes('tiktok-embed') || embedCode.includes('tiktok.com/embed.js')) {
          const existing = document.querySelector('script[src*="tiktok.com/embed.js"]');
          if (!existing) {
            const s = document.createElement('script');
            s.async = true;
            s.src = 'https://www.tiktok.com/embed.js';
            document.body.appendChild(s);
          }
        }
        if (embedCode.includes('twitter-tweet') || embedCode.includes('platform.twitter.com/widgets.js')) {
          const existing = document.querySelector('script[src*="platform.twitter.com/widgets.js"]');
          if (!existing) {
            const s = document.createElement('script');
            s.async = true;
            s.src = 'https://platform.twitter.com/widgets.js';
            s.onload = () => {
              if (window.twttr?.widgets?.load) window.twttr.widgets.load();
            };
            document.body.appendChild(s);
          } else {
            if (window.twttr?.widgets?.load) window.twttr.widgets.load();
          }
        }
        if (embedCode.includes('fb-post') || embedCode.includes('facebook.com/sdk.js')) {
          if (!window.FB) {
            const s = document.createElement('script');
            s.async = true;
            s.defer = true;
            s.crossOrigin = 'anonymous';
            s.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v13.0';
            s.onload = () => {
              if (window.FB?.XFBML?.parse) window.FB.XFBML.parse();
            };
            document.body.appendChild(s);
          } else {
            if (window.FB?.XFBML?.parse) window.FB.XFBML.parse();
          }
        }
        if (embedCode.includes('reddit-embed') || embedCode.includes('embed.redditmedia.com')) {
          const existing = document.querySelector('script[src*="embed.redditmedia.com/widgets/platform.js"]');
          if (!existing) {
            const s = document.createElement('script');
            s.async = true;
            s.src = 'https://embed.redditmedia.com/widgets/platform.js';
            document.body.appendChild(s);
          }
        }
      }, [embedCode]);
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
