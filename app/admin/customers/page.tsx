import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, PageHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { ConfirmSubmitButton } from "@/components/admin/FormButtons";
import { LinkButton } from "@/components/admin/LinkButton";
import { Notice } from "@/components/admin/Notice";
import { Table, TableBody, TableHead, Td, Th } from "@/components/admin/Table";
import { adminCustomerListQuerySchema, getAdminCustomers } from "@/lib/admin/customers";
import { formatDate } from "@/lib/admin/format";
import { buildPath, firstValues, type RawSearchParams } from "@/lib/admin/search-params";
import { setUserRole } from "./actions";

export const metadata: Metadata = { title: "Customers" };

const CUSTOMERS_PATH = "/admin/customers";

type PageProps = { searchParams: Promise<RawSearchParams> };

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const raw = firstValues(await searchParams);
  const parsed = adminCustomerListQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : adminCustomerListQuerySchema.parse({});

  const [session, { customers, pagination }] = await Promise.all([
    auth(),
    getAdminCustomers(query),
  ]);
  const currentUserId = session?.user.id;

  const preserve = { q: query.q, role: query.role };
  const returnTo = buildPath(CUSTOMERS_PATH, {
    ...preserve,
    page: query.page > 1 ? String(query.page) : undefined,
  });
  const hasFilters = Boolean(query.q || query.role);

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${pagination.total} user${pagination.total === 1 ? "" : "s"}${hasFilters ? " matching your filters" : ""}`}
      />

      <Notice notice={raw.notice} error={raw.error} />

      <form
        method="get"
        action={CUSTOMERS_PATH}
        className="mb-6 grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_160px_auto]"
      >
        <Input
          type="search"
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Search by name or email"
          aria-label="Search users"
        />
        <Select name="role" defaultValue={query.role ?? ""} aria-label="Role">
          <option value="">All roles</option>
          <option value="CUSTOMER">Customers</option>
          <option value="ADMIN">Admins</option>
        </Select>
        <div className="flex items-center gap-2">
          <Button type="submit" variant="secondary">
            Filter
          </Button>
          {hasFilters && (
            <Link href={CUSTOMERS_PATH} className="text-sm text-neutral-600 hover:text-neutral-900">
              Reset
            </Link>
          )}
        </div>
      </form>

      {customers.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No users match these filters" : "No users yet"}
          description={hasFilters ? "Try a different search term or clear the filters." : undefined}
          action={
            hasFilters ? (
              <LinkButton href={CUSTOMERS_PATH} variant="outline">
                Clear filters
              </LinkButton>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th className="text-right">Orders</Th>
              <Th>Joined</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {customers.map((user) => {
              const isSelf = user.id === currentUserId;
              const targetRole = user.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
              return (
                <tr key={user.id} className="hover:bg-neutral-50">
                  <Td>
                    <p className="font-medium text-neutral-900">
                      {user.name ?? <span className="text-neutral-400">-</span>}
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-neutral-500">(you)</span>
                      )}
                    </p>
                    {!user.hasPassword && <p className="text-xs text-neutral-500">OAuth account</p>}
                  </Td>
                  <Td className="text-neutral-700">{user.email}</Td>
                  <Td>
                    <Badge tone={user.role === "ADMIN" ? "info" : "neutral"}>{user.role}</Badge>
                  </Td>
                  <Td className="text-right">
                    {user.ordersCount > 0 ? (
                      <Link
                        href={`/admin/orders?q=${encodeURIComponent(user.email)}`}
                        className="hover:underline"
                      >
                        {user.ordersCount}
                      </Link>
                    ) : (
                      <span className="text-neutral-400">0</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-neutral-500">
                    {formatDate(user.createdAt)}
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      {isSelf ? (
                        <span
                          className="text-xs text-neutral-400"
                          title="You cannot change your own role"
                        >
                          Cannot change own role
                        </span>
                      ) : (
                        <form action={setUserRole}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="role" value={targetRole} />
                          <input type="hidden" name="returnTo" value={returnTo} />
                          <ConfirmSubmitButton
                            variant="ghost"
                            size="sm"
                            className={
                              targetRole === "CUSTOMER"
                                ? "text-rose-600 hover:bg-rose-50"
                                : undefined
                            }
                            confirmMessage={
                              targetRole === "ADMIN"
                                ? `Give ${user.email} full admin access?`
                                : `Remove admin access from ${user.email}?`
                            }
                          >
                            {targetRole === "ADMIN" ? "Make admin" : "Make customer"}
                          </ConfirmSubmitButton>
                        </form>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </TableBody>
        </Table>
      )}

      <AdminPagination pagination={pagination} basePath={CUSTOMERS_PATH} preserve={preserve} />
    </>
  );
}
