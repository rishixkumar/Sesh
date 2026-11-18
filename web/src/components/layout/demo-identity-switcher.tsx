"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  EyeIcon,
  FlaskConicalIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSesh, type DemoIdentityChoice } from "@/lib/context/sesh-provider";
import { cn } from "@/lib/utils";

export interface DemoPersonaMeta {
  roleBadge: string;
  roleHint: string;
}

export const DEMO_PERSONA_META: Record<string, DemoPersonaMeta> = {
  "user-maya": {
    roleBadge: "Primary Host",
    roleHint:
      "Hosts Moves & Move Groups · has pending join requests to review",
  },
  "user-jordan": {
    roleBadge: "Friend Tester",
    roleHint:
      "In Maya's GT friend network · sees Friends-Only Moves & friend rosters",
  },
  "user-tyler": {
    roleBadge: "Non-Friend GT",
    roleHint:
      "Campus student outside Maya's friends · tests roster masking & join requests",
  },
};

export interface DemoIdentitySwitcherProps {
  compact?: boolean;
  className?: string;
}

export function DemoIdentitySwitcher({
  compact = false,
  className,
}: DemoIdentitySwitcherProps) {
  const { viewer, availableDemoUsers, setDemoIdentity } = useSesh();

  const activeValue: DemoIdentityChoice =
    viewer.mode === "GUEST" ? "GUEST" : viewer.user.id;

  const handleChange = (nextValue: string) => {
    if (nextValue === activeValue) return;
    setDemoIdentity(nextValue);
    if (nextValue === "GUEST") {
      toast.info("Switched Demo Identity to Guest (Unauthenticated)");
    } else {
      const matched = availableDemoUsers.find((u) => u.id === nextValue);
      if (matched) {
        toast.success(`Switched Demo Identity to ${matched.displayName}`);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={compact ? "sm" : "default"}
          aria-label="Switch Demo Identity (prototype simulation)"
          className={cn(
            "h-auto gap-2 border-amber-500/35 bg-amber-500/5 px-2.5 py-1 text-left hover:bg-amber-500/10 dark:border-amber-400/30 dark:bg-amber-400/10 dark:hover:bg-amber-400/15",
            compact ? "max-w-[11.5rem] py-1" : "py-1.5",
            className
          )}
        >
          {viewer.mode === "MEMBER" ? (
            <UserAvatar
              user={viewer.user}
              className={cn(
                "shrink-0 ring-1 ring-amber-500/30",
                compact ? "size-5" : "size-6"
              )}
            />
          ) : (
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border",
                compact ? "size-5" : "size-6"
              )}
            >
              <EyeIcon className="size-3.5" />
            </span>
          )}

          <span className="flex min-w-0 flex-col leading-tight">
            <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-amber-700 uppercase dark:text-amber-300">
              <FlaskConicalIcon className="size-2.5 shrink-0" />
              {compact ? "Demo ID" : "Demo Identity"}
            </span>
            <span className="truncate text-xs font-medium text-foreground">
              {viewer.mode === "MEMBER"
                ? compact
                  ? viewer.user.displayName.split(" ")[0]
                  : viewer.user.displayName
                : compact
                  ? "Guest"
                  : "Guest (Unauth)"}
            </span>
          </span>

          <ChevronDownIcon className="ml-0.5 size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-80 max-w-[calc(100vw-1.5rem)] p-1.5 sm:min-w-92"
      >
        <div className="mb-1.5 rounded-md border border-amber-500/25 bg-amber-500/8 px-2.5 py-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <FlaskConicalIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span>Demo Identity Switcher</span>
            <Badge
              variant="outline"
              className="ml-auto h-4 border-amber-500/40 px-1.5 text-[10px] text-amber-700 dark:text-amber-300"
            >
              Prototype Only
            </Badge>
          </div>
          <p className="mt-1 leading-relaxed text-muted-foreground">
            Frontend simulation only — not real authentication. Switch personas
            to test Guest restrictions, GT friend visibility, and Move Group
            roster masking.
          </p>
        </div>

        <DropdownMenuRadioGroup
          value={activeValue}
          onValueChange={handleChange}
        >
          <DropdownMenuLabel className="px-2 py-1 text-[11px] font-semibold tracking-wider uppercase">
            Unauthenticated Visitor
          </DropdownMenuLabel>

          <DropdownMenuRadioItem
            value="GUEST"
            className="items-start gap-2.5 py-2 pr-8 pl-2"
          >
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted text-muted-foreground">
              <EyeIcon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">
                  Guest (Unauthenticated)
                </span>
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  Unverified
                </Badge>
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Browses public Georgia Tech Moves only · social actions prompt
                demo sign-in
              </p>
            </div>
          </DropdownMenuRadioItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold tracking-wider uppercase">
            <SparklesIcon className="size-3 text-primary" />
            <span>Simulated Georgia Tech Members</span>
          </DropdownMenuLabel>

          {availableDemoUsers.map((user) => {
            const meta = DEMO_PERSONA_META[user.id] ?? {
              roleBadge: "GT Member",
              roleHint: user.bio ?? "Verified Georgia Tech demo student",
            };

            return (
              <DropdownMenuRadioItem
                key={user.id}
                value={user.id}
                className="items-start gap-2.5 py-2 pr-8 pl-2"
              >
                <UserAvatar user={user} className="mt-0.5 size-7 shrink-0" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      {user.displayName}
                    </span>
                    <CheckCircle2Icon
                      className="size-3 text-emerald-600 dark:text-emerald-400"
                      aria-label="Simulated verified GT student"
                    />
                    <Badge
                      variant="outline"
                      className="h-4 px-1.5 text-[10px] font-medium"
                    >
                      {meta.roleBadge}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    @{user.username}
                    {user.graduationYear ? ` · GT '${String(user.graduationYear).slice(-2)}` : ""}
                  </p>
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {meta.roleHint}
                  </p>
                </div>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer py-1.5 text-xs">
          <Link href="/profile" className="flex items-center gap-2">
            <SlidersHorizontalIcon className="size-3.5 text-muted-foreground" />
            <span>Manage Demo Profile & Reset Local Data</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
