"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BellIcon,
  PlusIcon,
  SearchIcon,
  UserCircle2Icon,
  ZapIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { DemoIdentitySwitcher } from "@/components/layout/demo-identity-switcher";
import { useSesh } from "@/lib/context/sesh-provider";
import { CAMPUS_NAME } from "@/types/domain";
import { cn } from "@/lib/utils";

function HeaderQuickSearch() {
  const router = useRouter();
  const [inlineQuery, setInlineQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogQuery, setDialogQuery] = useState("");

  const handleInlineSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = inlineQuery.trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
  };

  const handleDialogSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = dialogQuery.trim();
    setDialogOpen(false);
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
  };

  return (
    <>
      <form
        role="search"
        aria-label="Quick search campus moves"
        onSubmit={handleInlineSubmit}
        className="relative hidden lg:block lg:w-48 xl:w-60"
      >
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={inlineQuery}
          onChange={(e) => setInlineQuery(e.target.value)}
          placeholder="Search GT moves, venues..."
          aria-label="Search Georgia Tech moves and venues"
          className="h-8 pr-2.5 pl-8 text-xs"
        />
      </form>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Search campus moves"
        title="Search Moves"
        onClick={() => setDialogOpen(true)}
        className="lg:hidden"
      >
        <SearchIcon className="size-4" />
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Georgia Tech Moves</DialogTitle>
            <DialogDescription>
              Jump to the Events Hub filtered by event title, venue, campus
              spot, category, or host.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDialogSubmit} className="space-y-4">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                autoFocus
                value={dialogQuery}
                onChange={(e) => setDialogQuery(e.target.value)}
                placeholder="Try Tech Square, West Midtown, concerts..."
                aria-label="Search query"
                className="h-9 pl-9"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Search Hub</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function HeaderUtilityLinksInner({
  pendingAlertCount,
}: {
  pendingAlertCount: number;
}) {
  const pathname = usePathname();
  const { isHydrated } = useSesh();
  const isNotifications =
    isHydrated &&
    (pathname === "/notifications" || pathname.startsWith("/notifications/"));
  const isProfile =
    isHydrated && (pathname === "/profile" || pathname.startsWith("/profile/"));

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={isNotifications ? "secondary" : "ghost"}
        size="icon"
        asChild
        className="relative"
      >
        <Link
          href="/notifications"
          title="Notifications"
          aria-label={
            pendingAlertCount > 0
              ? `Notifications (${pendingAlertCount} prototype activity items)`
              : "Notifications"
          }
          aria-current={isNotifications ? "page" : undefined}
        >
          <BellIcon className="size-4" />
          {pendingAlertCount > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 size-2 rounded-full bg-amber-500 ring-2 ring-background"
            />
          ) : null}
        </Link>
      </Button>

      <Button
        variant={isProfile ? "secondary" : "ghost"}
        size="icon"
        asChild
        className="hidden md:inline-flex"
      >
        <Link
          href="/profile"
          title="Demo Profile & Data"
          aria-label="Profile and demo settings"
          aria-current={isProfile ? "page" : undefined}
        >
          <UserCircle2Icon
            className={cn("size-4", isProfile && "text-primary")}
          />
        </Link>
      </Button>
    </div>
  );
}

function HeaderUtilityLinksFallback() {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" asChild>
        <Link href="/notifications" aria-label="Notifications">
          <BellIcon className="size-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        asChild
        className="hidden md:inline-flex"
      >
        <Link href="/profile" aria-label="Profile and demo settings">
          <UserCircle2Icon className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

export function SiteHeader() {
  const { adapter, viewer, revision } = useSesh();

  const pendingAlertCount = useMemo(() => {
    void revision;
    if (viewer.mode !== "MEMBER") return 0;
    const groups = adapter.listMoveGroups(viewer);
    return groups.reduce(
      (sum, group) =>
        sum + (group.ownerManagement?.pendingRequests.length ?? 0),
      0
    );
  }, [adapter, viewer, revision]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 lg:gap-5">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-lg py-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
              <ZapIcon className="size-4 fill-current" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                Sesh
              </span>
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-semibold tracking-wide"
              >
                <span className="hidden sm:inline">{CAMPUS_NAME} · </span>18+
              </Badge>
            </div>
          </Link>

          <DesktopNav />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <HeaderQuickSearch />

          <Button asChild size="default" className="hidden md:inline-flex">
            <Link href="/events/new">
              <PlusIcon className="size-4" />
              <span>Create a Move</span>
            </Link>
          </Button>

          <Suspense fallback={<HeaderUtilityLinksFallback />}>
            <HeaderUtilityLinksInner pendingAlertCount={pendingAlertCount} />
          </Suspense>

          <DemoIdentitySwitcher />
        </div>
      </div>
    </header>
  );
}
