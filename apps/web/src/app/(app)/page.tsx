import { Suspense } from "react";
import type { Metadata } from "next";
import { EventsHub } from "@/components/events/events-hub";
import { EventGridSkeleton } from "@/components/shared/loading-skeletons";

export const metadata: Metadata = {
  title: "Georgia Tech Events Hub | Sesh",
  description:
    "Discover 18+ campus events, nightlife, club nights, sports, concerts, and coordinated Move Groups around Georgia Tech and Midtown Atlanta.",
};

export default function HomePage() {
  return (
    <Suspense fallback={<EventGridSkeleton count={6} />}>
      <EventsHub />
    </Suspense>
  );
}
