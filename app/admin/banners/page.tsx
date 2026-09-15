import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, PageHeader } from "@/components/ui/Card";
import { ConfirmSubmitButton, SubmitButton } from "@/components/admin/FormButtons";
import { LinkButton } from "@/components/admin/LinkButton";
import { Notice } from "@/components/admin/Notice";
import { Table, TableBody, TableHead, Td, Th } from "@/components/admin/Table";
import { listBanners } from "@/lib/admin/content";
import { formatDate } from "@/lib/admin/format";
import { firstValues, type RawSearchParams } from "@/lib/admin/search-params";
import {
  BANNER_PLACEMENTS,
  BANNER_PLACEMENT_META,
  BANNER_THEME_META,
  bannerTheme,
} from "@/lib/content/kinds";
import { deleteBanner, toggleBannerActive } from "./actions";

export const metadata: Metadata = { title: "Banners" };

const BANNERS_PATH = "/admin/banners";

type PageProps = { searchParams: Promise<RawSearchParams> };

export default async function AdminBannersPage({ searchParams }: PageProps) {
  const raw = firstValues(await searchParams);
  const banners = await listBanners();

  return (
    <>
      <PageHeader
        title="Home page banners"
        description="Hero slides, the collection tiles and the side banner. Only active banners show; lower order numbers come first."
        actions={<LinkButton href={`${BANNERS_PATH}/new`}>New banner</LinkButton>}
      />

      <Notice notice={raw.notice} error={raw.error} />

      <div className="flex flex-col gap-10">
        {BANNER_PLACEMENTS.map((placement) => {
          const meta = BANNER_PLACEMENT_META[placement];
          const rows = banners.filter((banner) => banner.placement === placement);
          return (
            <section key={placement} aria-labelledby={`placement-${placement}`}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id={`placement-${placement}`} className="font-semibold text-neutral-900">
                    {meta.plural}{" "}
                    <span className="font-normal text-neutral-500">({rows.length})</span>
                  </h2>
                  <p className="text-sm text-neutral-500">{meta.hint}</p>
                </div>
                <LinkButton
                  href={`${BANNERS_PATH}/new?placement=${placement}`}
                  variant="outline"
                  size="sm"
                >
                  Add {meta.label.toLowerCase()}
                </LinkButton>
              </div>

              {rows.length === 0 ? (
                <EmptyState
                  title={`No ${meta.plural.toLowerCase()} yet`}
                  description="This part of the home page is hidden until a banner is active."
                />
              ) : (
                <Table>
                  <TableHead>
                    <tr>
                      <Th>Banner</Th>
                      <Th>Button</Th>
                      <Th>Theme</Th>
                      <Th className="text-right">Order</Th>
                      <Th>Status</Th>
                      <Th>Updated</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {rows.map((banner) => (
                      <tr key={banner.id} className="hover:bg-neutral-50">
                        <Td>
                          <div className="flex items-center gap-3">
                            <Image
                              src={banner.image}
                              alt=""
                              width={72}
                              height={40}
                              unoptimized
                              className="h-10 w-[72px] shrink-0 rounded-md object-cover"
                            />
                            <div className="min-w-0">
                              {banner.eyebrow && (
                                <p className="truncate text-xs text-neutral-500">
                                  {banner.eyebrow}
                                </p>
                              )}
                              <Link
                                href={`${BANNERS_PATH}/${banner.id}/edit`}
                                className="block truncate font-medium text-neutral-900 hover:underline"
                              >
                                {banner.title}
                                {banner.titleAccent && (
                                  <span className="text-brand-orange"> {banner.titleAccent}</span>
                                )}
                              </Link>
                              {banner.highlight && (
                                <p className="truncate text-xs font-semibold text-amber-700">
                                  {banner.highlight}
                                </p>
                              )}
                            </div>
                          </div>
                        </Td>
                        <Td className="text-xs text-neutral-600">
                          {banner.ctaLabel ? (
                            <>
                              <span className="font-medium text-neutral-800">
                                {banner.ctaLabel}
                              </span>
                              <span className="block truncate font-mono text-[11px] text-neutral-400">
                                {banner.ctaHref}
                              </span>
                            </>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </Td>
                        <Td className="text-xs text-neutral-600">
                          {meta.fields.includes("theme")
                            ? BANNER_THEME_META[bannerTheme(banner.placement, banner.theme)].label
                            : "-"}
                        </Td>
                        <Td className="text-right tabular-nums">{banner.sortOrder}</Td>
                        <Td>
                          <Badge tone={banner.isActive ? "success" : "neutral"}>
                            {banner.isActive ? "Active" : "Hidden"}
                          </Badge>
                        </Td>
                        <Td className="whitespace-nowrap text-neutral-500">
                          {formatDate(banner.updatedAt)}
                        </Td>
                        <Td>
                          <div className="flex items-center justify-end gap-1">
                            <LinkButton
                              href={`${BANNERS_PATH}/${banner.id}/edit`}
                              variant="ghost"
                              size="sm"
                            >
                              Edit
                            </LinkButton>
                            <form action={toggleBannerActive}>
                              <input type="hidden" name="id" value={banner.id} />
                              <input type="hidden" name="returnTo" value={BANNERS_PATH} />
                              <SubmitButton variant="ghost" size="sm">
                                {banner.isActive ? "Hide" : "Show"}
                              </SubmitButton>
                            </form>
                            <form action={deleteBanner}>
                              <input type="hidden" name="id" value={banner.id} />
                              <input type="hidden" name="returnTo" value={BANNERS_PATH} />
                              <ConfirmSubmitButton
                                variant="ghost"
                                size="sm"
                                className="text-rose-600 hover:bg-rose-50"
                                confirmMessage={`Delete banner "${banner.title}"? This cannot be undone.`}
                              >
                                Delete
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
