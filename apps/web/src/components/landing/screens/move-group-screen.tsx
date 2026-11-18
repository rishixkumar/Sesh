"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { UsersIcon, UserPlusIcon } from "lucide-react";
import { SAMPLE_ROSTER, type SampleMember } from "@/lib/landing/content";
import { useDerived, useRange } from "@/components/landing/use-scroll-helpers";

const JOIN_START = 0.08;
const JOIN_SPAN = 0.6;

function joinAt(index: number) {
  return JOIN_START + (index / SAMPLE_ROSTER.length) * JOIN_SPAN;
}

function Avatar({
  member,
  progress,
  index,
}: {
  member: SampleMember;
  progress: MotionValue<number>;
  index: number;
}) {
  const t = useRange(progress, joinAt(index), joinAt(index) + 0.06);
  const scale = useTransform(t, [0, 0.7, 1], [0, 1.15, 1]);

  return (
    <motion.div
      style={{
        scale,
        opacity: t,
        background: member.isFriend
          ? `linear-gradient(135deg, hsl(${member.hue} 85% 62%), hsl(${(member.hue + 40) % 360} 85% 48%))`
          : undefined,
      }}
      className={`-ml-2 flex size-10 items-center justify-center rounded-full border-2 border-[#0c0a12] text-[12px] font-semibold first:ml-0 ${
        member.isFriend ? "text-white" : "bg-white/10 text-white/50"
      }`}
    >
      {member.initials}
    </motion.div>
  );
}

export function MoveGroupScreen({ progress }: { progress: MotionValue<number> }) {
  const joined = useDerived(progress, (v) =>
    SAMPLE_ROSTER.filter((_, i) => v >= joinAt(i) + 0.03).length
  );
  const friends = SAMPLE_ROSTER.slice(0, joined).filter((m) => m.isFriend);
  const others = joined - friends.length;

  const requestT = useRange(progress, 0.78, 0.88);
  const requestY = useTransform(requestT, [0, 1], [40, 0]);

  return (
    <div className="flex h-full flex-col px-4 pt-2">
      <p className="text-[11px] text-white/50">Move Group</p>
      <p className="text-lg font-semibold text-white">Rooftop Crew</p>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <p className="text-[10px] font-semibold tracking-wider text-white/45 uppercase">
          Heading to
        </p>
        <p className="mt-0.5 text-[13px] font-semibold text-white">
          Lorem Ipsum Rooftop
        </p>
        <p className="text-[11px] text-white/55">Tonight · meet 8:30 PM</p>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-white">
          <UsersIcon className="size-4 text-fuchsia-300" />
          Roster
        </p>
        <p className="text-[11px] font-medium tabular-nums text-fuchsia-200">
          {friends.length} {friends.length === 1 ? "friend" : "friends"} + {others}{" "}
          {others === 1 ? "other" : "others"}
        </p>
      </div>

      <div className="mt-3 flex">
        {SAMPLE_ROSTER.map((member, i) => (
          <Avatar key={i} member={member} progress={progress} index={i} />
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {SAMPLE_ROSTER.filter((m) => m.isFriend).map((member, i) => (
          <li
            key={member.name}
            className={`flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-[12px] transition-opacity duration-300 ${
              i < friends.length ? "opacity-100" : "opacity-20"
            }`}
          >
            <span className="font-medium text-white">{member.name}</span>
            <span className="text-[10px] text-emerald-300">Friend · going</span>
          </li>
        ))}
        <li
          className={`rounded-xl bg-white/[0.04] px-3 py-2 text-[12px] text-white/50 transition-opacity duration-300 ${
            others > 0 ? "opacity-100" : "opacity-20"
          }`}
        >
          + {others} {others === 1 ? "other" : "others"} joined
        </li>
      </ul>

      <motion.div
        style={{ opacity: requestT, y: requestY }}
        className="mt-auto mb-6 flex items-center gap-3 rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/15 p-3"
      >
        <UserPlusIcon className="size-5 shrink-0 text-fuchsia-200" />
        <div className="flex-1 text-[11px] leading-snug text-white/80">
          Someone asked to join your group
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-black">
          Approve
        </span>
      </motion.div>
    </div>
  );
}
