import React, { useEffect } from 'react';

function parseEmbed(raw) {
  if (!raw?.trim()) return null;
  if (/^https?:\/\//.test(raw.trim()) && !raw.includes('<')) {
    const url = raw.trim().replace(/^['"`\s]+|['"`\s]+$/g, '');
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    if (url.includes('instagram.com')) {
      const igPostMatch = url.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[^/?#]+/i);
      if (igPostMatch) return { type: 'iframe', src: `${igPostMatch[0]}/embed/captioned` };
      return { type: 'raw', html: raw };
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
      const safeUrl = url.replace(/"/g, '&quot;');
      const videoId = ttMatch[1];
      return {
        type: 'raw',
        html: `<blockquote class="tiktok-embed" cite="${safeUrl}" data-video-id="${videoId}" style="max-width:605px;min-width:325px;"><section><a target="_blank" href="${safeUrl}">View on TikTok</a></section></blockquote>`
      };
    }
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return { type: 'video', src: url };
    if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) return { type: 'image', src: url };
    return { type: 'iframe', src: url };
  }
  if (/<blockquote[\s>]/i.test(raw) || /<script[\s>]/i.test(raw)) return { type: 'raw', html: raw };
  const iframeMatch = raw.match(/<iframe[^>]*src=["']([^"']+)["']/i);
  if (iframeMatch) return { type: 'iframe', src: iframeMatch[1] };
  const videoMatch = raw.match(/<video[^>]*src=["']([^"']+)["']/i);
  if (videoMatch) return { type: 'video', src: videoMatch[1] };
  const imageMatch = raw.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (imageMatch) return { type: 'image', src: imageMatch[1] };
  return { type: 'raw', html: raw };
}

const MediaRenderer = ({ src, embedCode, mediaType, alt, className, onLoad }) => {
  const parsed = mediaType === 'embed' && embedCode?.trim() ? parseEmbed(embedCode) : null;

  useEffect(() => {
    if (!(mediaType === 'embed' && embedCode && parsed?.type === 'raw')) return;
    if (embedCode.includes('instagram-media') || embedCode.includes('instagram.com/embed.js')) {
      if (!window.instagramEmbedLoaded) {
        window.instagramEmbedLoaded = true;
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
    }
    if (embedCode.includes('tiktok-embed') || embedCode.includes('tiktok.com/embed.js') || /tiktok\.com\/@[^/]+\/video\//i.test(embedCode)) {
      if (!window.tiktokEmbedLoaded) {
        window.tiktokEmbedLoaded = true;
        const existing = document.querySelector('script[src*="tiktok.com/embed.js"]');
        if (!existing) {
          const s = document.createElement('script');
          s.async = true;
          s.src = 'https://www.tiktok.com/embed.js';
          document.body.appendChild(s);
        }
      }
    }
    if (embedCode.includes('twitter-tweet') || embedCode.includes('platform.twitter.com/widgets.js')) {
      if (!window.twitterEmbedLoaded) {
        window.twitterEmbedLoaded = true;
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
    }
    if (embedCode.includes('fb-post') || embedCode.includes('facebook.com/sdk.js')) {
      if (!window.facebookEmbedLoaded) {
        window.facebookEmbedLoaded = true;
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
    }
    if (embedCode.includes('reddit-embed') || embedCode.includes('embed.redditmedia.com')) {
      if (!window.redditEmbedLoaded) {
        window.redditEmbedLoaded = true;
        const existing = document.querySelector('script[src*="embed.redditmedia.com/widgets/platform.js"]');
        if (!existing) {
          const s = document.createElement('script');
          s.async = true;
          s.src = 'https://embed.redditmedia.com/widgets/platform.js';
          document.body.appendChild(s);
        }
      }
    }
  }, [mediaType, embedCode, parsed?.type]);

  if (mediaType === 'embed' && embedCode?.trim()) {
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
