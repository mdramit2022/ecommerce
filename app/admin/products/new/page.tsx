import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Card, PageHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/admin/LinkButton";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategoryOptions } from "@/lib/admin/products";
import { createProduct } from "../actions";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await getCategoryOptions();

  return (
    <>
      <PageHeader
        title="New product"
        description="Products are visible in the storefront as soon as they are active."
        actions={
          <LinkButton href="/admin/products" variant="outline">
            Back to products
          </LinkButton>
        }
      />

      {categories.length === 0 && (
        <Alert tone="warning" title="No categories yet" className="mb-6">
          Every product belongs to a category. Create one under{" "}
          <Link href="/admin/categories" className="font-medium underline">
            Categories
          </Link>{" "}
          first.
        </Alert>
      )}

      <Card>
        <ProductForm action={createProduct} categories={categories} />
      </Card>
    </>
  );
}
