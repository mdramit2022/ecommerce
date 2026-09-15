import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/Card";
import { ContentListEditor } from "@/components/admin/ContentListEditor";
import { Notice } from "@/components/admin/Notice";
import { listContentItems } from "@/lib/admin/content";
import { firstValues, type RawSearchParams } from "@/lib/admin/search-params";
import { SITE_CONTENT_KINDS } from "@/lib/content/kinds";
import { deleteContentItem, saveContentItem, toggleContentItemActive } from "./actions";

export const metadata: Metadata = { title: "Site content" };

const CONTENT_PATH = "/admin/content";

type PageProps = { searchParams: Promise<RawSearchParams> };

export default async function AdminContentPage({ searchParams }: PageProps) {
  const raw = firstValues(await searchParams);
  const items = await listContentItems();

  return (
    <>
      <PageHeader
        title="Site content"
        description="The small repeated pieces of the storefront shell: announcement bar, trust badges, social links and footer links. Edit a row and press Save; add new rows at the bottom of each list."
      />

      <Notice notice={raw.notice} error={raw.error} />

      <div className="flex flex-col gap-8">
        {SITE_CONTENT_KINDS.map((kind) => (
          <ContentListEditor
            key={kind}
            kind={kind}
            items={items.filter((item) => item.kind === kind)}
            saveAction={saveContentItem}
            toggleAction={toggleContentItemActive}
            deleteAction={deleteContentItem}
            returnTo={CONTENT_PATH}
          />
        ))}
      </div>
    </>
  );
}
