import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAppReady } from "@/hooks/useAppReady";

/* ------------------------------------------------------------------ */
/* Timing configuration — single source of truth                       */
/* ------------------------------------------------------------------ */
const BLINK_STATE_MS = 550; // ms per blink state (visible / hidden)
const MIN_BLINK_CYCLES = 3; // full cycles (2 states = 1 cycle) before typing
const TYPING_MS_PER_CHAR = 90; // ms per typed character
const HOLD_MS = 650; // hold the completed wordmark
const EXIT_MS = 500; // overlay fade-out duration
const APP_READY_TIMEOUT_MS = 4000; // fail-open safety for readiness
const REDUCED_MOTION_MIN_MS = 2000; // static intro minimum display window

const TYPED_SUFFIX = "ebberick"; // appended after the initial "W"

type IntroState = "WAITING" | "TYPING" | "COMPLETE" | "EXITING" | "HIDDEN";

/**
 * Full-viewport animated brand intro shown once on initial load.
 * Lives above <Routes> so SPA navigation never remounts it.
 */
export function BrandIntro() {
  const appReady = useAppReady(APP_READY_TIMEOUT_MS);

  const [state, setState] = useState<IntroState>("WAITING");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [typedCount, setTypedCount] = useState(0);
  const [blinkCycles, setBlinkCycles] = useState(0);

  const reducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  ).current;

  // Refs for all timers so they can be cleared on unmount (strict-mode safe).
  const blinkTimer = useRef<number | null>(null);
  const typeTimer = useRef<number | null>(null);
  const holdTimer = useRef<number | null>(null);
  const exitTimer = useRef<number | null>(null);
  const reducedTimer = useRef<number | null>(null);

  const blinkState = useRef(true); // true = visible

  const clearAllTimers = () => {
    [blinkTimer, typeTimer, holdTimer, exitTimer, reducedTimer].forEach((ref) => {
      if (ref.current !== null) {
        window.clearTimeout(ref.current);
        ref.current = null;
      }
    });
  };

  /* Scroll lock while the intro is active; restore once hidden. */
  useEffect(() => {
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    if (state !== "HIDDEN") {
      root.style.overflow = "hidden";
    }
    return () => {
      root.style.overflow = previousOverflow;
    };
  }, [state]);

  /* Cleanup all timers on unmount. */
  useEffect(() => {
    return clearAllTimers;
  }, []);

  /* Blink loop (JS-driven so cycle count is exact). */
  useEffect(() => {
    if (reducedMotion) return;

    const tick = () => {
      blinkState.current = !blinkState.current;
      setCursorVisible(blinkState.current);
      // A full cycle = visible -> hidden -> visible (2 state flips).
      if (blinkState.current) {
        setBlinkCycles((c) => c + 1);
      }
    };

    blinkTimer.current = window.setInterval(tick, BLINK_STATE_MS);
    return () => {
      if (blinkTimer.current !== null) {
        window.clearInterval(blinkTimer.current);
        blinkTimer.current = null;
      }
    };
  }, [reducedMotion]);

  /* WAITING -> TYPING: wait for appReady AND enough blink cycles. */
  useEffect(() => {
    if (state !== "WAITING") return;
    if (!appReady) return;
    if (!reducedMotion && blinkCycles < MIN_BLINK_CYCLES) return;

    // Reduced motion: no typing, no blink — swap cleanly after a short static window.
    if (reducedMotion) {
      reducedTimer.current = window.setTimeout(() => {
        setState("COMPLETE");
      }, REDUCED_MOTION_MIN_MS);
      return () => {
        if (reducedTimer.current !== null) {
          window.clearTimeout(reducedTimer.current);
          reducedTimer.current = null;
        }
      };
    }

    setState("TYPING");
  }, [state, appReady, reducedMotion, blinkCycles]);

  /* TYPING: append characters one at a time. */
  useEffect(() => {
    if (state !== "TYPING") return;

    if (typedCount >= TYPED_SUFFIX.length) {
      setState("COMPLETE");
      return;
    }

    typeTimer.current = window.setTimeout(() => {
      setTypedCount((c) => c + 1);
    }, TYPING_MS_PER_CHAR);

    return () => {
      if (typeTimer.current !== null) {
        window.clearTimeout(typeTimer.current);
        typeTimer.current = null;
      }
    };
  }, [state, typedCount]);

  /* COMPLETE -> EXITING: hold, then fade out. */
  useEffect(() => {
    if (state !== "COMPLETE") return;

    holdTimer.current = window.setTimeout(() => {
      setState("EXITING");
    }, HOLD_MS);

    return () => {
      if (holdTimer.current !== null) {
        window.clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
    };
  }, [state]);

  /* EXITING -> HIDDEN: unmount after the fade completes. */
  useEffect(() => {
    if (state !== "EXITING") return;

    exitTimer.current = window.setTimeout(() => {
      setState("HIDDEN");
    }, EXIT_MS);

    return () => {
      if (exitTimer.current !== null) {
        window.clearTimeout(exitTimer.current);
        exitTimer.current = null;
      }
    };
  }, [state]);

  if (state === "HIDDEN") {
    return null;
  }

  const wordmark = reducedMotion
    ? state === "WAITING"
      ? "W"
      : "Webberick"
    : "W" + TYPED_SUFFIX.slice(0, typedCount);

  const showCursor = cursorVisible; // static underscore in reduced motion (no blink interval runs)
  const exiting = state === "EXITING";

  return (
    <motion.div
      role="dialog"
      aria-label="Loading Webberick"
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "hsl(var(--intro-background))" }}
      initial={false}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: EXIT_MS / 1000, ease: "easeOut" }}
    >
      <motion.div
        className="flex items-baseline font-bold tracking-tight text-[hsl(var(--brand-logo))]"
        style={{ fontSize: "clamp(3rem, 12vw, 7rem)" }}
        animate={{ opacity: exiting ? 0 : 1, scale: exiting ? 1.02 : 1 }}
        transition={{ duration: EXIT_MS / 1000, ease: "easeOut" }}
      >
        <span aria-hidden="true">{wordmark}</span>
        {showCursor && (
          <span aria-hidden="true" className="brand-cursor">
            _
          </span>
        )}
      </motion.div>

      {/* Visually-hidden static label for screen readers. */}
      <span className="sr-only">Webberick</span>
    </motion.div>
  );
}
