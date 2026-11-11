import React, { Suspense } from "react";
import type { Metadata } from "next";
import { MoveGroupManageView } from "@/components/move-groups/move-group-manage-view";
import { DetailPageSkeleton } from "@/components/shared/loading-skeletons";

export const metadata: Metadata = {
  title: "Manage Move Group · Sesh",
  description:
    "Review pending join requests, manage crew members, and update Move Group coordination settings.",
};

async function MoveGroupManageRouteContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MoveGroupManageView groupId={id} />;
}

export default function MoveGroupManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <Suspense fallback={<DetailPageSkeleton />}>
        <MoveGroupManageRouteContent params={params} />
      </Suspense>
    </div>
  );
}
