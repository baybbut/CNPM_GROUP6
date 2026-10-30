// Retain the same event ID when retrying: the API deduplicates acknowledged
// events so recovering a connection does not inflate the report.
export function createActivityDelivery({
  endpoint,
  fetchRequest = (...args) => fetch(...args),
  schedule = (fn, delay) => setTimeout(fn, delay),
  cancel = (timer) => clearTimeout(timer),
  warn = (message) => console.warn(message),
}) {
  const queue = [];
  let pending = false;
  let retryTimer = null;
  let retryDelay = 1000;
  let lastError = "";

  function report(message) {
    if (message !== lastError) warn(`Muses analytics: ${message}`);
    lastError = message;
  }

  async function flush() {
    if (pending || !queue.length) return;
    if (retryTimer !== null) {
      cancel(retryTimer);
      retryTimer = null;
    }
    pending = true;
    let retry = false;
    try {
      while (queue.length) {
        const item = queue[0];
        const controller = new AbortController();
        const timeout = schedule(() => controller.abort(), 10000);
        let response;
        try {
          response = await fetchRequest(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
            credentials: "include",
            keepalive: true,
            signal: controller.signal,
          });
        } finally {
          cancel(timeout);
        }
        if (response.status >= 500 || response.status === 429) {
          report(`HTTP ${response.status}; will retry the pending visit.`);
          retry = true;
          break;
        }
        if (!response.ok) {
          report(`HTTP ${response.status}; the server rejected a visit event.`);
        } else {
          lastError = "";
          retryDelay = 1000;
        }
        // The bounded queue may have evicted an in-flight event. Do not remove
        // the next event if that happens while awaiting the HTTP response.
        const index = queue.indexOf(item);
        if (index !== -1) queue.splice(index, 1);
      }
    } catch {
      report("Could not reach the activity API; will retry the pending visit.");
      retry = true;
    } finally {
      pending = false;
      if (retry && queue.length && retryTimer === null) {
        retryTimer = schedule(() => {
          retryTimer = null;
          void flush();
        }, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30000);
      }
    }
  }

  return {
    enqueue(item) {
      queue.push(item);
      if (queue.length > 100) queue.shift();
      return flush();
    },
    retry: flush,
  };
}

export function activityApiBase(configuredBase = "", pageOrigin = "") {
  const base = configuredBase.trim().replace(/\/$/, "");
  if (!base || !pageOrigin) return base;
  try {
    const api = new URL(base);
    const page = new URL(pageOrigin);
    const loopback = (hostname) =>
      ["localhost", "localhost.", "0.0.0.0", "[::1]"].includes(hostname) ||
      hostname.endsWith(".localhost") ||
      /^127\.\d+\.\d+\.\d+$/.test(hostname);
    // A phone's localhost is the phone itself. Use Vite's same-origin /api
    // proxy if a local development API URL was copied into the frontend env.
    if (loopback(api.hostname) && !loopback(page.hostname)) return "";
  } catch {
    // Preserve existing relative API prefixes and let fetch resolve them.
  }
  return base;
}
