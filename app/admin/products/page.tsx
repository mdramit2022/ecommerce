import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmSubmitButton, SubmitButton } from "@/components/admin/FormButtons";
import { LinkButton } from "@/components/admin/LinkButton";
import { Notice } from "@/components/admin/Notice";
import { Table, TableBody, TableHead, Td, Th } from "@/components/admin/Table";
import { formatDate } from "@/lib/admin/format";
import { getAdminProducts, getCategoryOptions } from "@/lib/admin/products";
import { buildPath, firstValues, type RawSearchParams } from "@/lib/admin/search-params";
import { formatPrice } from "@/lib/utils";
import { adminProductListQuerySchema } from "@/lib/validations/product";
import { deleteProduct, toggleProductActive } from "./actions";

export const metadata: Metadata = { title: "Products" };

const PRODUCTS_PATH = "/admin/products";
const LOW_STOCK = 5;

type PageProps = { searchParams: Promise<RawSearchParams> };

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const raw = firstValues(await searchParams);
  const parsed = adminProductListQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : adminProductListQuerySchema.parse({});

  const [{ products, pagination }, categories] = await Promise.all([
    getAdminProducts(query),
    getCategoryOptions(),
  ]);

  const preserve = {
    q: query.q,
    category: query.category,
    status: query.status === "all" ? undefined : query.status,
  };
  const returnTo = buildPath(PRODUCTS_PATH, {
    ...preserve,
    page: query.page > 1 ? String(query.page) : undefined,
  });
  const hasFilters = Boolean(query.q || query.category || query.status !== "all");

  return (
    <>
      <PageHeader
        title="Products"
        description={`${pagination.total} product${pagination.total === 1 ? "" : "s"}${hasFilters ? " matching your filters" : ""}`}
        actions={<LinkButton href="/admin/products/new">New product</LinkButton>}
      />

      <Notice notice={raw.notice} error={raw.error} />

      <form
        method="get"
        action={PRODUCTS_PATH}
        className="mb-6 grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_180px_150px_auto]"
      >
        <Input
          type="search"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Search title, slug or description"
          aria-label="Search products"
        />
        <Select name="category" defaultValue={query.category ?? ""} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={query.status} aria-label="Status">
          <option value="all">Active and inactive</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </Select>
        <div className="flex items-center gap-2">
          <Button type="submit" variant="secondary">
            Filter
          </Button>
          {hasFilters && (
            <Link href={PRODUCTS_PATH} className="text-sm text-neutral-600 hover:text-neutral-900">
              Reset
            </Link>
          )}
        </div>
      </form>

      {products.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No products match these filters" : "No products yet"}
          description={
            hasFilters
              ? "Try a different search term or clear the filters."
              : "Create your first product to start selling."
          }
          action={
            hasFilters ? (
              <LinkButton href={PRODUCTS_PATH} variant="outline">
                Clear filters
              </LinkButton>
            ) : (
              <LinkButton href="/admin/products/new">New product</LinkButton>
            )
          }
        />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th className="text-right">Price</Th>
              <Th className="text-right">Stock</Th>
              <Th>Status</Th>
              <Th>Updated</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-neutral-50">
                <Td>
                  <div className="flex items-center gap-3">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[10px] text-neutral-400">
                        No image
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="block truncate font-medium text-neutral-900 hover:underline"
                      >
                        {product.title}
                      </Link>
                      <p className="truncate text-xs text-neutral-500">
                        /{product.slug}
                        {product.isFeatured && (
                          <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 uppercase">
                            Featured
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td className="whitespace-nowrap">{product.category.name}</Td>
                <Td className="text-right whitespace-nowrap">
                  <span className="font-medium">{formatPrice(product.price)}</span>
                  {product.compareAtPrice !== null && (
                    <span className="ml-1.5 text-xs text-neutral-400 line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </Td>
                <Td className="text-right">
                  {product.stock <= LOW_STOCK ? (
                    <Badge tone={product.stock === 0 ? "danger" : "warning"}>{product.stock}</Badge>
                  ) : (
                    product.stock
                  )}
                </Td>
                <Td>
                  <Badge tone={product.isActive ? "success" : "neutral"}>
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap text-neutral-500">
                  {formatDate(product.updatedAt)}
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <LinkButton
                      href={`/admin/products/${product.id}/edit`}
                      variant="ghost"
                      size="sm"
                    >
                      Edit
                    </LinkButton>
                    <form action={toggleProductActive}>
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <SubmitButton variant="ghost" size="sm">
                        {product.isActive ? "Deactivate" : "Activate"}
                      </SubmitButton>
                    </form>
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <ConfirmSubmitButton
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50"
                        confirmMessage={
                          product.orderItemCount > 0
                            ? `"${product.title}" appears in ${product.orderItemCount} order line(s), so it cannot be deleted. Deactivate it instead?`
                            : `Permanently delete "${product.title}"? This cannot be undone.`
                        }
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

      <AdminPagination pagination={pagination} basePath={PRODUCTS_PATH} preserve={preserve} />
    </>
  );
}
