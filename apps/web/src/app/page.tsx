import Link from "next/link";
import { HomeSearch } from "@/components/home-search";

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
      {categories.length > 0 && (
        <div className="flex overflow-x-auto shrink-0 items-center border-r border-gray-100">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="whitespace-nowrap px-4 py-3 text-sm font-medium text-black hover:bg-gray-50"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}
      <HomeSearch />
    </div>
  );
}
