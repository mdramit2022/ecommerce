/** Serialisable review shapes shared by Server Components, Client Components and API responses. */

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export type ReviewAuthor = {
  name: string | null;
  image: string | null;
};

export type ReviewData = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string; // ISO 8601
  author: ReviewAuthor;
  userId: string;
  productId: string;
};

/** Number of reviews per star value. */
export type RatingDistribution = Record<ReviewRating, number>;

export type RatingSummary = {
  /** Mean rating rounded to one decimal place; 0 when there are no reviews. */
  average: number;
  count: number;
  distribution: RatingDistribution;
};
