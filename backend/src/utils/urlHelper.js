/**
 * URL and Environment Resolution Helper
 *
 * Ensures consistent frontend and backend URL resolution across:
 * - Local development (npm run dev)
 * - AWS Production (S3 frontend / EC2 backend)
 */

const LOCAL_FRONTEND_URL = 'http://localhost:5173';
const PROD_FRONTEND_URL = 'http://careerforge-frontend-2026.s3-website-ap-southeast-2.amazonaws.com';
const LOCAL_BACKEND_URL = 'http://localhost:5000';

/**
 * Checks if current environment is production.
 * Inspects NODE_ENV, APP_ENV, configured URLs, or incoming request headers.
 */
const isProductionEnv = (req = null) => {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  const appEnv = (process.env.APP_ENV || '').toLowerCase();
  if (nodeEnv === 'production' || appEnv === 'production') {
    return true;
  }

  // If CLIENT_URL or FRONTEND_URL is explicitly set to production / non-localhost
  const clientUrl = (process.env.CLIENT_URL || process.env.FRONTEND_URL || '').trim();
  if (clientUrl && !isLocalhostUrl(clientUrl)) {
    return true;
  }

  // If BACKEND_URL is explicitly set to non-localhost (e.g. EC2 IP or domain)
  const backendUrl = (process.env.BACKEND_URL || '').trim();
  if (backendUrl && !isLocalhostUrl(backendUrl)) {
    return true;
  }

  // If GOOGLE_CALLBACK_URL is explicitly set to non-localhost
  const googleCallbackUrl = (process.env.GOOGLE_CALLBACK_URL || '').trim();
  if (googleCallbackUrl && !isLocalhostUrl(googleCallbackUrl)) {
    return true;
  }

  // If req is provided, inspect host, origin, and referer headers
  if (req) {
    if (typeof req.get === 'function') {
      const host = req.get('host');
      if (host && !isLocalhostUrl(host)) return true;
    }
    const origin = req.headers?.origin;
    if (origin && !isLocalhostUrl(origin)) return true;
    const referer = req.headers?.referer;
    if (referer && !isLocalhostUrl(referer)) return true;
  }

  return false;
};

/**
 * Checks if a given URL points to a local/loopback address.
 */
const isLocalhostUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('localhost') || url.includes('127.0.0.1');
};

/**
 * Resolves the frontend URL based on environment, request context, and configuration.
 * - If req is provided and contains a non-localhost origin/referer, uses that origin.
 * - In production: uses CLIENT_URL / FRONTEND_URL if set to a non-localhost URL;
 *   otherwise defaults to PROD_FRONTEND_URL (never localhost in production).
 * - In local development: uses CLIENT_URL / FRONTEND_URL if configured;
 *   otherwise defaults to LOCAL_FRONTEND_URL.
 */
const getFrontendUrl = (req = null) => {
  const isProd = isProductionEnv(req);
  const configured = (process.env.CLIENT_URL || process.env.FRONTEND_URL || '').trim();

  // If req contains an origin or referer pointing to a non-localhost host
  if (req) {
    const origin = req.headers?.origin;
    if (origin) {
      if (!isLocalhostUrl(origin)) {
        return origin.replace(/\/$/, '');
      }
      if (!isProd) {
        return origin.replace(/\/$/, '');
      }
    }
    const referer = req.headers?.referer;
    if (referer) {
      try {
        const refOrigin = new URL(referer).origin;
        if (!isLocalhostUrl(refOrigin)) {
          return refOrigin.replace(/\/$/, '');
        }
        if (!isProd) {
          return refOrigin.replace(/\/$/, '');
        }
      } catch (_) {}
    }
  }

  if (isProd) {
    if (configured && !isLocalhostUrl(configured)) {
      return configured.replace(/\/$/, '');
    }
    return PROD_FRONTEND_URL;
  }

  // Local development
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return LOCAL_FRONTEND_URL;
};

/**
 * Resolves the backend URL (for API callbacks, document verification links in emails, etc.).
 * - If BACKEND_URL is set and not localhost in production, uses that.
 * - If req is provided and host is non-localhost, dynamically uses the request host.
 * - In production, defaults to configured BACKEND_URL or request host.
 * - In local development, defaults to configured BACKEND_URL or LOCAL_BACKEND_URL.
 */
const getBackendUrl = (req = null) => {
  const isProd = isProductionEnv();
  const configured = (process.env.BACKEND_URL || '').trim();

  // If BACKEND_URL is explicitly set to a production host (not localhost)
  if (configured && !isLocalhostUrl(configured)) {
    return configured.replace(/\/$/, '');
  }

  // If req is provided and has a non-localhost host (e.g. when running on EC2)
  if (req && typeof req.get === 'function') {
    const host = req.get('host');
    if (host && !isLocalhostUrl(host)) {
      const protocol = req.protocol || 'http';
      return `${protocol}://${host}`.replace(/\/$/, '');
    }
  }

  if (isProd) {
    if (configured && !isLocalhostUrl(configured)) {
      return configured.replace(/\/$/, '');
    }
    if (req && typeof req.get === 'function') {
      const host = req.get('host');
      if (host) return `${req.protocol || 'http'}://${host}`.replace(/\/$/, '');
    }
  }

  return (configured || LOCAL_BACKEND_URL).replace(/\/$/, '');
};

module.exports = {
  LOCAL_FRONTEND_URL,
  PROD_FRONTEND_URL,
  LOCAL_BACKEND_URL,
  isProductionEnv,
  isLocalhostUrl,
  getFrontendUrl,
  getBackendUrl,
};
