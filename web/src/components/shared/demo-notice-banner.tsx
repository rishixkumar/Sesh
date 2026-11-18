import React from "react";
import { FlaskConicalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemoNoticeBanner({
  title = "Browser-local Milestone 1 prototype",
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3.5 py-2.5 text-xs text-muted-foreground",
        className
      )}
    >
      <FlaskConicalIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div>
        <span className="font-medium text-foreground">{title}: </span>
        {children}
      </div>
    </div>
  );
}
