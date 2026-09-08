import { listCategories } from "@/lib/data/categories";
import { CategoriesClient } from "@/components/categories/categories-client";

export default async function CategoriesPage() {
  const categories = await listCategories();
  return <CategoriesClient categories={categories} />;
}
