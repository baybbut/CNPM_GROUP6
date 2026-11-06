// The Wi-Fi address supplied for the local Muses demo. Public deployments use
// their own origin; VITE_VISITOR_BASE_URL can override it before a build.
export const LOCAL_WEBSITE_URL = "http://192.168.31.88:5173/";

function isLoopback(hostname) {
  hostname = hostname.replace(/\.$/, "");
  return (
    ["localhost", "0.0.0.0", "[::1]"].includes(hostname) ||
    hostname.endsWith(".localhost") ||
    /^127\.\d+\.\d+\.\d+$/.test(hostname)
  );
}

export function websiteAccessUrl(origin, configuredUrl = "") {
  const current = new URL(origin);
  const address =
    configuredUrl.trim() ||
    (isLoopback(current.hostname) ? LOCAL_WEBSITE_URL : current.origin);
  const url = new URL(address);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    isLoopback(url.hostname)
  ) {
    throw new Error("A reachable HTTP(S) website address is required.");
  }
  return `${url.origin}/`;
}

export function isLocalWebsite(address) {
  const { hostname } = new URL(address);
  const ipv4 = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
  return (
    (ipv4 && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)) ||
    hostname.endsWith(".local") ||
    /^\[(f[cd]|fe[89ab])/i.test(hostname)
  );
}
