import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/admin/LinkButton";
import { ProductForm } from "@/components/admin/ProductForm";
import { formatDateTime } from "@/lib/admin/format";
import { getAdminProduct, getCategoryOptions } from "@/lib/admin/products";
import { updateProduct } from "../../actions";

export const metadata: Metadata = { title: "Edit product" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getAdminProduct(id), getCategoryOptions()]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.title}
        description={
          <>
            Last updated {formatDateTime(product.updatedAt)}
            {product.orderItemCount > 0 &&
              ` · in ${product.orderItemCount} order line${product.orderItemCount === 1 ? "" : "s"}`}
          </>
        }
        actions={
          <LinkButton href="/admin/products" variant="outline">
            Back to products
          </LinkButton>
        }
      />

      <Card>
        <ProductForm action={updateProduct} categories={categories} product={product} />
      </Card>
    </>
  );
}
