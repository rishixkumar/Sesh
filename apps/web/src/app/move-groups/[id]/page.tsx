import React, { Suspense } from "react";
import type { Metadata } from "next";
import { MoveGroupDetailView } from "@/components/move-groups/move-group-detail-view";
import { DetailPageSkeleton } from "@/components/shared/loading-skeletons";

export const metadata: Metadata = {
  title: "Move Group · Sesh",
  description:
    "Student crew meetup details, privacy-projected roster, and coordination on Sesh.",
};

async function MoveGroupDetailRouteContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MoveGroupDetailView groupId={id} />;
}

export default function MoveGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Suspense fallback={<DetailPageSkeleton />}>
        <MoveGroupDetailRouteContent params={params} />
      </Suspense>
    </div>
  );
}
