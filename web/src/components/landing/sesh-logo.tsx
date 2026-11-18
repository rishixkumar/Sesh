"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const FRAME_PATH =
  "M30 6 H70 C83.255 6 94 16.745 94 30 V70 C94 83.255 83.255 94 70 94 H30 C16.745 94 6 83.255 6 70 V30 C6 16.745 16.745 6 30 6 Z";
const BOLT_PATH = "M56 18 L30 55 H49 L43 82 L70 43 H51 Z";

interface SeshLogoProps {
  className?: string;
  /** When false the mark renders fully drawn with no animation. */
  animate?: boolean;
}

export function SeshLogo({ className, animate = true }: SeshLogoProps) {
  const draw = (delay: number, duration: number) =>
    animate
      ? {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: {
            pathLength: { delay, duration, ease: [0.65, 0, 0.35, 1] as const },
            opacity: { delay, duration: 0.01 },
          },
        }
      : {};

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Sesh"
      className={cn("overflow-visible", className)}
    >
      <defs>
        <linearGradient id="sesh-logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="55%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>
      <motion.path
        d={FRAME_PATH}
        fill="none"
        stroke="url(#sesh-logo-gradient)"
        strokeWidth={4}
        strokeLinecap="round"
        {...draw(0, 0.9)}
      />
      <motion.path
        d={BOLT_PATH}
        fill="url(#sesh-logo-gradient)"
        stroke="url(#sesh-logo-gradient)"
        strokeWidth={3}
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, fillOpacity: 0 } : undefined}
        animate={animate ? { pathLength: 1, fillOpacity: 1 } : undefined}
        transition={
          animate
            ? {
                pathLength: { delay: 0.45, duration: 0.7, ease: "easeInOut" },
                fillOpacity: { delay: 1, duration: 0.35 },
              }
            : undefined
        }
      />
    </svg>
  );
}
