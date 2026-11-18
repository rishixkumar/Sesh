"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRightIcon } from "lucide-react";
import { IntroHero } from "@/components/landing/intro-hero";
import { HookStatement } from "@/components/landing/hook-statement";
import { FeatureStory } from "@/components/landing/feature-story";
import { GuardrailsSection } from "@/components/landing/guardrails-section";
import { CampusWaitlist } from "@/components/landing/campus-waitlist";
import { FinalCta } from "@/components/landing/final-cta";
import {
  INTRO_SEEN_COOKIE,
  LOADER_MAX_MS,
  LOADER_MIN_MS,
} from "@/lib/landing/constants";

const noopSubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

function waitForPageLoad(): Promise<void> {
  if (document.readyState === "complete") return Promise.resolve();
  return new Promise((resolve) =>
    window.addEventListener("load", () => resolve(), { once: true })
  );
}

export function LandingPage() {
  const isClient = useIsClient();
  const prefersReduced = useReducedMotion();
  // Server and first client render agree on the animated tree; swap after mount.
  const reduced = isClient && prefersReduced === true;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.cookie = `${INTRO_SEEN_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;

    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setReady(true);
    };
    const minDelay = new Promise((r) => setTimeout(r, reduced ? 0 : LOADER_MIN_MS));
    Promise.all([document.fonts.ready, waitForPageLoad(), minDelay]).then(finish);
    const cap = window.setTimeout(finish, LOADER_MAX_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(cap);
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1 });
    if (!ready) lenis.stop();
    return () => lenis.destroy();
  }, [reduced, ready]);

  useEffect(() => {
    if (ready) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
    };
  }, [ready]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-svh bg-[#07060b] text-white selection:bg-fuchsia-500/40">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-50"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-sm font-medium text-white/85 backdrop-blur-md transition-colors hover:bg-white hover:text-black focus-visible:ring-4 focus-visible:ring-fuchsia-400/50 focus-visible:outline-none"
          >
            Skip intro
            <ArrowRightIcon className="size-4" />
          </Link>
        </motion.div>

        <main>
          <IntroHero ready={ready} reduced={reduced} />
          <HookStatement reduced={reduced} />
          <FeatureStory reduced={reduced} />
          <GuardrailsSection />
          <CampusWaitlist />
          <FinalCta />
        </main>
      </div>
    </MotionConfig>
  );
}
