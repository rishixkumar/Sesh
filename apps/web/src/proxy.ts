import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { INTRO_SEEN_COOKIE } from "@/lib/landing/constants";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * First visit to the hub gets the scroll intro at `/welcome`. The cookie is
 * set on the redirect itself so returning users land straight on the hub.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/welcome", request.url));
  response.cookies.set(INTRO_SEEN_COOKIE, "1", {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: [
    {
      source: "/",
      missing: [
        { type: "cookie", key: "sesh_intro_seen" },
        { type: "header", key: "next-router-prefetch" },
      ],
    },
  ],
};
