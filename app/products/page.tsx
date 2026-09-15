import { redirect } from "next/navigation";

/** /products has no listing of its own - the searchable catalog lives at /shop. */
export default function ProductsIndexPage() {
  redirect("/shop");
}
