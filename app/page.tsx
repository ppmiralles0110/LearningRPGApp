import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await currentUser();
  redirect(
    user ? (user.onboardingComplete ? "/dashboard" : "/onboarding") : "/login",
  );
}
