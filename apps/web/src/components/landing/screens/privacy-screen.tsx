"use client";

import { AnimatePresence, motion, useTransform, type MotionValue } from "motion/react";
import { GlobeIcon, LockIcon, UserRoundIcon, UsersIcon } from "lucide-react";
import { SAMPLE_ROSTER } from "@/lib/landing/content";
import { useDerived } from "@/components/landing/use-scroll-helpers";

const AUDIENCES = [
  {
    label: "Public",
    icon: GlobeIcon,
    summary: "Anyone 18+ near campus can find it. Non-friends appear anonymous.",
  },
  {
    label: "Friends",
    icon: UsersIcon,
    summary: "Only your friends see this move, by name.",
  },
  {
    label: "Invite-only",
    icon: LockIcon,
    summary: "Hidden from the feed. Only people you invite can open it.",
  },
] as const;

const STEPS = [0.3, 0.38, 0.62, 0.7];

export function PrivacyScreen({ progress }: { progress: MotionValue<number> }) {
  const indicatorX = useTransform(progress, STEPS, ["0%", "100%", "100%", "200%"]);
  const active = useDerived(progress, (v) => (v < 0.34 ? 0 : v < 0.66 ? 1 : 2));
  const audience = AUDIENCES[active];
  const friends = SAMPLE_ROSTER.filter((m) => m.isFriend);

  return (
    <div className="flex h-full flex-col px-4 pt-2">
      <p className="text-[11px] text-white/50">Mock House Party</p>
      <p className="text-lg font-semibold text-white">Who can see this?</p>

      <div className="relative mt-4 grid grid-cols-3 rounded-2xl bg-white/[0.06] p-1 text-[11px] font-medium">
        <motion.span
          style={{ x: indicatorX }}
          className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-xl bg-gradient-to-br from-violet-500 to-pink-500"
        />
        {AUDIENCES.map(({ label, icon: Icon }) => (
          <span
            key={label}
            className="relative z-10 flex flex-col items-center gap-1 py-2 text-white"
          >
            <Icon className="size-4" />
            {label}
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={audience.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="mt-3 min-h-[34px] text-[11px] leading-snug text-white/60"
        >
          {audience.summary}
        </motion.p>
      </AnimatePresence>

      <p className="mt-4 text-[10px] font-semibold tracking-wider text-white/45 uppercase">
        What others see
      </p>
      <ul className="mt-2 space-y-2">
        {friends.map((m) => (
          <li
            key={m.name}
            className={`flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2 transition-opacity duration-300 ${
              active === 2 ? "opacity-30" : "opacity-100"
            }`}
          >
            <span
              className="flex size-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
              style={{ background: `hsl(${m.hue} 80% 55%)` }}
            >
              {m.initials}
            </span>
            <span className="text-[12px] font-medium text-white">{m.name}</span>
            <span className="ml-auto text-[10px] text-emerald-300">Friend</span>
          </li>
        ))}
        {[0, 1].map((i) => (
          <li
            key={i}
            className={`flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2 transition-opacity duration-300 ${
              active === 0 ? "opacity-100" : "opacity-20"
            }`}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white/40">
              <UserRoundIcon className="size-4" />
            </span>
            <span className="h-2.5 w-20 rounded-full bg-white/15 blur-[1.5px]" />
            <span className="ml-auto text-[10px] text-white/40">Revealed on join</span>
          </li>
        ))}
      </ul>

      {active === 2 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-[11px] text-white/60">
          <LockIcon className="size-3.5" />
          Only invited people can open this link
        </div>
      )}
    </div>
  );
}
