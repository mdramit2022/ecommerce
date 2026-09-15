import type { OrderStatus, Role } from "@prisma/client";
import type { OrderSummary } from "@/types/order";

/**
 * Serialisable admin data shapes (no Decimal, no Date) shared by Server Components,
 * Client Components and the admin API routes. This module has no runtime imports so it is
 * safe to import from Client Components.
 */

export type ProductDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  category: { id: string; name: string; slug: string };
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};

export type AdminProduct = ProductDetail & {
  /** Number of order lines referencing this product (hard delete is refused when > 0). */
  orderItemCount: number;
};

export type CategoryOption = { id: string; name: string; slug: string };

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  /** Active products in this category. */
  productCount: number;
};

export type AdminCategory = Omit<PublicCategory, "productCount"> & {
  /** All products (active and inactive) in this category. */
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrderRow = OrderSummary & {
  email: string;
  customerName: string | null;
};

export type AdminCustomer = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  image: string | null;
  ordersCount: number;
  hasPassword: boolean;
  createdAt: string;
};

export type LowStockProduct = {
  id: string;
  title: string;
  slug: string;
  stock: number;
  image: string | null;
};

export type DashboardStats = {
  revenue: number;
  ordersTotal: number;
  ordersByStatus: Record<OrderStatus, number>;
  productsActive: number;
  productsTotal: number;
  customers: number;
  admins: number;
  lowStock: LowStockProduct[];
  recentOrders: AdminOrderRow[];
};
