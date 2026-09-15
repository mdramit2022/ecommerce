import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { productDetailSelect, type ProductDetailRow } from "@/lib/serializers";
import type {
  AdminProductListQuery,
  ProductCreateInput,
  ProductUpdateInput,
} from "@/lib/validations/product";
import type { AdminProduct, CategoryOption, ProductDetail } from "@/lib/admin/types";
import type { Pagination } from "@/types/product";

/** Admin list/edit rows: the shared detail select plus the order-line count. */
export const adminProductSelect = {
  ...productDetailSelect,
  _count: { select: { orderItems: true } },
} satisfies Prisma.ProductSelect;

export type AdminProductRow = Prisma.ProductGetPayload<{ select: typeof adminProductSelect }>;

export function toProductDetail(row: ProductDetailRow): ProductDetail {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    price: row.price.toNumber(),
    compareAtPrice: row.compareAtPrice?.toNumber() ?? null,
    stock: row.stock,
    images: row.images,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    categoryId: row.categoryId,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAdminProduct(row: AdminProductRow): AdminProduct {
  return { ...toProductDetail(row), orderItemCount: row._count.orderItems };
}

export function buildAdminProductWhere(query: AdminProductListQuery): Prisma.ProductWhereInput {
  return {
    ...(query.status === "active"
      ? { isActive: true }
      : query.status === "inactive"
        ? { isActive: false }
        : {}),
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" } },
            { slug: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function getAdminProducts(
  query: AdminProductListQuery,
): Promise<{ products: AdminProduct[]; pagination: Pagination }> {
  const where = buildAdminProductWhere(query);
  const [rows, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: adminProductSelect,
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: rows.map(toAdminProduct),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  const row = await prisma.product.findUnique({ where: { id }, select: adminProductSelect });
  return row ? toAdminProduct(row) : null;
}

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  return prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

/** Map validated create input to Prisma data (money -> Decimal). `slug` must already be resolved. */
export function productCreateData(
  input: ProductCreateInput,
  slug: string,
): Prisma.ProductUncheckedCreateInput {
  return {
    title: input.title,
    slug,
    description: input.description,
    price: new Prisma.Decimal(input.price),
    compareAtPrice: input.compareAtPrice != null ? new Prisma.Decimal(input.compareAtPrice) : null,
    stock: input.stock,
    images: input.images,
    categoryId: input.categoryId,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
  };
}

/** Map validated partial input to Prisma data; only defined fields are written. */
export function productUpdateData(input: ProductUpdateInput): Prisma.ProductUncheckedUpdateInput {
  const data: Prisma.ProductUncheckedUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.price !== undefined) data.price = new Prisma.Decimal(input.price);
  if (input.compareAtPrice !== undefined) {
    data.compareAtPrice =
      input.compareAtPrice === null ? null : new Prisma.Decimal(input.compareAtPrice);
  }
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.images !== undefined) data.images = input.images;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  return data;
}

export function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
