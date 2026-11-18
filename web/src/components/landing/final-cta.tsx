"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { SeshLogo } from "@/components/landing/sesh-logo";
import { useSesh } from "@/lib/context/sesh-provider";

export function FinalCta() {
  const { setDemoIdentity } = useSesh();

  return (
    <section
      aria-labelledby="final-cta-heading"
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-28 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_at_bottom,rgba(236,72,153,0.28),transparent_65%)]"
      />
      <Reveal className="relative flex flex-col items-center">
        <SeshLogo animate={false} className="size-14" />
        <h2
          id="final-cta-heading"
          className="mt-6 text-4xl font-semibold tracking-tight text-balance text-white sm:text-6xl"
        >
          Tonight&apos;s move is waiting.
        </h2>
        <Link
          href="/"
          className="group mt-10 inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 px-10 text-lg font-semibold text-white shadow-[0_10px_60px_-10px_rgba(236,72,153,0.7)] transition-transform hover:scale-[1.04] focus-visible:ring-4 focus-visible:ring-fuchsia-300/60 focus-visible:outline-none active:scale-95"
        >
          Enter Sesh
          <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/"
          onClick={() => setDemoIdentity("GUEST")}
          className="mt-5 text-sm text-white/60 underline-offset-4 hover:text-white hover:underline"
        >
          Browse events as a guest
        </Link>
      </Reveal>
      <p className="absolute bottom-6 text-xs text-white/35">
        Sesh · 18+ · Georgia Tech &amp; Midtown Atlanta
      </p>
    </section>
  );
}
