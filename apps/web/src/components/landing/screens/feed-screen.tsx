"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { MapPinIcon, RadioIcon } from "lucide-react";
import {
  FEED_BUCKETS,
  SAMPLE_EVENTS,
  type FeedBucket,
  type SampleEvent,
} from "@/lib/landing/content";
import { useRange } from "@/components/landing/use-scroll-helpers";

const CARD_H = 84;
const GAP = 8;
const HEADER_H = 28;
const GROUP_H = HEADER_H + GAP + 2 * (CARD_H + GAP);

/** Progress points where the feed advances to the next bucket. */
const STEPS = [0.3, 0.4, 0.62, 0.72];

const TAB_LABELS: Record<FeedBucket, string> = {
  "Happening Now": "Now",
  Tonight: "Tonight",
  "This Weekend": "Weekend",
};

function BucketHeader({
  bucket,
  progress,
  enterAt,
  live,
}: {
  bucket: FeedBucket;
  progress: MotionValue<number>;
  enterAt: number;
  live: boolean;
}) {
  const opacity = useRange(progress, enterAt - 0.04, enterAt);
  return (
    <motion.div
      style={{ opacity, height: HEADER_H, marginBottom: GAP }}
      className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-white/70 uppercase"
    >
      {live && <RadioIcon className="size-3.5 animate-pulse text-rose-400" />}
      {bucket}
    </motion.div>
  );
}

function FeedCard({
  event,
  progress,
  enterAt,
}: {
  event: SampleEvent;
  progress: MotionValue<number>;
  enterAt: number;
}) {
  const t = useRange(progress, enterAt, enterAt + 0.1);
  const x = useTransform(t, [0, 1], [60, 0]);
  const opacity = useTransform(t, [0, 1], [0, 1]);

  return (
    <motion.div
      style={{ x, opacity, height: CARD_H, marginBottom: GAP }}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5"
    >
      <div
        className="size-16 shrink-0 rounded-xl"
        style={{
          background: `linear-gradient(135deg, hsl(${event.hue} 85% 60%), hsl(${(event.hue + 40) % 360} 90% 45%))`,
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-white">
            {event.title}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-white/55">
          <MapPinIcon className="size-3 shrink-0" />
          {event.venue}
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-fuchsia-300">
            {event.time}
          </span>
          <span className="text-[10px] text-white/45">{event.going} going</span>
        </div>
      </div>
    </motion.div>
  );
}

export function FeedScreen({ progress }: { progress: MotionValue<number> }) {
  const listY = useTransform(progress, STEPS, [0, -GROUP_H, -GROUP_H, -2 * GROUP_H]);
  const indicatorX = useTransform(progress, STEPS, ["0%", "100%", "100%", "200%"]);

  return (
    <div className="flex h-full flex-col px-4">
      <div className="flex items-center justify-between pt-2 pb-3">
        <div>
          <p className="text-[11px] text-white/50">Near Georgia Tech</p>
          <p className="text-lg font-semibold text-white">What&apos;s the move?</p>
        </div>
        <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-amber-200 uppercase">
          Sample data
        </span>
      </div>

      <div className="relative mb-3 grid grid-cols-3 rounded-full bg-white/[0.06] p-1 text-center text-[11px] font-medium">
        <motion.span
          style={{ x: indicatorX }}
          className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-white"
        />
        {FEED_BUCKETS.map((bucket) => (
          <span key={bucket} className="relative z-10 py-1 mix-blend-difference text-white">
            {TAB_LABELS[bucket]}
          </span>
        ))}
      </div>

      <div className="relative flex-1 overflow-hidden">
        <motion.div style={{ y: listY }}>
          {FEED_BUCKETS.map((bucket, groupIndex) => {
            const groupStart = groupIndex === 0 ? 0.02 : STEPS[groupIndex * 2 - 2] + 0.02;
            return (
              <div key={bucket}>
                <BucketHeader
                  bucket={bucket}
                  progress={progress}
                  enterAt={groupStart}
                  live={groupIndex === 0}
                />
                {SAMPLE_EVENTS.filter((e) => e.bucket === bucket).map((event, i) => (
                  <FeedCard
                    key={event.id}
                    event={event}
                    progress={progress}
                    enterAt={groupStart + i * 0.06}
                  />
                ))}
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
