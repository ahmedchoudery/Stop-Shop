/**
 * @fileoverview getSocialOgImage.js — Utility to generate 1200x630 OpenGraph social preview image URLs
 */

const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://stop-shop-gamma.vercel.app';
const DEFAULT_FALLBACK_OG = `${DEFAULT_SITE_URL}/og-image.jpg`;

export function getSocialOgImage(src, fallback = DEFAULT_FALLBACK_OG) {
  if (!src || typeof src !== 'string') return fallback;

  // Make relative URLs absolute
  let url = src;
  if (url.startsWith('/')) {
    url = `${DEFAULT_SITE_URL}${url}`;
  }

  if (!url.startsWith('http')) {
    return fallback;
  }

  // Cloudinary 1200x630 fill transformation for Social Cards
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    const [base, rest] = url.split('/upload/');
    const parts = rest.split('/');

    // Remove existing transformation segment if present
    if (parts[0].includes(',') || /^[a-z]_[a-z0-9_]+$/i.test(parts[0]) || parts[0] === 'f_auto' || parts[0] === 'q_auto') {
      parts.shift();
    }

    const params = ['c_fill', 'w_1200', 'h_630', 'f_auto', 'q_auto'];
    return `${base}/upload/${params.join(',')}/${parts.join('/')}`;
  }

  return url;
}

export default getSocialOgImage;
