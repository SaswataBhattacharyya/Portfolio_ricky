import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import "./WebberickMascot.css";

export type WebberickMascotState =
  | "idle"
  | "loading"
  | "working"
  | "success"
  | "error"
  | "offline"
  | "smile"
  | "neutral"
  | "attentive"
  | "point"
  | "invite";

interface WebberickMascotProps {
  state?: WebberickMascotState;
  className?: string;
  label?: string;
  autoBlink?: boolean;
  interactive?: boolean;
}

type BoardState = "idle" | "loading" | "working" | "success" | "error" | "offline" | "smile";

function StateArtifact({ state }: { state: BoardState }) {
  if (state === "idle" || state === "smile") return null;

  if (state === "loading") {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <g className="mascot-artifact-spin">
          <circle cx="50" cy="50" r="31" fill="none" stroke="#1d2a2d" strokeWidth="9" />
          <path d="M50 19 A31 31 0 0 1 78 37" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  if (state === "working") {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="7">
          <circle cx="50" cy="50" r="18" />
          <circle cx="50" cy="50" r="31" strokeDasharray="6 10" />
        </g>
      </svg>
    );
  }

  if (state === "success") {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="7" />
        <path d="M33 51 L45 63 L69 38" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      </svg>
    );
  }

  if (state === "error") {
    return (
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path d="M50 16 L86 80 H14 Z" fill="none" stroke="currentColor" strokeWidth="7" />
        <path d="M50 38 V58" stroke="currentColor" strokeWidth="8" />
        <circle cx="50" cy="70" r="4" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M19 38 Q50 13 81 38M30 52 Q50 35 70 52M41 66 Q50 59 59 66" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <circle cx="50" cy="78" r="5" fill="currentColor" />
      <path d="M24 22 L76 82" stroke="currentColor" strokeWidth="5" />
    </svg>
  );
}

/**
 * Webberick mascot sourced directly from design-asset/webberick/design-board.html.
 * Placement belongs to the page so one companion can travel between meaningful
 * moments without duplicating itself. The mascot only owns expression/state.
 */
export function WebberickMascot({
  state = "idle",
  className,
  label,
  autoBlink = true,
  interactive = false,
}: WebberickMascotProps) {
  const rawMaskId = useId();
  const maskId = `webberick-mascot-mask-${rawMaskId.replace(/:/g, "")}`;
  const [blinking, setBlinking] = useState(false);
  const [smiling, setSmiling] = useState(false);
  const smileTimer = useRef<number | undefined>();

  const boardState: BoardState =
    state === "neutral" || state === "point" || state === "invite"
      ? "idle"
      : state === "attentive"
        ? "loading"
        : state;

  const displayState: BoardState = smiling ? "smile" : boardState;

  useEffect(() => {
    if (!autoBlink || boardState !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let blinkTimer: number | undefined;
    let resetTimer: number | undefined;
    let cancelled = false;

    const schedule = () => {
      blinkTimer = window.setTimeout(() => {
        if (cancelled) return;
        setBlinking(true);
        resetTimer = window.setTimeout(() => {
          if (cancelled) return;
          setBlinking(false);
          schedule();
        }, 105);
      }, 2800 + Math.random() * 4200);
    };

    schedule();
    return () => {
      cancelled = true;
      if (blinkTimer) window.clearTimeout(blinkTimer);
      if (resetTimer) window.clearTimeout(resetTimer);
    };
  }, [autoBlink, boardState]);

  useEffect(() => () => {
    if (smileTimer.current) window.clearTimeout(smileTimer.current);
  }, []);

  const triggerSmile = () => {
    if (!interactive) return;
    if (smileTimer.current) window.clearTimeout(smileTimer.current);
    setSmiling(true);
    smileTimer.current = window.setTimeout(() => setSmiling(false), 650);
  };

  const mascotContent = (
    <>
      <svg className="webberick-mascot__svg" viewBox="0 0 720 720" focusable="false" aria-hidden="true">
        <defs>
          <mask id={maskId}>
            <rect width="720" height="720" fill="black" />
            <path
              d="M242 208 C282 168 344 150 401 152 C481 156 547 210 560 283 C568 334 551 376 513 403 C484 423 470 450 471 476 C472 500 455 519 423 531 C387 544 339 547 297 538 C219 520 160 456 154 372 C149 304 180 247 242 208 Z"
              fill="white"
            />
            <circle cx="516" cy="382" r="29" fill="black" />
          </mask>
        </defs>

        <g className="mascot-root">
          <rect width="720" height="720" fill="var(--mascot-shell)" mask={`url(#${maskId})`} />
          <circle className="mascot-accent mascot-accent--cyan" cx="276" cy="216" r="27" fill="var(--charge-cyan)" />
          <circle className="mascot-accent mascot-accent--paper" cx="342" cy="188" r="21" fill="var(--paper)" />
          <circle className="mascot-accent mascot-accent--mint" cx="231" cy="264" r="20" fill="var(--charge-mint)" />

          <path
            className={cn("mascot-eye", blinking && "is-blinking")}
            d="M313 306 Q323 295 333 306"
            fill="none"
            stroke="var(--paper)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            className={cn("mascot-eye", blinking && "is-blinking")}
            d="M387 306 Q397 295 407 306"
            fill="none"
            stroke="var(--paper)"
            strokeWidth="9"
            strokeLinecap="round"
          />

          <g className="mascot-code" stroke="var(--teal)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path className="mascot-part mascot-code-l" d="M304 360 L284 378 L304 396" />
            <path className="mascot-part mascot-code-slash" d="M365 352 L355 403" />
            <path className="mascot-part mascot-code-r" d="M416 360 L436 378 L416 396" />
          </g>

          <rect x="300" y="484" width="46" height="74" rx="21" fill="var(--mascot-shell)" />
          <rect x="374" y="484" width="46" height="74" rx="21" fill="var(--mascot-shell)" />
        </g>
      </svg>

      <div className="webberick-mascot__artifact" aria-hidden="true">
        <StateArtifact state={displayState} />
      </div>
    </>
  );

  const rootClassName = cn(
    "webberick-mascot",
    interactive && "webberick-mascot--interactive",
    className,
  );

  if (interactive) {
    return (
      <button
        type="button"
        className={rootClassName}
        data-state={displayState}
        aria-label={label ?? "Webberick mascot — click to smile"}
        onClick={triggerSmile}
      >
        {mascotContent}
      </button>
    );
  }

  const accessibility = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };

  return (
    <div
      className={rootClassName}
      data-state={displayState}
      {...accessibility}
    >
      {mascotContent}
    </div>
  );
}
