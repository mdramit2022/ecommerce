import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, PageHeader } from "@/components/ui/Card";
import { ConfirmSubmitButton, SubmitButton } from "@/components/admin/FormButtons";
import { LinkButton } from "@/components/admin/LinkButton";
import { Notice } from "@/components/admin/Notice";
import { Table, TableBody, TableHead, Td, Th } from "@/components/admin/Table";
import { Stars } from "@/components/reviews/Stars";
import { listTestimonials } from "@/lib/admin/content";
import { formatDate } from "@/lib/admin/format";
import { firstValues, type RawSearchParams } from "@/lib/admin/search-params";
import { deleteTestimonial, toggleTestimonialActive } from "./actions";

export const metadata: Metadata = { title: "Testimonials" };

const TESTIMONIALS_PATH = "/admin/testimonials";

type PageProps = { searchParams: Promise<RawSearchParams> };

export default async function AdminTestimonialsPage({ searchParams }: PageProps) {
  const raw = firstValues(await searchParams);
  const testimonials = await listTestimonials();

  return (
    <>
      <PageHeader
        title="Customer testimonials"
        description="Quotes shown in the carousel near the bottom of the home page, in order."
        actions={<LinkButton href={`${TESTIMONIALS_PATH}/new`}>New testimonial</LinkButton>}
      />

      <Notice notice={raw.notice} error={raw.error} />

      {testimonials.length === 0 ? (
        <EmptyState
          title="No testimonials yet"
          description="The testimonial card is hidden from the home page until one is active."
          action={<LinkButton href={`${TESTIMONIALS_PATH}/new`}>New testimonial</LinkButton>}
        />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <Th>Customer</Th>
              <Th>Quote</Th>
              <Th>Rating</Th>
              <Th className="text-right">Order</Th>
              <Th>Status</Th>
              <Th>Updated</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {testimonials.map((testimonial) => (
              <tr key={testimonial.id} className="hover:bg-neutral-50">
                <Td>
                  <div className="flex items-center gap-3">
                    {testimonial.avatar ? (
                      <Image
                        src={testimonial.avatar}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500">
                        {testimonial.authorName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`${TESTIMONIALS_PATH}/${testimonial.id}/edit`}
                        className="block truncate font-medium text-neutral-900 hover:underline"
                      >
                        {testimonial.authorName}
                      </Link>
                      {testimonial.location && (
                        <p className="text-xs text-neutral-500">{testimonial.location}</p>
                      )}
                    </div>
                  </div>
                </Td>
                <Td>
                  <p className="max-w-md truncate text-neutral-700" title={testimonial.quote}>
                    {testimonial.quote}
                  </p>
                </Td>
                <Td>
                  <Stars rating={testimonial.rating} size="sm" />
                </Td>
                <Td className="text-right tabular-nums">{testimonial.sortOrder}</Td>
                <Td>
                  <Badge tone={testimonial.isActive ? "success" : "neutral"}>
                    {testimonial.isActive ? "Active" : "Hidden"}
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap text-neutral-500">
                  {formatDate(testimonial.updatedAt)}
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <LinkButton
                      href={`${TESTIMONIALS_PATH}/${testimonial.id}/edit`}
                      variant="ghost"
                      size="sm"
                    >
                      Edit
                    </LinkButton>
                    <form action={toggleTestimonialActive}>
                      <input type="hidden" name="id" value={testimonial.id} />
                      <input type="hidden" name="returnTo" value={TESTIMONIALS_PATH} />
                      <SubmitButton variant="ghost" size="sm">
                        {testimonial.isActive ? "Hide" : "Show"}
                      </SubmitButton>
                    </form>
                    <form action={deleteTestimonial}>
                      <input type="hidden" name="id" value={testimonial.id} />
                      <input type="hidden" name="returnTo" value={TESTIMONIALS_PATH} />
                      <ConfirmSubmitButton
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50"
                        confirmMessage={`Delete the testimonial from ${testimonial.authorName}? This cannot be undone.`}
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
    </>
  );
}
