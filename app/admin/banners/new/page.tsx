import type { Metadata } from "next";
import type { BannerPlacement } from "@prisma/client";
import { Card, PageHeader } from "@/components/ui/Card";
import { BannerForm } from "@/components/admin/BannerForm";
import { LinkButton } from "@/components/admin/LinkButton";
import { firstValues, type RawSearchParams } from "@/lib/admin/search-params";
import { BANNER_PLACEMENTS } from "@/lib/content/kinds";
import { createBanner } from "../actions";

export const metadata: Metadata = { title: "New banner" };

type PageProps = { searchParams: Promise<RawSearchParams> };

function placementFrom(value: string | undefined): BannerPlacement {
  return (BANNER_PLACEMENTS as readonly string[]).includes(value ?? "")
    ? (value as BannerPlacement)
    : "HERO";
}

export default async function NewBannerPage({ searchParams }: PageProps) {
  const raw = firstValues(await searchParams);

  return (
    <>
      <PageHeader
        title="New banner"
        description="Active banners appear on the home page as soon as they are saved."
        actions={
          <LinkButton href="/admin/banners" variant="outline">
            Back to banners
          </LinkButton>
        }
      />
      <Card>
        <BannerForm action={createBanner} defaultPlacement={placementFrom(raw.placement)} />
      </Card>
    </>
  );
}
