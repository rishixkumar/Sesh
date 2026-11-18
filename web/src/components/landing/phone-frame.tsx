"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Screens are authored at this fixed size and scaled to fit the frame. */
export const SCREEN_WIDTH = 300;
export const SCREEN_HEIGHT = 640;

export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / SCREEN_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden
      className={cn(
        "relative aspect-[300/640] shrink-0 rounded-[2.75rem] border border-white/15 bg-zinc-950 p-[3%] shadow-[0_30px_120px_-30px_rgba(217,70,239,0.55)]",
        className
      )}
    >
      <div
        ref={viewportRef}
        className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-[#0c0a12]"
      >
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          <StatusBar />
          {children}
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div
      aria-hidden
      className="relative z-30 flex h-10 items-center justify-between px-6 text-[11px] font-semibold text-white"
    >
      <span>9:41</span>
      <span className="absolute top-2.5 left-1/2 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1">
        <span className="flex items-end gap-px">
          {[4, 6, 8, 10].map((h) => (
            <span key={h} className="w-[3px] rounded-sm bg-white" style={{ height: h }} />
          ))}
        </span>
        <span className="ml-1 h-[10px] w-[20px] rounded-[3px] border border-white/70 p-px">
          <span className="block h-full w-3/4 rounded-[1px] bg-white" />
        </span>
      </span>
    </div>
  );
}
