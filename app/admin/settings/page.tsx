import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui/Card";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSiteSettings } from "@/lib/admin/content";
import { saveSettings } from "./actions";

export const metadata: Metadata = { title: "Store settings" };

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader
        title="Store settings"
        description="Contact details and the numbers the storefront quotes (free delivery threshold, years in business)."
      />
      <Card>
        <SettingsForm action={saveSettings} settings={settings} />
      </Card>
    </>
  );
}
