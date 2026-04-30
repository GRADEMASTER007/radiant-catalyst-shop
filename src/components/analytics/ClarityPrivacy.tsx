import { useEffect } from "react";
import { useLocation } from "react-router-dom";

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
      }
    } catch {
      /* analytics must never break the app */
    }
  }, [location.pathname]);

  return null;
}
