import React from "react";
import Link from "next/link";
import { ArrowLeftIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export default function MoveGroupNotFound() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">
            <ArrowLeftIcon className="size-4" />
            Back to Campus Hub
          </Link>
        </Button>
      </div>

      <EmptyState
        icon={<UsersIcon className="size-6" />}
        title="Move Group not found"
        description="This Move Group doesn't exist or may have been removed from your local demo store."
        action={
          <Button asChild>
            <Link href="/">Browse Campus Hub</Link>
          </Button>
        }
        secondaryAction={
          <Button asChild variant="outline">
            <Link href="/move-groups/new">Start a Move Group</Link>
          </Button>
        }
      />
    </div>
  );
}
