/**
 * Production API Configuration & Client Helper
 * Configures the backend API URL for GitHub Pages / decoupled frontend deployments.
 *
 * In GitHub Pages deployment:
 *   Set VITE_API_BASE_URL in your build environment (e.g. https://api.yourdomain.com)
 * In Full-Stack / Local Dev:
 *   Defaults to empty string '' (relative URLs to same origin).
 *
 * NEVER put private API secrets in VITE_* environment variables.
 */

export function getApiBaseUrl(): string {
  // Vite replaces import.meta.env.VITE_API_BASE_URL statically at build time
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_API_BASE_URL as string | undefined) : undefined;
  if (envUrl && typeof envUrl === 'string') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
}

export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

export interface ApiFetchOptions extends RequestInit {
  authToken?: string;
  guestId?: string;
}

/**
 * Standardized authenticated fetch helper for frontend components.
 * Automatically attaches Authorization Bearer token or X-Guest-Session,
 * constructs full backend URL, and enforces standard JSON headers.
 */
export async function apiFetch(endpoint: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { authToken, guestId, headers: customHeaders, ...restOptions } = options;
  const url = getApiUrl(endpoint);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  } else if (guestId) {
    headers['X-Guest-Session'] = guestId;
  } else {
    // Check localStorage for existing guest session ID if available
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedGuest = localStorage.getItem('leadpulse_guest_id');
        if (storedGuest) {
          headers['X-Guest-Session'] = storedGuest;
        }
      }
    } catch {
      // Ignore localStorage access restrictions
    }
  }

  // Merge any custom headers
  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, customHeaders);
    }
  }

  return fetch(url, {
    ...restOptions,
    headers,
  });
}
