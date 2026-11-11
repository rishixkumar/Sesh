import React, { Suspense } from "react";
import type { Metadata } from "next";
import { CreateMoveGroupForm } from "@/components/move-groups/create-move-group-form";
import { DetailPageSkeleton } from "@/components/shared/loading-skeletons";

export const metadata: Metadata = {
  title: "Start a Move Group · Sesh",
  description:
    "Coordinate pre-meetup spots, rideshares, and walk-ins with fellow Georgia Tech students.",
};

export default function NewMoveGroupPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Suspense fallback={<DetailPageSkeleton />}>
        <CreateMoveGroupForm />
      </Suspense>
    </div>
  );
}
