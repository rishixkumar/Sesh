import React from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DemoSignInDialog } from "@/components/layout/demo-sign-in-dialog";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-primary-foreground focus:shadow-md"
      >
        Skip to main content
      </a>

      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-12 lg:px-8"
      >
        {children}
      </main>

      <MobileNav />
      <DemoSignInDialog />
    </div>
  );
}
