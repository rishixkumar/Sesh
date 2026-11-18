import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Welcome",
  description:
    "Find the move. Bring your people. Sesh puts Georgia Tech's nights out, Move Groups, and the friends you go with in one place. 18+.",
};

export default function WelcomePage() {
  return <LandingPage />;
}
