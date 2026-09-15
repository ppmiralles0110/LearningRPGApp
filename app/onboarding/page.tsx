import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { currentUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.onboardingComplete) redirect("/dashboard");

  const domains = getDatabase()
    .prepare("SELECT slug, name, description FROM domains ORDER BY priority")
    .all() as Array<{ slug: string; name: string; description: string }>;

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <OnboardingForm domains={domains} />
    </main>
  );
}
