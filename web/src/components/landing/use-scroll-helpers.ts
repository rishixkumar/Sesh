"use client";

import { useState } from "react";
import {
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "motion/react";

/** Maps a slice of a 0..1 progress value onto its own clamped 0..1 range. */
export function useRange(
  progress: MotionValue<number>,
  start: number,
  end: number
): MotionValue<number> {
  return useTransform(progress, [start, end], [0, 1], { clamp: true });
}

/**
 * Derives React state from a motion value, re-rendering only when the
 * mapped primitive actually changes (not on every scroll frame).
 */
export function useDerived<T extends string | number | boolean>(
  value: MotionValue<number>,
  map: (v: number) => T
): T {
  const [derived, setDerived] = useState<T>(() => map(value.get()));
  useMotionValueEvent(value, "change", (v) => {
    const next = map(v);
    setDerived((prev) => (Object.is(prev, next) ? prev : next));
  });
  return derived;
}
