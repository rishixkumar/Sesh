import { Suspense } from "react";
import type { Metadata } from "next";
import { EventDetailView } from "@/components/events/event-detail-view";
import { DetailPageSkeleton } from "@/components/shared/loading-skeletons";
import { getServerSafePublicEventMetadata } from "@/lib/data/adapter";

async function buildCachedPublicMetadata(id: string): Promise<Metadata> {
  "use cache";
  const publicMeta = getServerSafePublicEventMetadata(id);

  if (!publicMeta) {
    return {
      title: "Campus Move",
      description: "View event details on Sesh Georgia Tech.",
    };
  }

  const description = `${publicMeta.category} · ${publicMeta.publicDisplayLocation} · ${publicMeta.admissionLabel}`;

  return {
    title: `${publicMeta.title} | Sesh GT`,
    description,
    openGraph: {
      title: publicMeta.title,
      description,
      type: "website",
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return buildCachedPublicMetadata(id);
}

async function EventDetailLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EventDetailView eventId={id} />;
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl py-4">
      <Suspense fallback={<DetailPageSkeleton />}>
        <EventDetailLoader params={params} />
      </Suspense>
    </div>
  );
}
