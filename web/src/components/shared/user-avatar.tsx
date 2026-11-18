import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { PublicUserSummary } from "@/types/domain";

export function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) return "GT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function UserAvatar({
  user,
  className,
}: {
  user: Pick<PublicUserSummary, "displayName" | "avatar">;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-8", className)}>
      {user.avatar ? (
        <AvatarImage src={user.avatar} alt={user.displayName} />
      ) : null}
      <AvatarFallback className="text-xs font-medium">
        {getInitials(user.displayName)}
      </AvatarFallback>
    </Avatar>
  );
}
