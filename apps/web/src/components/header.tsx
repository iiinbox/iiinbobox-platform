import { getSession } from "@/lib/session";
import { HeaderClient } from "./header-client";

interface Category { id: string; name: string; slug: string }

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(
      `${process.env.API_INTERNAL_URL ?? "http://api:4000"}/categories`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function Header() {
  const [user, categories] = await Promise.all([
    Promise.resolve(getSession()),
    getCategories(),
  ]);
  return <HeaderClient user={user} categories={categories} />;
}
