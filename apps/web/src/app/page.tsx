"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/products");
    }
  }

  return (
    <div className="flex flex-col items-center pt-16 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-2xl">
        <div className="flex items-center rounded-full border-2 border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="pl-5 text-gray-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, brands or categories..."
            className="flex-1 py-4 px-4 text-base outline-none bg-transparent placeholder:text-gray-400"
            autoFocus
          />
          <button
            type="submit"
            className="m-1.5 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
