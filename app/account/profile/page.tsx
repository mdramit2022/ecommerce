import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfile } from "@/lib/account/profile";
import { formatDate } from "@/lib/account/format";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { ProfileForm } from "@/components/account/ProfileForm";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Profile" };

/** Server Component: profile details + two client forms (name, password). */
export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/account/profile");

  const profile = await getProfile(session.user.id);
  if (!profile) redirect("/sign-in?callbackUrl=/account/profile");

  return (
    <>
      <PageHeader
        title="Profile"
        description={
          <span className="flex flex-wrap items-center gap-2">
            Member since {formatDate(profile.createdAt)}
            <Badge tone={profile.role === "ADMIN" ? "info" : "neutral"}>{profile.role}</Badge>
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Personal details</h2>
          <ProfileForm initialName={profile.name ?? ""} email={profile.email} />
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Password</h2>
          {profile.hasPassword ? (
            <ChangePasswordForm />
          ) : (
            <Alert tone="info" title="No password set">
              You signed up with a social provider (e.g. Google), so this account has no password.
              Continue signing in with that provider.
            </Alert>
          )}
        </Card>
      </div>
    </>
  );
}
