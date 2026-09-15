import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/admin/LinkButton";
import { TestimonialForm } from "@/components/admin/TestimonialForm";
import { createTestimonial } from "../actions";

export const metadata: Metadata = { title: "New testimonial" };

export default function NewTestimonialPage() {
  return (
    <>
      <PageHeader
        title="New testimonial"
        description="Use the customer's own words and, if you have one, their photo."
        actions={
          <LinkButton href="/admin/testimonials" variant="outline">
            Back to testimonials
          </LinkButton>
        }
      />
      <Card>
        <TestimonialForm action={createTestimonial} />
      </Card>
    </>
  );
}
