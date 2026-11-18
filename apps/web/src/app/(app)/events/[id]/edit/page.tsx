import React, { Suspense } from "react";
import { DetailPageSkeleton } from "@/components/shared/loading-skeletons";
import { EditMoveView } from "@/components/moves/edit-move-view";

async function EditMoveLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditMoveView eventId={id} />;
}

export default function EditMovePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <DetailPageSkeleton />
        </div>
      }
    >
      <EditMoveLoader params={params} />
    </Suspense>
  );
}
