// Lightweight analytics helpers for Microsoft Clarity (and GA4 if present).
// Safe no-ops when scripts haven't loaded yet.

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Send a custom event to Microsoft Clarity.
 * Uses Clarity's `event` API so it appears in Insights and can be used
 * to filter heatmaps and session recordings.
 *
 * Also forwards to GA4 (gtag) when available so the same conversion shows
 * up in both tools.
 */
export function trackEvent(
  name: string,
  properties: Record<string, string | number | boolean | undefined | null> = {}
) {
  try {
    if (typeof window === "undefined") return;

    // Clean undefined/null values — Clarity tags must be strings.
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(properties)) {
      if (v === undefined || v === null) continue;
      cleaned[k] = String(v);
    }

    // 1) Microsoft Clarity custom event
    if (typeof window.clarity === "function") {
      window.clarity("event", name);

      // Attach properties as Clarity tags so they're filterable in dashboards
      for (const [k, v] of Object.entries(cleaned)) {
        try {
          window.clarity("set", k, v);
        } catch {
          /* ignore individual tag failures */
        }
      }
    }

    // 2) GA4 (forward the same event for parity)
    if (typeof window.gtag === "function") {
      window.gtag("event", name, properties);
    }
  } catch (err) {
    // Never let analytics break the app
    if (typeof console !== "undefined") console.warn("trackEvent failed", err);
  }
}

/** Identify a user/session in Clarity (e.g. after login or checkout). */
export function identifyUser(
  userId?: string | null,
  sessionId?: string | null,
  pageId?: string | null,
  friendlyName?: string | null
) {
  try {
    if (typeof window === "undefined" || typeof window.clarity !== "function") return;
    window.clarity(
      "identify",
      userId || undefined,
      sessionId || undefined,
      pageId || undefined,
      friendlyName || undefined
    );
  } catch {
    /* noop */
  }
}

/** Mark the current Clarity session as containing a conversion. */
export function flagConversion(name: string) {
  try {
    if (typeof window === "undefined" || typeof window.clarity !== "function") return;
    window.clarity("set", "conversion", name);
    window.clarity("upgrade", name); // prioritises this session's recording
  } catch {
    /* noop */
  }
}
