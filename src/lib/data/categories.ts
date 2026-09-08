import "server-only";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function listCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export type CategoryRow = Awaited<ReturnType<typeof listCategories>>[number];
