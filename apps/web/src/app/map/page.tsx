import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CompassIcon,
  LayersIcon,
  LockIcon,
  MapPinIcon,
  NavigationIcon,
  SparklesIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DemoNoticeBanner } from "@/components/shared/demo-notice-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CAMPUS_AREA_LABEL } from "@/types/domain";

export const metadata: Metadata = {
  title: "Campus Map",
  description:
    "Preview Georgia Tech & Midtown Atlanta campus corridors on Sesh. Interactive PostGIS geospatial map pins arrive in a later milestone.",
};

const CAMPUS_CORRIDORS = [
  {
    name: "Tech Green & Central Campus",
    query: "Tech Green",
    tag: "On-Campus",
    summary:
      "Student org pop-ups, Campanile meetups, and campus quad warm-ups.",
  },
  {
    name: "Tech Square & Midtown",
    query: "Tech Square",
    tag: "Walkable",
    summary:
      "Patio trivia, founder mixers at Coda, and 5th Street rideshare hubs.",
  },
  {
    name: "Home Park",
    query: "Home Park",
    tag: "Privacy-Masked",
    summary:
      "Student house kickbacks where exact street numbers stay hidden until RSVP or group approval.",
  },
  {
    name: "West Midtown",
    query: "West Midtown",
    tag: "Nightlife · 18+",
    summary:
      "Warehouse DJ sets, listening rooms, and coordinated XL rideshare splits.",
  },
  {
    name: "BeltLine & Poncey-Highland",
    query: "BeltLine",
    tag: "MARTA + Rideshare",
    summary:
      "Live indie showcases, rooftop dance floors, and weekend group outings.",
  },
  {
    name: "Bobby Dodd & West Campus",
    query: "Campus",
    tag: "Sports & Rec",
    summary:
      "Game-day tailgates on North Ave Lawn and late-night CRC turf tournaments.",
  },
] as const;

export default function CampusMapPlaceholderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <>
            <MapPinIcon className="size-3.5 text-primary" />
            <span>{CAMPUS_AREA_LABEL}</span>
          </>
        }
        title="Campus Map"
        description="Explore how Sesh organizes Moves across Georgia Tech and Midtown Atlanta neighborhoods while keeping private student addresses protected."
        actions={
          <Button asChild>
            <Link href="/">
              <CompassIcon className="size-4" />
              <span>Back to Events Hub</span>
            </Link>
          </Button>
        }
      />

      <DemoNoticeBanner title="Deferred to Geospatial Milestone">
        Interactive map rendering and PostGIS radius queries are intentionally
        excluded from Milestone 1 so we can validate core event discovery, Move
        Group coordination, and privacy rules first — without bundling a heavy
        client map SDK prematurely.
      </DemoNoticeBanner>

      <EmptyState
        icon={<NavigationIcon className="size-6" />}
        title="Interactive Campus Map & PostGIS Pins Coming Soon"
        description="In an upcoming milestone, you'll be able to pan across Georgia Tech, Midtown, West Midtown, and the BeltLine to spot live Moves, MARTA meetup points, and time-window heatmaps."
        action={
          <Button asChild>
            <Link href="/">
              <ArrowLeftIcon className="size-4" />
              <span>Browse Live Moves in Events Hub</span>
            </Link>
          </Button>
        }
        secondaryAction={
          <Button variant="outline" asChild>
            <Link href="/events/new">Create a Move</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LockIcon className="size-4 text-primary" />
              <CardTitle>Privacy-First Geospatial Pins</CardTitle>
            </div>
            <CardDescription>
              Public venues vs. private student residences are projected
              differently by design.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs leading-relaxed text-muted-foreground">
            Commercial venues and campus landmarks display exact coordinates,
            whereas house parties and loft gatherings render only an approximate
            neighborhood ring (such as{" "}
            <span className="font-medium text-foreground">Home Park</span>)
            until a verified student satisfies the host&apos;s RSVP or Move
            Group unlock rule.
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LayersIcon className="size-4 text-primary" />
              <CardTitle>Planned PostGIS Capabilities</CardTitle>
            </div>
            <CardDescription>
              Server-indexed spatial filtering slated for the backend milestone.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs leading-relaxed text-muted-foreground">
            Upcoming spatial endpoints will support walkable radius queries from
            Tech Green, Move Group departure clustering (e.g., Tech Square &
            North Ave MARTA), and live{" "}
            <span className="font-medium text-foreground">Happening Now</span>{" "}
            corridor filters.
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="corridors-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="corridors-heading"
            className="flex items-center gap-2 text-base font-semibold text-foreground"
          >
            <SparklesIcon className="size-4 text-primary" />
            <span>Jump to Hub by Georgia Tech & Atlanta Corridor</span>
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAMPUS_CORRIDORS.map((corridor) => (
            <Card key={corridor.name} size="sm" className="justify-between">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold">
                    {corridor.name}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {corridor.tag}
                  </Badge>
                </div>
                <CardDescription className="text-xs leading-relaxed">
                  {corridor.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/?q=${encodeURIComponent(corridor.query)}`}>
                    Filter Hub: &ldquo;{corridor.query}&rdquo;
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
