"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CompassIcon,
  MapPinIcon,
  UsersIcon,
} from "lucide-react";
import { useSesh } from "@/lib/context/sesh-provider";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (pathname: string) => boolean;
}

const DESKTOP_NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Events Hub",
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
    href: "/friends",
    label: "Friends",
    icon: UsersIcon,
    match: (pathname) =>
      pathname === "/friends" || pathname.startsWith("/friends/"),
  },
];

function DesktopNavInner() {
  const pathname = usePathname();
  const { isHydrated } = useSesh();

  return (
    <nav
      aria-label="Primary campus navigation"
      className="hidden items-center gap-1 md:flex"
    >
      {DESKTOP_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = isHydrated && item.match(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "size-4 shrink-0",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function DesktopNavFallback() {
  return (
    <nav
      aria-label="Primary campus navigation"
      className="hidden items-center gap-1 md:flex"
    >
      {DESKTOP_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DesktopNav() {
  return (
    <Suspense fallback={<DesktopNavFallback />}>
      <DesktopNavInner />
    </Suspense>
  );
}
