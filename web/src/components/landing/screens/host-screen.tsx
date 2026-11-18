"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import {
  CalendarIcon,
  CheckIcon,
  CopyIcon,
  LinkIcon,
  LockIcon,
  MessageCircleIcon,
  SendIcon,
  UsersIcon,
} from "lucide-react";
import { useDerived, useRange } from "@/components/landing/use-scroll-helpers";
import { cn } from "@/lib/utils";

const SAMPLE_TITLE = "Sample Backyard Kickback";
const POSTED_AT = 0.66;

function Field({
  icon: Icon,
  label,
  value,
  visible,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  visible: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300",
        highlight ? "border-amber-300/40 bg-amber-300/10" : "border-white/10 bg-white/[0.04]",
        visible ? "opacity-100" : "opacity-30"
      )}
    >
      <Icon className={cn("size-4 shrink-0", highlight ? "text-amber-200" : "text-white/50")} />
      <div className="min-w-0">
        <p className="text-[10px] text-white/45">{label}</p>
        <p className="truncate text-[12px] font-medium text-white">{visible ? value : "—"}</p>
      </div>
    </div>
  );
}

export function HostScreen({ progress }: { progress: MotionValue<number> }) {
  const typed = useDerived(progress, (v) =>
    Math.round(Math.min(Math.max(v / 0.22, 0), 1) * SAMPLE_TITLE.length)
  );
  const step = useDerived(progress, (v) =>
    v < 0.28 ? 0 : v < 0.38 ? 1 : v < 0.48 ? 2 : v < POSTED_AT ? 3 : 4
  );
  const postedT = useRange(progress, POSTED_AT, POSTED_AT + 0.06);
  const postedScale = useTransform(postedT, [0, 1], [0.9, 1]);

  return (
    <div className="relative flex h-full flex-col px-4 pt-2">
      <p className="text-[11px] text-white/50">Host</p>
      <p className="text-lg font-semibold text-white">New move</p>

      <div className="mt-4 rounded-xl border border-fuchsia-400/40 bg-white/[0.04] px-3 py-2.5">
        <p className="text-[10px] text-white/45">Title</p>
        <p className="text-[14px] font-semibold text-white">
          {SAMPLE_TITLE.slice(0, typed)}
          {typed < SAMPLE_TITLE.length && (
            <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-fuchsia-300" />
          )}
        </p>
      </div>

      <div className="mt-2 space-y-2">
        <Field icon={CalendarIcon} label="When" value="Sat · 9 PM" visible={step >= 1} />
        <Field
          icon={LockIcon}
          label="Address"
          value="Hidden until you approve guests"
          visible={step >= 2}
          highlight={step >= 2}
        />
        <Field icon={UsersIcon} label="Audience" value="Friends + requests" visible={step >= 3} />
      </div>

      <div
        className={cn(
          "mt-auto mb-6 flex items-center justify-center gap-2 rounded-full py-3 text-[13px] font-semibold transition-all duration-300",
          step >= 3
            ? "bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 text-white shadow-[0_0_30px_rgba(236,72,153,0.5)]"
            : "bg-white/10 text-white/40"
        )}
      >
        <SendIcon className="size-4" />
        Post move
      </div>

      <motion.div
        style={{ opacity: postedT, scale: postedScale }}
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-[#0c0a12]/90 backdrop-blur-sm"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500">
          <CheckIcon className="size-7 text-white" />
        </span>
        <p className="mt-3 text-[15px] font-semibold text-white">Posted in 0:48</p>
        <p className="mt-1 text-[11px] text-white/55">Now send it anywhere</p>
      </motion.div>
    </div>
  );
}

/** Share sheet that floats out beside the phone once the move is posted. */
export function HostShareCard({
  progress,
  className,
}: {
  progress: MotionValue<number>;
  className?: string;
}) {
  const t = useRange(progress, 0.74, 0.86);
  const y = useTransform(t, [0, 1], [40, 0]);
  const rotate = useTransform(t, [0, 1], [-6, -3]);

  return (
    <motion.div
      style={{ opacity: t, y, rotate }}
      className={cn(
        "w-60 rounded-2xl border border-white/15 bg-zinc-900/90 p-4 shadow-2xl backdrop-blur",
        className
      )}
      aria-hidden
    >
      <div className="h-20 rounded-xl bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400" />
      <p className="mt-3 text-sm font-semibold text-white">{SAMPLE_TITLE}</p>
      <p className="text-xs text-white/55">Sat · 9 PM · address on approval</p>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] text-white/70">
        <LinkIcon className="size-3.5" />
        <span className="truncate">sesh.app/m/sample-kickback</span>
        <CopyIcon className="ml-auto size-3.5" />
      </div>
      <div className="mt-3 flex gap-2">
        {[MessageCircleIcon, SendIcon, LinkIcon].map((Icon, i) => (
          <span
            key={i}
            className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <Icon className="size-4" />
          </span>
        ))}
      </div>
    </motion.div>
  );
}
