"use client";

import React from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  FlaskConicalIcon,
  ShieldAlertIcon,
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
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { DEMO_PERSONA_META } from "@/components/layout/demo-identity-switcher";
import { useSesh } from "@/lib/context/sesh-provider";

export function DemoSignInDialog() {
  const {
    signInPrompt,
    closeSignInPrompt,
    availableDemoUsers,
    setDemoIdentity,
  } = useSesh();

  const actionLabel =
    signInPrompt.actionDescription.trim() || "use campus social actions";

  const handleSelectMember = (userId: string, displayName: string) => {
    setDemoIdentity(userId);
    toast.success(`Switched Demo Identity to ${displayName}`);
  };

  return (
    <Dialog
      open={signInPrompt.open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeSignInPrompt();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              <FlaskConicalIcon className="size-3" />
              Local Prototype Simulation · Not Real Auth
            </Badge>
          </div>

          <DialogTitle className="text-lg font-semibold">
            Switch to a Demo Member to continue
          </DialogTitle>

          <DialogDescription className="text-sm leading-relaxed">
            You are currently browsing in{" "}
            <span className="font-medium text-foreground">
              Guest (Unauthenticated)
            </span>{" "}
            mode. Unverified visitors can explore public Georgia Tech Moves, but
            must switch to a simulated student member to{" "}
            <span className="font-medium text-foreground">{actionLabel}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 py-1">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Pick a Georgia Tech Demo Persona (1-Click)
          </p>

          <div className="grid gap-2">
            {availableDemoUsers.map((user) => {
              const meta = DEMO_PERSONA_META[user.id] ?? {
                roleBadge: "GT Member",
                roleHint: user.bio ?? "Verified Georgia Tech demo student",
              };

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectMember(user.id, user.displayName)}
                  className="group flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <UserAvatar user={user} className="mt-0.5 size-9 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground">
                        {user.displayName}
                      </span>
                      <CheckCircle2Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                        {meta.roleBadge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      @{user.username}
                      {user.graduationYear
                        ? ` · Class of ${user.graduationYear}`
                        : ""}
                    </p>
                    <p className="text-xs leading-snug text-muted-foreground">
                      {meta.roleHint}
                    </p>
                  </div>
                  <ArrowRightIcon className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </button>
              );
            })}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <ShieldAlertIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span>
              Real 18+ age verification and{" "}
              <code className="font-mono text-[11px]">@gatech.edu</code> student
              authentication will be enforced server-side in Milestone 2.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={closeSignInPrompt}
          >
            Stay in Guest Mode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
