"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { STORY_CHAPTERS, type StoryChapter } from "@/lib/landing/content";
import { PhoneFrame } from "@/components/landing/phone-frame";
import { FeedScreen } from "@/components/landing/screens/feed-screen";
import { MoveGroupScreen } from "@/components/landing/screens/move-group-screen";
import { PrivacyScreen } from "@/components/landing/screens/privacy-screen";
import { LocationScreen } from "@/components/landing/screens/location-screen";
import { HostScreen, HostShareCard } from "@/components/landing/screens/host-screen";
import { useDerived } from "@/components/landing/use-scroll-helpers";
import { cn } from "@/lib/utils";

type ChapterId = StoryChapter["id"];

const SCREENS: Record<ChapterId, React.ComponentType<{ progress: MotionValue<number> }>> = {
  feed: FeedScreen,
  groups: MoveGroupScreen,
  privacy: PrivacyScreen,
  location: LocationScreen,
  host: HostScreen,
};

const GLOW: Record<ChapterId, string> = {
  feed: "rgba(236,72,153,0.35)",
  groups: "rgba(168,85,247,0.35)",
  privacy: "rgba(99,102,241,0.35)",
  location: "rgba(14,165,233,0.3)",
  host: "rgba(251,146,60,0.32)",
};

/** Representative frame for each chapter when motion is reduced. */
const STATIC_PROGRESS: Record<ChapterId, number> = {
  feed: 0.25,
  groups: 1,
  privacy: 0.2,
  location: 0.6,
  host: 1,
};

const TOTAL_WEIGHT = STORY_CHAPTERS.reduce((sum, c) => sum + c.weight, 0);
const BOUNDS = STORY_CHAPTERS.reduce<{ start: number; end: number }[]>((acc, c) => {
  const start = acc.length ? acc[acc.length - 1].end : 0;
  acc.push({ start, end: start + c.weight / TOTAL_WEIGHT });
  return acc;
}, []);

const PHONE_SIZE = "h-[min(54svh,560px)] md:h-[min(78svh,680px)]";

function ChapterCopy({
  chapter,
  index,
  as: Heading = "h2",
}: {
  chapter: StoryChapter;
  index: number;
  as?: "h2" | "h3";
}) {
  return (
    <>
      <p className="text-xs font-semibold tracking-[0.2em] text-fuchsia-300 uppercase sm:text-sm">
        <span className="text-white/40 tabular-nums">{`0${index + 1} · `}</span>
        {chapter.eyebrow}
      </p>
      <Heading className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white sm:text-5xl">
        {chapter.title}
      </Heading>
      <p className="mt-3 text-sm leading-relaxed text-pretty text-white/65 sm:mt-4 sm:text-lg">
        {chapter.body}
      </p>
    </>
  );
}

function PinnedScreen({
  id,
  progress,
  bounds,
  active,
}: {
  id: ChapterId;
  progress: MotionValue<number>;
  bounds: { start: number; end: number };
  active: boolean;
}) {
  const local = useTransform(progress, [bounds.start, bounds.end], [0, 1], {
    clamp: true,
  });
  const Screen = SCREENS[id];

  return (
    <motion.div
      initial={false}
      animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.96 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="absolute inset-0 top-10"
      aria-hidden={!active}
    >
      <Screen progress={local} />
    </motion.div>
  );
}

function ProgressRail({
  progress,
  activeIndex,
}: {
  progress: MotionValue<number>;
  activeIndex: number;
}) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {BOUNDS.map((b, i) => (
        <RailSegment key={i} progress={progress} bounds={b} active={i === activeIndex} />
      ))}
    </div>
  );
}

