import { useEffect, useState } from "react";

/**
 * Detects when the app is ready to reveal the brand intro.
 *
 * `appReady` becomes true when ALL of the following hold:
 *   1. This hook's effect has run (i.e. the hook is mounted inside the app tree).
 *   2. The window has finished loading (`document.readyState === "complete"` or the
 *      window `load` event has fired).
 *   3. `document.fonts.ready` has resolved.
 *
 * Everything is raced against a fail-open safety timeout so a hung non-critical
 * resource (e.g. a missing gallery video delaying `load`) can never stick the intro.
 */
export function useAppReady(timeoutMs = 4000): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let windowLoaded = document.readyState === "complete";
    let fontsReady = false;

    const tryResolve = () => {
      if (mounted && windowLoaded && fontsReady) {
        setReady(true);
      }
    };

    const onLoad = () => {
      windowLoaded = true;
      tryResolve();
    };

    // Fail-open safety: never block the intro forever.
    const safetyTimeout = window.setTimeout(() => {
      if (mounted) {
        setReady(true);
      }
    }, timeoutMs);

    if (document.readyState === "complete") {
      windowLoaded = true;
    } else {
      window.addEventListener("load", onLoad);
    }

    // document.fonts.ready resolves fast here (no webfonts today) but is
    // future-proofed for when fonts are added.
    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          fontsReady = true;
          tryResolve();
        })
        .catch(() => {
          // Font loading failure should not block the intro either.
          fontsReady = true;
          tryResolve();
        });
    } else {
      fontsReady = true;
    }

    tryResolve();

    return () => {
      mounted = false;
      window.removeEventListener("load", onLoad);
      window.clearTimeout(safetyTimeout);
    };
  }, [timeoutMs]);

  return ready;
}
