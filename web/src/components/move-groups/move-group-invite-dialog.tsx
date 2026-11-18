"use client";

import React, { useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  FlaskConicalIcon,
  Link2Icon,
  Share2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DISCOVERABILITY_META,
  JOIN_MODE_META,
} from "@/components/move-groups/move-group-card";
import { useSesh } from "@/lib/context/sesh-provider";
import type { MoveGroupView } from "@/types/domain";

export interface MoveGroupInviteDialogProps {
  group: MoveGroupView;
  trigger?: React.ReactNode;
}

export function MoveGroupInviteDialog({
  group,
  trigger,
}: MoveGroupInviteDialogProps) {
  const { isHydrated } = useSesh();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const sharePath = `/move-groups/${group.id}`;
  const shareUrl =
    isHydrated && typeof window !== "undefined"
      ? `${window.location.origin}${sharePath}`
      : sharePath;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Move Group link copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Unable to copy automatically — copy the URL field manually.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="sm">
            <Share2Icon className="size-3.5" />
            Share / Invite
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2Icon className="size-4 text-primary" />
            Share Move Group
          </DialogTitle>
          <DialogDescription>
            Share a direct link to <span className="font-medium text-foreground">{group.name}</span>{" "}
            for <span className="font-medium text-foreground">{group.eventSummary.title}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="move-group-share-url">Direct Move Group Link</Label>
            <div className="flex items-center gap-2">
              <Input
                id="move-group-share-url"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="default"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <CheckIcon className="size-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <CopyIcon className="size-3.5" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Recipients still pass through viewer discoverability and join
              rules ({DISCOVERABILITY_META[group.discoverability].label} ·{" "}
              {JOIN_MODE_META[group.joinMode].label}).
            </p>
          </div>

          <div className="space-y-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <FlaskConicalIcon className="size-4 text-amber-600 dark:text-amber-400" />
                Prototype Invite Preview (Non-Cryptographic)
              </div>
              <Badge variant="outline" className="text-[10px]">
                Milestone 1 UI Preview
              </Badge>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Cryptographically signed, expiring, max-use invitation tokens (
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                Invitation
              </code>{" "}
              service) will be generated and verified by the backend token
              service in a later milestone. Milestone 1 links navigate within
              this browser-local prototype and do not claim cryptographic
              security.
            </p>

            <div className="grid grid-cols-2 gap-2 rounded-md border border-border/70 bg-background/80 p-2.5 text-[11px]">
              <div>
                <span className="text-muted-foreground">Target Type:</span>{" "}
                <span className="font-mono font-medium text-foreground">
                  MOVE_GROUP
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Permission:</span>{" "}
                <span className="font-mono font-medium text-foreground">
                  JOIN
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Token Status:</span>{" "}
                <span className="font-mono text-muted-foreground">
                  Unbacked preview — awaiting backend token service
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
