import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Selectors for inputs/elements that contain customer PII and must be
 * masked in Clarity recordings. Each match gets `data-clarity-mask="true"`
 * which Clarity respects globally.
 */
const PII_SELECTORS = [
  'input[type="email"]',
  'input[type="tel"]',
  'input[type="password"]',
  'input[name*="email" i]',
  'input[name*="phone" i]',
  'input[name*="address" i]',
  'input[name*="name" i]',
  'input[name*="city" i]',
  'input[name*="postal" i]',
  'input[name*="zip" i]',
  'input[name*="card" i]',
  'input[autocomplete*="email"]',
  'input[autocomplete*="tel"]',
  'input[autocomplete*="name"]',
  'input[autocomplete*="address"]',
  'input[autocomplete*="postal"]',
  'input[autocomplete*="cc-"]',
  'textarea[name*="address" i]',
  // Static display containers that show PII (opt-in via class)
  ".pii-mask",
].join(",");

function maskPiiNodes(root: ParentNode = document) {
  try {
    root.querySelectorAll(PII_SELECTORS).forEach((el) => {
      el.setAttribute("data-clarity-mask", "true");
    });
  } catch {
    /* noop */
  }
}

/**
 * Resolve the current "tenant" so Clarity can segment recordings per
 * storefront / business listing.
 *
 * Tenant resolution order:
 *   1. Business directory pages (`/directory/:slug`) → tenant = that slug.
 *   2. Any other route → tenant = the current hostname (so custom domains
 *      and the main lovable.app preview are isolated from each other).
 *
 * Returned values are also stored in localStorage so partial captures
 * (e.g. a recording that started before React hydrated) can still be
 * attributed.
 */
function resolveTenant(pathname: string): { tenantId: string; tenantSource: string; storeSlug?: string } {
  try {
    const directoryMatch = pathname.match(/^\/directory\/([^/?#]+)/i);
    if (directoryMatch) {
      const slug = decodeURIComponent(directoryMatch[1]).toLowerCase();
      return { tenantId: `business:${slug}`, tenantSource: "directory_slug", storeSlug: slug };
    }

    const host = (typeof window !== "undefined" ? window.location.hostname : "").toLowerCase();
    return { tenantId: `host:${host || "unknown"}`, tenantSource: "hostname" };
  } catch {
    return { tenantId: "host:unknown", tenantSource: "fallback" };
  }
}

/**
 * Clarity privacy + tenant controller.
 *
 * - On `/admin/*` routes: stops Clarity from recording entirely and
 *   replaces window.clarity with a no-op for the duration of the route.
 * - Elsewhere: enables strict masking, tags PII fields, and segments
 *   the session/recording by tenant via Clarity custom tags
 *   (`tenant_id`, `tenant_source`, `store_slug`). Use these as filters
 *   in Clarity → Filters → Custom tags so each storefront's heatmaps,
 *   recordings, and insights are isolated.
 *
 * Clarity API reference:
 *   https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api
 */
export function ClarityPrivacy() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isAdmin = location.pathname.startsWith("/admin");
    const w = window as any;

    // Lazily stash the real clarity function so we can restore it on
    // navigation away from /admin.
    if (!w.__clarityOriginal && typeof w.clarity === "function") {
      w.__clarityOriginal = w.clarity;
    }

    try {
      if (isAdmin) {
        if (typeof w.__clarityOriginal === "function") {
          w.__clarityOriginal("set", "recording", "disabled");
          w.__clarityOriginal("set", "page_type", "admin");
          w.__clarityOriginal("stop");
        }
        w.clarity = function noop() {};
        return;
      }

      // Restore the real clarity API on non-admin routes
      if (typeof w.__clarityOriginal === "function" && w.clarity !== w.__clarityOriginal) {
        w.clarity = w.__clarityOriginal;
      }

      // ---- Tenant segmentation ----
      const { tenantId, tenantSource, storeSlug } = resolveTenant(location.pathname);
      try {
        localStorage.setItem("clarity_tenant_id", tenantId);
      } catch {
        /* storage may be blocked */
      }

      if (typeof w.clarity === "function") {
        w.clarity("set", "maskingMode", "strict");
        w.clarity("set", "page_type", "storefront");

        // Per-tenant custom tags — these become filterable dimensions in
        // Clarity dashboards so each storefront/business is isolated.
        w.clarity("set", "tenant_id", tenantId);
        w.clarity("set", "tenant_source", tenantSource);
        if (storeSlug) {
          w.clarity("set", "store_slug", storeSlug);
        }

        // `identify` with a tenant-scoped friendly name groups recordings
        // under the tenant in the Recordings list, and is the recommended
        // way to scope sessions per business.
        // Args: customId, customSessionId, customPageId, friendlyName
        try {
          w.clarity("identify", undefined, undefined, tenantId, tenantId);
        } catch {
          /* older clarity builds may not support identify */
        }
      }

      // Tag PII fields after this route's DOM has settled, then again
      // shortly after for late-mounted forms.
      maskPiiNodes();
      const t1 = window.setTimeout(() => maskPiiNodes(), 250);
      const t2 = window.setTimeout(() => maskPiiNodes(), 1500);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    } catch {
      /* analytics must never break the app */
    }
  }, [location.pathname]);

  return null;
}
