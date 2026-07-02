import Link from "next/link";
import { HomeSearch } from "@/components/home-search";
import { CategoryDropdown } from "@/components/category-dropdown";

interface Category {
  id: string;
  name: string;
  slug: string;
}

async function getCategories(): Promise<Category[]> {
  try {
    const apiUrl = process.env.API_INTERNAL_URL ?? "http://api:4000";
    const res = await fetch(`${apiUrl}/categories`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <div className="flex w-full items-stretch">
      <CategoryDropdown categories={categories} />
      <HomeSearch />
    </div>
  );
}
