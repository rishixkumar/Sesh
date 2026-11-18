"use client";

import React, { useState } from "react";
import { FlagIcon } from "lucide-react";
import { toast } from "sonner";
import { DemoNoticeBanner } from "@/components/shared/demo-notice-banner";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const REPORT_REASONS = [
  {
    value: "INACCURATE_INFO",
    label: "Inaccurate time, venue, or event info",
  },
  {
    value: "SPAM_DUPLICATE",
    label: "Spam, commercial flyer, or duplicate Move",
  },
  {
    value: "PRIVACY_CONCERN",
    label: "Unmasked private address or personal info",
  },
  {
    value: "SAFETY_CONCERN",
    label: "Campus safety or community guidelines issue",
  },
  {
    value: "OTHER",
    label: "Other concern",
  },
] as const;

export interface ReportEventDialogProps {
  eventId: string;
  eventTitle: string;
  className?: string;
}

export function ReportEventDialog({
  eventId,
  eventTitle,
  className,
}: ReportEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0].value);
  const [details, setDetails] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedLabel =
      REPORT_REASONS.find((r) => r.value === reason)?.label ?? "Moderation review";

    setOpen(false);
    setDetails("");
    setReason(REPORT_REASONS[0].value);

    toast.success("Simulated demo report acknowledged", {
      description: `Reason: "${selectedLabel}". No real moderation ticket was sent in this Milestone 1 browser prototype.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("gap-1.5 text-muted-foreground hover:text-foreground", className)}
        >
          <FlagIcon className="size-3.5" />
          <span>Report</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Report Move (Simulated Demo Action)</DialogTitle>
            <DialogDescription>
              Flagging <span className="font-medium text-foreground">{eventTitle}</span>{" "}
              <span className="font-mono text-xs text-muted-foreground">({eventId})</span>
            </DialogDescription>
          </DialogHeader>

          <DemoNoticeBanner title="Simulated Demo Moderation Action">
            Submitting this form previews the campus trust &amp; safety flow locally. No
            real moderation ticket or external alert is transmitted.
          </DemoNoticeBanner>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="report-reason-trigger">Reason for report</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="report-reason-trigger" className="w-full">
                  <SelectValue placeholder="Choose a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-details">Additional context (optional)</Label>
              <Textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Share brief context for campus moderators (stays in browser memory only)..."
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Submit Demo Report</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
