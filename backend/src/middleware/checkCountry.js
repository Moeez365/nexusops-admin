// Simple in-memory cache to avoid repeated lookups for the same IP
const ipCache = new Map();
const CACHE_MAX_SIZE = 500;

/**
 * Checks whether an IP is loopback or in a private network range.
 */
function isPrivateOrLocalIp(ip) {
  if (!ip) return true;
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.20.") ||
    ip.startsWith("172.21.") ||
    ip.startsWith("172.22.") ||
    ip.startsWith("172.23.") ||
    ip.startsWith("172.24.") ||
    ip.startsWith("172.25.") ||
    ip.startsWith("172.26.") ||
    ip.startsWith("172.27.") ||
    ip.startsWith("172.28.") ||
    ip.startsWith("172.29.") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.") ||
    ip.startsWith("fc00:") ||
    ip.startsWith("fe80:")
  );
}

/**
 * Extracts the real client IP address from request headers or socket.
 */
export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  let rawIp =
    (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null) ||
    req.headers["x-real-ip"] ||
    req.headers["cf-connecting-ip"] ||
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "";

  // Normalize IPv4-mapped IPv6 address (e.g. ::ffff:192.168.1.1 -> 192.168.1.1)
  if (rawIp.startsWith("::ffff:")) {
    rawIp = rawIp.replace("::ffff:", "");
  }

  return rawIp;
}

/**
 * Resolves country code via external IP lookup with timeout and cache.
 */
async function lookupCountryByIp(ip) {
  if (!ip || isPrivateOrLocalIp(ip)) {
    return null;
  }

  if (ipCache.has(ip)) {
    return ipCache.get(ip);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    // Free, lightweight public IP geo endpoint (returns JSON with countryCode)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data && data.status === "success" && data.countryCode) {
        const result = {
          code: data.countryCode.toUpperCase(),
          name: data.country || data.countryCode,
        };

        if (ipCache.size >= CACHE_MAX_SIZE) {
          const firstKey = ipCache.keys().next().value;
          ipCache.delete(firstKey);
        }
        ipCache.set(ip, result);
        return result;
      }
    }
  } catch (error) {
    // Network timeout or offline - fail gracefully
  }

  return null;
}

/**
 * Synchronously checks headers or query params for pre-resolved CDN/Cloud country.
 */
function getCountryFromHeaders(req) {
  // 1. Query parameter override (convenient for local testing: ?country=US or ?country_code=FR)
  const queryCountry = req.query?.country || req.query?.country_code;
  if (queryCountry && typeof queryCountry === "string") {
    return {
      code: queryCountry.trim().toUpperCase(),
      source: "query",
    };
  }

  // 2. Cloudflare
  const cfCountry = req.headers["cf-ipcountry"];
  if (cfCountry && typeof cfCountry === "string" && cfCountry !== "XX") {
    return {
      code: cfCountry.trim().toUpperCase(),
      source: "cloudflare",
    };
  }

  // 3. Vercel
  const vercelCountry = req.headers["x-vercel-ip-country"];
  if (vercelCountry && typeof vercelCountry === "string") {
    return {
      code: vercelCountry.trim().toUpperCase(),
      source: "vercel",
    };
  }

  // 4. AWS CloudFront
  const cloudfrontCountry = req.headers["cloudfront-viewer-country"];
  if (cloudfrontCountry && typeof cloudfrontCountry === "string") {
    return {
      code: cloudfrontCountry.trim().toUpperCase(),
      source: "cloudfront",
    };
  }

  // 5. Standard or custom proxy headers
  const genericCountry =
    req.headers["x-country-code"] ||
    req.headers["x-country"] ||
    req.headers["x-geo-country"] ||
    req.headers["x-client-country"];

  if (genericCountry && typeof genericCountry === "string") {
    return {
      code: genericCountry.trim().toUpperCase(),
      source: "header",
    };
  }

  return null;
}

let cachedLocalPublicGeo = null;

/**
 * On localhost, resolves the developer's actual public country via their internet connection.
 * Caches the result in memory so it only checks once.
 */
async function getLocalMachinePublicGeo() {
  if (cachedLocalPublicGeo) {
    return cachedLocalPublicGeo;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    // Calling ip-api.com without an IP looks up the machine's external public internet IP
    const response = await fetch("http://ip-api.com/json/?fields=status,country,countryCode,query", {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data && data.status === "success" && data.countryCode) {
        cachedLocalPublicGeo = {
          code: data.countryCode.toUpperCase(),
          name: data.country || data.countryCode,
          ip: data.query,
          source: "localhost-public-ip",
        };
        return cachedLocalPublicGeo;
      }
    }
  } catch (error) {
    // If offline or timeout, fallback gracefully
  }

  cachedLocalPublicGeo = {
    code: process.env.DEFAULT_COUNTRY || "LOCAL",
    name: "Local Development",
    ip: "127.0.0.1",
    source: "local-environment",
  };
  return cachedLocalPublicGeo;
}

/**
 * Express Middleware to identify the originating country of an incoming request.
 * Attaches:
 *  - req.country: 2-letter ISO country code (e.g., 'US', 'PK', 'GB')
 *  - req.clientIp: normalized client IP
 *  - req.geo: { country, ip, source, countryName }
 * Also sets header: 'X-Detected-Country' on response.
 */
export const checkCountry = async (req, res, next) => {
  try {
    let clientIp = getClientIp(req);
    let countryCode = null;
    let countryName = null;
    let source = "fallback";

    // 1. Check CDN/Proxy headers or query parameter simulation (?country=US)
    const headerGeo = getCountryFromHeaders(req);
    if (headerGeo) {
      countryCode = headerGeo.code;
      source = headerGeo.source;
    }

    // 2. If simulated with x-forwarded-for or public IP, perform cached IP lookup
    if (!countryCode && !isPrivateOrLocalIp(clientIp)) {
      const ipGeo = await lookupCountryByIp(clientIp);
      if (ipGeo) {
        countryCode = ipGeo.code;
        countryName = ipGeo.name;
        source = "ip-lookup";
      }
    }

    // 3. If running on localhost (127.0.0.1 / ::1), auto-detect your real public internet country!
    if (!countryCode && isPrivateOrLocalIp(clientIp)) {
      const localPublic = await getLocalMachinePublicGeo();
      if (localPublic) {
        countryCode = localPublic.code;
        countryName = localPublic.name;
        source = localPublic.source;
        if (localPublic.ip) {
          clientIp = localPublic.ip;
        }
      }
    }

    // 4. Default fallback if all detections fail
    if (!countryCode) {
      countryCode = process.env.DEFAULT_COUNTRY || "US";
      source = "fallback";
    }

    // Attach to request object for downstream controllers & routes
    req.country = countryCode;
    req.clientIp = clientIp;
    req.geo = {
      country: countryCode,
      countryName: countryName || countryCode,
      ip: clientIp,
      source,
    };

    // Set response header so client/frontend can inspect detected country
    res.setHeader("X-Detected-Country", countryCode);

    next();
  } catch (error) {
    console.error("[checkCountry middleware error]:", error);
    // Ensure request proceeds even if detection fails
    req.country = process.env.DEFAULT_COUNTRY || "UNKNOWN";
    req.clientIp = getClientIp(req);
    req.geo = { country: req.country, ip: req.clientIp, source: "error-fallback" };
    next();
  }
};

export default checkCountry;