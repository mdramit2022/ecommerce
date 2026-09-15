import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/admin/LinkButton";
import { TestimonialForm } from "@/components/admin/TestimonialForm";
import { getTestimonial } from "@/lib/admin/content";
import { formatDateTime } from "@/lib/admin/format";
import { updateTestimonial } from "../../actions";

export const metadata: Metadata = { title: "Edit testimonial" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditTestimonialPage({ params }: PageProps) {
  const { id } = await params;
  const testimonial = await getTestimonial(id);
  if (!testimonial) notFound();

  return (
    <>
      <PageHeader
        title={`Testimonial from ${testimonial.authorName}`}
        description={`Last updated ${formatDateTime(testimonial.updatedAt)}`}
        actions={
          <LinkButton href="/admin/testimonials" variant="outline">
            Back to testimonials
          </LinkButton>
        }
      />
      <Card>
        <TestimonialForm action={updateTestimonial} testimonial={testimonial} />
      </Card>
    </>
  );
}
