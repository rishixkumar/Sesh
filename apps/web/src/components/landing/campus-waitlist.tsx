"use client";

import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { CAMPUS_WAITLIST_STORAGE_KEY } from "@/lib/landing/constants";

const waitlistSchema = z.object({
  email: z.email("Enter a valid email"),
  school: z.string().trim().min(2, "Which school?").max(80),
});

export function CampusWaitlist() {
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = waitlistSchema.safeParse({ email, school });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setError(null);
    // Prototype only: no backend yet, so entries stay on this device.
    try {
      const existing = JSON.parse(
        window.localStorage.getItem(CAMPUS_WAITLIST_STORAGE_KEY) ?? "[]"
      ) as unknown[];
      window.localStorage.setItem(
        CAMPUS_WAITLIST_STORAGE_KEY,
        JSON.stringify([...existing, { ...parsed.data, at: new Date().toISOString() }])
      );
    } catch {
      // Storage unavailable; the confirmation still shows.
    }
    setJoined(true);
    toast.success(`You're on the list for ${parsed.data.school}.`);
  };

  return (
    <section
      aria-labelledby="campus-heading"
      className="relative overflow-hidden border-y border-white/10 bg-gradient-to-b from-[#120e1c] to-[#07060b] px-6 py-28 sm:py-36"
    >
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-200 uppercase sm:text-sm">
            Built at Georgia Tech
          </p>
          <h2
            id="campus-heading"
            className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white sm:text-5xl"
          >
            Coming to your campus next.
          </h2>
          <p className="mt-4 text-base text-white/60 sm:text-lg">
            Not at Tech? Tell us where you are. We&apos;ll email you once when
            Sesh launches at your school.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          {joined ? (
            <p
              role="status"
              className="mx-auto mt-10 flex max-w-md items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-4 text-sm font-medium text-emerald-200"
            >
              <CheckIcon className="size-4" />
              You&apos;re on the list. See you soon.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
            >
              <label className="sr-only" htmlFor="waitlist-email">
                Email
              </label>
              <input
                id="waitlist-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "waitlist-error" : undefined}
                className="h-12 rounded-full sm:flex-1 border border-white/15 bg-white/5 px-5 text-base text-white placeholder:text-white/35 focus:border-fuchsia-400/60 focus:outline-none"
              />
              <label className="sr-only" htmlFor="waitlist-school">
                School
              </label>
              <input
                id="waitlist-school"
                type="text"
                autoComplete="organization"
                placeholder="Your school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "waitlist-error" : undefined}
                className="h-12 rounded-full border border-white/15 bg-white/5 px-5 text-base text-white placeholder:text-white/35 focus:border-fuchsia-400/60 focus:outline-none sm:w-40"
              />
              <button
                type="submit"
                className="h-12 shrink-0 rounded-full bg-white px-6 text-sm whitespace-nowrap font-semibold text-black transition-transform hover:scale-[1.03] focus-visible:ring-4 focus-visible:ring-fuchsia-400/50 focus-visible:outline-none active:scale-95"
              >
                Notify me
              </button>
            </form>
          )}
          {error && (
            <p id="waitlist-error" role="alert" className="mt-3 text-sm text-rose-300">
              {error}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
