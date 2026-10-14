/* ════════════════════════════════════════════════════════════
   CEMS CENTRAL API & MEDIA CONFIGURATION
   Supports local dev, mobile phone access on LAN, and production.
   ════════════════════════════════════════════════════════════ */

// In development, API_BASE and MEDIA_BASE are empty strings so requests
// route through Vite's local dev server proxy (/api and /media).
// This guarantees phone access at http://<phone-ip>:5173 works seamlessly
// without hardcoded 127.0.0.1 or localhost issues.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || "";

/**
 * Normalizes any relative or absolute media path (e.g. profile photos, ID cards).
 * Replaces hardcoded 127.0.0.1 / localhost with the correct accessible origin.
 */
export function resolveMediaUrl(url) {
  if (!url) return "";
  if (typeof url !== "string") return url;

  // Replace obsolete hardcoded local backend hosts with current relative /media
  if (url.includes("127.0.0.1:8000") || url.includes("localhost:8000")) {
    const cleanPath = url.replace(/^https?:\/\/(127\.0\.0\.1|localhost):8000/, "");
    return `${MEDIA_BASE_URL}${cleanPath}`;
  }

  // Already fully qualified external URL (Cloudinary, S3, etc.)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Relative path starting with /
  if (url.startsWith("/")) {
    return `${MEDIA_BASE_URL}${url}`;
  }

  return `${MEDIA_BASE_URL}/${url}`;
}

export function getApiUrl(endpoint) {
  if (!endpoint) return "";
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}
