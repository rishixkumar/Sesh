"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { HOOK_STATEMENT } from "@/lib/landing/content";

const HIGHLIGHT_FROM = "Sesh";

function Word({
  word,
  index,
  total,
  progress,
  accent,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  accent: boolean;
}) {
  const start = index / total;
  const end = start + 1 / total;
  const opacity = useTransform(progress, [start, end], [0.15, 1]);

  return (
    <motion.span
      style={{ opacity }}
      className={
        accent
          ? "bg-gradient-to-r from-violet-300 via-pink-300 to-orange-200 bg-clip-text text-transparent"
          : undefined
      }
    >
      {word}{" "}
    </motion.span>
  );
}

export function HookStatement({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  // Finish lighting up before the pin releases so the last words get a beat.
  const progress = useTransform(scrollYProgress, [0.05, 0.8], [0, 1]);

  const words = HOOK_STATEMENT.split(" ");
  const accentStart = words.indexOf(HIGHLIGHT_FROM);

  if (reduced) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-32">
        <p className="text-3xl leading-tight font-semibold tracking-tight text-white sm:text-5xl">
          {HOOK_STATEMENT}
        </p>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-[260svh]">
      <div className="sticky top-0 flex h-svh items-center">
        <p className="mx-auto max-w-4xl px-6 text-3xl leading-tight font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
          {words.map((word, i) => (
            <Word
              key={`${word}-${i}`}
              word={word}
              index={i}
              total={words.length}
              progress={progress}
              accent={accentStart !== -1 && i >= accentStart}
            />
          ))}
        </p>
      </div>
    </section>
  );
}
