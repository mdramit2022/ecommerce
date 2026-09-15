import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Card, PageHeader } from "@/components/ui/Card";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { LinkButton } from "@/components/admin/LinkButton";
import { getAdminCategory } from "@/lib/admin/categories";
import { formatDateTime } from "@/lib/admin/format";
import { updateCategory } from "../../actions";

export const metadata: Metadata = { title: "Edit category" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const category = await getAdminCategory(id);
  if (!category) notFound();

  return (
    <>
      <PageHeader
        title={category.name}
        description={`Last updated ${formatDateTime(category.updatedAt)}`}
        actions={
          <LinkButton href="/admin/categories" variant="outline">
            Back to categories
          </LinkButton>
        }
      />

      {category.productCount > 0 && (
        <Alert tone="info" className="mb-6">
          {category.productCount} product{category.productCount === 1 ? "" : "s"} use this category.
          Changing the slug updates the storefront filter link.{" "}
          <Link
            href={`/admin/products?category=${encodeURIComponent(category.slug)}`}
            className="font-medium underline"
          >
            View products
          </Link>
        </Alert>
      )}

      <Card>
        <CategoryForm action={updateCategory} category={category} />
      </Card>
    </>
  );
}
