"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ChevronDownIcon } from "lucide-react";
import { SeshLogo } from "@/components/landing/sesh-logo";
import { LANDING_TAGLINE } from "@/lib/landing/content";

interface IntroHeroProps {
  /** True once real assets (fonts, page load) are in, or the loader cap hits. */
  ready: boolean;
  reduced: boolean;
}

export function IntroHero({ ready, reduced }: IntroHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.6], [1, reduced ? 1 : 0.82]);
  const opacity = useTransform(scrollYProgress, [0.1, 0.6], [1, reduced ? 1 : 0]);
  const blur = useTransform(
    scrollYProgress,
    [0.1, 0.6],
    ["blur(0px)", reduced ? "blur(0px)" : "blur(8px)"]
  );

  return (
    <section
      ref={ref}
      aria-label="Welcome to Sesh"
      className="relative h-[150svh] overflow-x-clip"
    >
      <motion.div
        style={{ scale, opacity, filter: blur }}
        className="sticky top-0 flex h-svh flex-col items-center justify-center px-6 text-center"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.22),transparent_60%)]"
        />

        <div className="relative">
          {ready && !reduced && (
            <>
              <span
                aria-hidden
                className="landing-ripple absolute inset-0 rounded-[30%] border border-fuchsia-400/50"
              />
              <span
                aria-hidden
                className="landing-ripple absolute inset-0 rounded-[30%] border border-orange-300/40 [animation-delay:0.5s]"
              />
            </>
          )}
          <SeshLogo
            animate={!reduced}
            className={`size-24 sm:size-28 ${ready && !reduced ? "landing-glow" : ""}`}
          />
        </div>

        <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
          Sesh
        </h1>

        <motion.p
          initial={false}
          animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 12 }}
          transition={{ duration: reduced ? 0 : 0.7, ease: "easeOut" }}
          className="mt-4 max-w-md text-lg text-balance text-white/70 sm:text-xl"
        >
          {LANDING_TAGLINE}
        </motion.p>

        <motion.div
          initial={false}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 0.6, delay: reduced ? 0 : 0.5 }}
          className="absolute bottom-10 flex flex-col items-center gap-1 text-xs font-medium tracking-[0.25em] text-white/50 uppercase"
          aria-hidden
        >
          Scroll
          <ChevronDownIcon
            className={`size-5 ${reduced ? "" : "animate-bounce"}`}
          />
        </motion.div>

        {!ready && (
          <span role="status" className="sr-only">
            Loading Sesh
          </span>
        )}
      </motion.div>
    </section>
  );
}
