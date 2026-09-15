import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, PageHeader } from "@/components/ui/Card";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ConfirmSubmitButton } from "@/components/admin/FormButtons";
import { LinkButton } from "@/components/admin/LinkButton";
import { Notice } from "@/components/admin/Notice";
import { Table, TableBody, TableEmptyRow, TableHead, Td, Th } from "@/components/admin/Table";
import { getAdminCategories } from "@/lib/admin/categories";
import { formatDate } from "@/lib/admin/format";
import { firstValues, type RawSearchParams } from "@/lib/admin/search-params";
import { createCategory, deleteCategory } from "./actions";

export const metadata: Metadata = { title: "Categories" };

const CATEGORIES_PATH = "/admin/categories";

type PageProps = { searchParams: Promise<RawSearchParams> };

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const raw = firstValues(await searchParams);
  const categories = await getAdminCategories();

  return (
    <>
      <PageHeader
        title="Categories"
        description={`${categories.length} categor${categories.length === 1 ? "y" : "ies"}. Every product belongs to exactly one category.`}
      />

      <Notice notice={raw.notice} error={raw.error} />

      <Card className="mb-8">
        <h2 className="mb-4 font-semibold text-neutral-900">New category</h2>
        <CategoryForm action={createCategory} resetOnSuccess compact />
      </Card>

      <Table>
        <TableHead>
          <tr>
            <Th>Category</Th>
            <Th>Slug</Th>
            <Th className="text-right">Products</Th>
            <Th>Created</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </TableHead>
        <TableBody>
          {categories.length === 0 ? (
            <TableEmptyRow colSpan={5}>No categories yet. Create one above.</TableEmptyRow>
          ) : (
            categories.map((category) => (
              <tr key={category.id} className="hover:bg-neutral-50">
                <Td>
                  <div className="flex items-center gap-3">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-md bg-neutral-100" />
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`${CATEGORIES_PATH}/${category.id}/edit`}
                        className="block truncate font-medium text-neutral-900 hover:underline"
                      >
                        {category.name}
                      </Link>
                      {category.description && (
                        <p className="max-w-md truncate text-xs text-neutral-500">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Td>
                <Td className="font-mono text-xs text-neutral-600">{category.slug}</Td>
                <Td className="text-right">
                  <Badge tone={category.productCount > 0 ? "info" : "neutral"}>
                    {category.productCount}
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap text-neutral-500">
                  {formatDate(category.createdAt)}
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <LinkButton
                      href={`${CATEGORIES_PATH}/${category.id}/edit`}
                      variant="ghost"
                      size="sm"
                    >
                      Edit
                    </LinkButton>
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="returnTo" value={CATEGORIES_PATH} />
                      <ConfirmSubmitButton
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50"
                        disabled={category.productCount > 0}
                        title={
                          category.productCount > 0
                            ? "Move or delete this category's products first"
                            : undefined
                        }
                        confirmMessage={`Delete category "${category.name}"? This cannot be undone.`}
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </TableBody>
      </Table>
    </>
  );
}
