"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Sparkles, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoNoticeBanner } from "@/components/shared/demo-notice-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailPageSkeleton } from "@/components/shared/loading-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import { MoveForm } from "@/components/moves/move-form";
import { useSesh } from "@/lib/context/sesh-provider";

export default function NewMovePage() {
  const { viewer, isHydrated, requireDemoMember } = useSesh();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow={
          <>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Campus Feed
            </Link>
            <span>·</span>
            <Badge variant="outline">
              <Sparkles className="size-3" />
              Host on Sesh
            </Badge>
          </>
        }
        title="Create a Move"
        description="A Move is a user-created campus event — like a house party, org social, or rooftop pre-game (distinct from a Move Group, which is a small crew coordinating how to attend an event together)."
      />

      {!isHydrated ? (
        <DetailPageSkeleton />
      ) : viewer.mode === "GUEST" ? (
        <div className="space-y-6">
          <DemoNoticeBanner>
            Guest visitors can browse public Georgia Tech events, while hosting
            or drafting a Move requires a student session (simulated via Demo
            Member personas in Milestone 1).
          </DemoNoticeBanner>

          <EmptyState
            icon={<Lock className="size-6" />}
            title="Student session required to create a Move"
            description="Switch from Guest mode to a Georgia Tech Demo Member in one click to draft or publish a Move in your browser."
            action={
              <Button
                type="button"
                onClick={() => requireDemoMember("publish or draft a Move")}
              >
                <UserCheck className="size-4" />
                Switch to Demo Member
              </Button>
            }
            secondaryAction={
              <Button variant="outline" asChild>
                <Link href="/">Browse Campus Events</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <MoveForm key={viewer.user.id} mode="create" />
      )}
    </div>
  );
}
