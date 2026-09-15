/** Mean rating (1 dp, 0 when unrated) and review count, as shown on product cards. */
export type ProductRating = {
  average: number;
  count: number;
};

/** Serialisable product shape used by Client Components and the cart store. */
export type ProductCardData = {
  id: string;
  title: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  image: string | null;
  category: { name: string; slug: string };
  /** Present when the caller attached review aggregates (see lib/reviews/ratings.ts). */
  rating?: ProductRating;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: Pagination;
};

/** Full product shape for the detail page. Superset of `ProductCardData`. */
export type ProductDetailData = ProductCardData & {
  description: string;
  images: string[];
  categoryId: string;
  isFeatured: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};
