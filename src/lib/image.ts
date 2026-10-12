/**
 * Optimizes image URLs for fast web delivery.
 * For Supabase Storage URLs, converts them to WebP thumbnails with explicit width
 * and caching via free CDN proxy.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  width = 400,
  quality = 80
): string | undefined {
  if (!url) return undefined;

  // If it is a Supabase storage URL, serve via global Cloudflare-cached resizer wsrv.nl
  if (url.includes(".supabase.co/storage/v1/object/public/")) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&q=${quality}&output=webp`;
  }

  return url;
}
