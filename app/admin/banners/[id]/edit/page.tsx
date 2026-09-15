import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui/Card";
import { BannerForm } from "@/components/admin/BannerForm";
import { LinkButton } from "@/components/admin/LinkButton";
import { getBanner } from "@/lib/admin/content";
import { formatDateTime } from "@/lib/admin/format";
import { BANNER_PLACEMENT_META } from "@/lib/content/kinds";
import { updateBanner } from "../../actions";

export const metadata: Metadata = { title: "Edit banner" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditBannerPage({ params }: PageProps) {
  const { id } = await params;
  const banner = await getBanner(id);
  if (!banner) notFound();

  return (
    <>
      <PageHeader
        title={banner.title}
        description={`${BANNER_PLACEMENT_META[banner.placement].label} · last updated ${formatDateTime(banner.updatedAt)}`}
        actions={
          <LinkButton href="/admin/banners" variant="outline">
            Back to banners
          </LinkButton>
        }
      />
      <Card>
        <BannerForm action={updateBanner} banner={banner} />
      </Card>
    </>
  );
}
