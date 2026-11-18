"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CompassIcon,
  MapPinIcon,
  PlusCircleIcon,
  UserCircle2Icon,
  UsersIcon,
} from "lucide-react";
import { useSesh } from "@/lib/context/sesh-provider";
import { cn } from "@/lib/utils";

interface MobileTabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isCreate?: boolean;
  match: (pathname: string) => boolean;
}

const MOBILE_TABS: MobileTabItem[] = [
  {
    href: "/",
    label: "Hub",
    icon: CompassIcon,
    match: (pathname) =>
      pathname === "/" ||
      (pathname.startsWith("/events/") && pathname !== "/events/new") ||
      pathname.startsWith("/move-groups/"),
  },
  {
    href: "/map",
    label: "Map",
    icon: MapPinIcon,
    match: (pathname) => pathname === "/map" || pathname.startsWith("/map/"),
  },
  {
    href: "/events/new",
    label: "Create",
    icon: PlusCircleIcon,
    isCreate: true,
    match: (pathname) => pathname === "/events/new",
  },
  {
    href: "/friends",
    label: "Friends",
    icon: UsersIcon,
    match: (pathname) =>
      pathname === "/friends" || pathname.startsWith("/friends/"),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserCircle2Icon,
    match: (pathname) =>
      pathname === "/profile" || pathname.startsWith("/profile/"),
  },
];

function MobileNavInner() {
  const pathname = usePathname();
  const { isHydrated } = useSesh();

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/85 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/85 md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-1">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = isHydrated && tab.match(pathname);

          return (
            <li key={tab.href} className="flex h-full items-center justify-center">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  tab.isCreate
                    ? isActive
                      ? "text-primary"
                      : "text-foreground"
                    : isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary"
                  />
                ) : null}

                {tab.isCreate ? (
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-primary/90 text-primary-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                ) : (
                  <Icon
                    className={cn(
                      "size-5 shrink-0 transition-transform",
                      isActive && "scale-105 text-primary"
                    )}
                  />
                )}

                <span className="leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MobileNavFallback() {
  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/85 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/85 md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-1">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex h-full items-center justify-center">
              <Link
                href={tab.href}
                className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-muted-foreground"
              >
                {tab.isCreate ? (
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/90 text-primary-foreground">
                    <Icon className="size-4" />
                  </span>
                ) : (
                  <Icon className="size-5 shrink-0" />
                )}
                <span className="leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav() {
  return (
    <Suspense fallback={<MobileNavFallback />}>
      <MobileNavInner />
    </Suspense>
  );
}
