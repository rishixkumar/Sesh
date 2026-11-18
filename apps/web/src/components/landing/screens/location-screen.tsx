"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { NavigationIcon, TimerIcon } from "lucide-react";
import { SAMPLE_ROSTER } from "@/lib/landing/content";
import { useDerived, useRange } from "@/components/landing/use-scroll-helpers";

const SHARE_ON_AT = 0.12;
const EXPIRE_AT = 0.86;
const SHARE_MINUTES = 120;

const PINS = [
  { left: "26%", top: "40%", at: 0.22 },
  { left: "70%", top: "35%", at: 0.32 },
  { left: "60%", top: "66%", at: 0.42 },
];

function FriendPin({
  progress,
  index,
}: {
  progress: MotionValue<number>;
  index: number;
}) {
  const pin = PINS[index];
  const member = SAMPLE_ROSTER[index];
  const appear = useRange(progress, pin.at, pin.at + 0.06);
  const vanish = useRange(progress, EXPIRE_AT, EXPIRE_AT + 0.05);
  const opacity = useTransform([appear, vanish], ([a, v]: number[]) => a * (1 - v));
  const y = useTransform(appear, [0, 1], [-18, 0]);

  return (
    <motion.div
      style={{ left: pin.left, top: pin.top, opacity, y }}
      className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
    >
      <span
        className="flex size-8 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white shadow-lg"
        style={{ background: `hsl(${member.hue} 80% 55%)` }}
      >
        {member.initials}
      </span>
      <span className="h-2 w-0.5 bg-white" />
    </motion.div>
  );
}

export function LocationScreen({ progress }: { progress: MotionValue<number> }) {
  const state = useDerived(progress, (v) =>
    v < SHARE_ON_AT ? "off" : v < EXPIRE_AT ? "on" : "expired"
  );
  const minutesLeft = useDerived(progress, (v) => {
    const t = Math.min(Math.max((v - SHARE_ON_AT) / (EXPIRE_AT - SHARE_ON_AT), 0), 1);
    return Math.round(SHARE_MINUTES * (1 - t));
  });
  const sharing = state === "on";
  const timeLabel = `${Math.floor(minutesLeft / 60)}h ${String(minutesLeft % 60).padStart(2, "0")}m`;

  return (
    <div className="relative h-full">
      <div className="absolute inset-0 top-0 overflow-hidden bg-[#111019]">
        <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 300 640">
          <rect x="170" y="330" width="90" height="70" rx="10" fill="#14321f" />
          <rect x="30" y="460" width="70" height="90" rx="10" fill="#14321f" />
          <g stroke="#2a2735" strokeWidth="10" strokeLinecap="round">
            <path d="M-10 180 L310 220" />
            <path d="M-10 420 L310 380" />
            <path d="M90 -10 L120 650" />
            <path d="M220 -10 L200 650" />
          </g>
          <g stroke="#1e1c28" strokeWidth="4">
            <path d="M-10 300 L310 300" />
            <path d="M-10 540 L310 520" />
            <path d="M40 -10 L60 650" />
          </g>
          <path
            d="M0 610 C80 560 140 600 300 560"
            stroke="#1d3350"
            strokeWidth="14"
            fill="none"
          />
        </svg>

        {PINS.map((_, i) => (
          <FriendPin key={i} progress={progress} index={i} />
        ))}

        <div className="absolute top-[48%] left-[44%] -translate-x-1/2 -translate-y-1/2">
          <span className="absolute inset-0 animate-ping rounded-full bg-sky-400/50" />
          <span className="relative block size-4 rounded-full border-2 border-white bg-sky-500" />
        </div>
      </div>

      <div className="absolute inset-x-3 top-12 rounded-2xl border border-white/10 bg-black/70 p-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NavigationIcon className="size-4 text-sky-300" />
            <span className="text-[12px] font-semibold text-white">Share location</span>
          </div>
          <span
            className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors duration-300 ${
              sharing ? "bg-emerald-500" : "bg-white/20"
            }`}
          >
            <span
              className={`size-5 rounded-full bg-white shadow transition-transform duration-300 ${
                sharing ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/60">
          {state === "off" && "Off by default"}
          {state === "on" && (
            <>
              <TimerIcon className="size-3.5 text-emerald-300" />
              <span>
                With 3 friends · ends in{" "}
                <span className="tabular-nums text-white">{timeLabel}</span>
              </span>
            </>
          )}
          {state === "expired" && "Expired automatically · location off"}
        </p>
      </div>
    </div>
  );
}
