import Link from "next/link";
import { ArrowLeftIcon, CalendarX2Icon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function EventNotFound() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 py-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">
            <ArrowLeftIcon className="size-4" />
            <span>Back to Events Hub</span>
          </Link>
        </Button>
      </div>

      <EmptyState
        icon={<CalendarX2Icon className="size-6" />}
        title="Move Not Found"
        description="The campus Move you're looking for doesn't exist or is no longer available."
        action={
          <Button asChild>
            <Link href="/">Browse Campus Moves</Link>
          </Button>
        }
      />
    </div>
  );
}