function RailSegment({
  progress,
  bounds,
  active,
}: {
  progress: MotionValue<number>;
  bounds: { start: number; end: number };
  active: boolean;
}) {
  const scaleX = useTransform(progress, [bounds.start, bounds.end], [0, 1], { clamp: true });
  return (
    <span
      className={cn(
        "h-1 overflow-hidden rounded-full bg-white/15 transition-all duration-300",
        active ? "w-10" : "w-4"
      )}
    >
      <motion.span style={{ scaleX }} className="block h-full origin-left bg-white" />
    </span>
  );
}

function PinnedStory() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const activeIndex = useDerived(scrollYProgress, (v) => {
    const i = BOUNDS.findIndex((b) => v < b.end);
    return i === -1 ? BOUNDS.length - 1 : i;
  });
  const activeId = STORY_CHAPTERS[activeIndex].id;
  const hostBounds = BOUNDS[BOUNDS.length - 1];
  const hostProgress = useTransform(scrollYProgress, [hostBounds.start, hostBounds.end], [0, 1], {
    clamp: true,
  });

  return (
    <section
      ref={ref}
      aria-label="What Sesh does"
      style={{ height: `${(TOTAL_WEIGHT + 1) * 100}svh` }}
      className="relative"
    >
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center gap-6 overflow-x-clip px-6 pt-14 md:flex-row md:gap-20 md:pt-0">
        <motion.div
          aria-hidden
          animate={{ background: `radial-gradient(circle at 70% 50%, ${GLOW[activeId]}, transparent 55%)` }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none absolute inset-0"
        />

        <div className="relative w-full max-w-md text-center md:text-left">
          <div className="grid">
            {STORY_CHAPTERS.map((chapter, i) => (
              <motion.div
                key={chapter.id}
                initial={false}
                animate={{
                  opacity: i === activeIndex ? 1 : 0,
                  y: i === activeIndex ? 0 : i < activeIndex ? -24 : 24,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="[grid-area:1/1]"
                style={{ pointerEvents: i === activeIndex ? "auto" : "none" }}
              >
                <ChapterCopy chapter={chapter} index={i} />
              </motion.div>
            ))}
          </div>
          <div className="mt-6 hidden justify-center md:flex md:justify-start">
            <ProgressRail progress={scrollYProgress} activeIndex={activeIndex} />
          </div>
        </div>

        <div className="relative">
          <PhoneFrame className={PHONE_SIZE}>
            {STORY_CHAPTERS.map((chapter, i) => (
              <PinnedScreen
                key={chapter.id}
                id={chapter.id}
                progress={scrollYProgress}
                bounds={BOUNDS[i]}
                active={i === activeIndex}
              />
            ))}
          </PhoneFrame>
          <HostShareCard
            progress={hostProgress}
            className="absolute -bottom-4 -left-24 scale-75 sm:scale-90 md:-bottom-6 md:-left-40 md:scale-100"
          />
        </div>
      </div>
    </section>
  );
}

function StaticChapter({ chapter, index }: { chapter: StoryChapter; index: number }) {
  const progress = useMotionValue(STATIC_PROGRESS[chapter.id]);
  const Screen = SCREENS[chapter.id];

  return (
    <section className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 py-20 md:flex-row md:gap-20">
      <div className="max-w-md text-center md:text-left">
        <ChapterCopy chapter={chapter} index={index} />
      </div>
      <div className="relative">
        <PhoneFrame className={PHONE_SIZE}>
          <div className="absolute inset-0 top-10">
            <Screen progress={progress} />
          </div>
        </PhoneFrame>
        {chapter.id === "host" && (
          <HostShareCard
            progress={progress}
            className="absolute -bottom-4 -left-24 scale-75 md:-left-40 md:scale-100"
          />
        )}
      </div>
    </section>
  );
}

export function FeatureStory({ reduced }: { reduced: boolean }) {
  if (reduced) {
    return (
      <div aria-label="What Sesh does">
        {STORY_CHAPTERS.map((chapter, i) => (
          <StaticChapter key={chapter.id} chapter={chapter} index={i} />
        ))}
      </div>
    );
  }
  return <PinnedStory />;
}
