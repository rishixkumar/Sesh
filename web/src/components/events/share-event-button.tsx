"use client";

import React, { useState } from "react";
import { CheckIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ShareEventButtonProps {
  eventTitle: string;
  publicLocation?: string;
  className?: string;
}

function fallbackCopyText(text: string): boolean {
  if (typeof document === "undefined") return false;
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function ShareEventButton({
  eventTitle,
  publicLocation,
  className,
}: ShareEventButtonProps) {
  const [justCopied, setJustCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const shareText = publicLocation
      ? `${eventTitle} · ${publicLocation} on Sesh GT`
      : `${eventTitle} on Sesh GT`;

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: eventTitle,
          text: shareText,
          url,
        });
        toast.success("Shared Move link");
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        // Fall through to clipboard copy if Web Share fails on desktop
      }
    }

    let copied = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch {
        copied = fallbackCopyText(url);
      }
    } else {
      copied = fallbackCopyText(url);
    }

    if (copied) {
      setJustCopied(true);
      toast.success("Event link copied to clipboard");
      window.setTimeout(() => setJustCopied(false), 2000);
    } else {
      toast.info("Share link ready", {
        description: url,
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={cn("gap-1.5", className)}
    >
      {justCopied ? (
        <CheckIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Share2Icon className="size-3.5" />
      )}
      <span>{justCopied ? "Copied" : "Share"}</span>
    </Button>
  );
}
