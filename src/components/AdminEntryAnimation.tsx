import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const MESSAGE = "Hi, Ricky";
const TYPE_MS = 85;
const HOLD_MS = 420;

interface AdminEntryAnimationProps {
  onComplete: () => void;
}

export function AdminEntryAnimation({ onComplete }: AdminEntryAnimationProps) {
  const [typedCount, setTypedCount] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (typedCount < MESSAGE.length) {
      const timer = window.setTimeout(() => setTypedCount((count) => count + 1), TYPE_MS);
      return () => window.clearTimeout(timer);
    }

    const holdTimer = window.setTimeout(() => setIsExiting(true), HOLD_MS);
    return () => window.clearTimeout(holdTimer);
  }, [typedCount]);

  useEffect(() => {
    if (!isExiting) return;

    const exitTimer = window.setTimeout(onComplete, 420);
    return () => window.clearTimeout(exitTimer);
  }, [isExiting, onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          role="dialog"
          aria-label="Opening admin login"
          className="fixed inset-0 z-[110] flex items-center justify-center bg-[hsl(var(--intro-background))]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <motion.div
            className="flex items-baseline font-bold tracking-tight text-[hsl(var(--brand-logo))]"
            style={{ fontSize: "clamp(2.8rem, 10vw, 6.5rem)" }}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <span aria-hidden="true">{MESSAGE.slice(0, typedCount)}</span>
            <span aria-hidden="true" className="brand-cursor brand-cursor-blink ml-[0.04em]">
              _
            </span>
            <span className="sr-only">Hi, Ricky</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
