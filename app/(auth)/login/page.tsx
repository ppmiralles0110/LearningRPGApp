import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { currentUser } from "@/lib/auth/session";

export default async function LoginPage() {
  const user = await currentUser();
  if (user) redirect(user.onboardingComplete ? "/dashboard" : "/onboarding");
  return <AuthForm mode="login" />;
}
