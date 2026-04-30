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
 * Clarity privacy controller.
 *
 * - On `/admin/*` routes: stops Clarity from recording entirely (heatmaps,
 *   session replay, custom events) by setting a hard kill-switch tag and
 *   replacing window.clarity with a no-op for the duration of the route.
 * - Elsewhere: enables Clarity's strict masking mode so input values,
 *   text content of PII fields, and any element marked with
 *   `data-clarity-mask="true"` are redacted in recordings.
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
        // 1) Tag the session so any data already captured can be filtered out
        if (typeof w.__clarityOriginal === "function") {
          w.__clarityOriginal("set", "recording", "disabled");
          w.__clarityOriginal("set", "page_type", "admin");
          // `stop` halts further recording in the current session
          w.__clarityOriginal("stop");
        }
        // 2) Hard kill-switch: replace clarity with a no-op so custom events
        //    fired from admin pages don't reach Clarity either.
        w.clarity = function noop() {};
      } else {
        // Restore the real clarity API on non-admin routes
        if (typeof w.__clarityOriginal === "function" && w.clarity !== w.__clarityOriginal) {
          w.clarity = w.__clarityOriginal;
        }
        if (typeof w.clarity === "function") {
          // Strictest masking: input values and text in masked regions are
          // replaced with `*` in recordings.
          w.clarity("set", "maskingMode", "strict");
          w.clarity("set", "page_type", "storefront");
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
      }
    } catch {
      /* analytics must never break the app */
    }
  }, [location.pathname]);

  return null;
}
