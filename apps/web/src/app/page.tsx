"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/products?search=${encodeURIComponent(query.trim())}` : "/products");
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="flex-1 px-4 py-3 text-sm outline-none bg-white text-black placeholder:text-gray-400"
        autoFocus
      />
      <button
        type="submit"
        className="px-5 py-3 text-sm font-medium bg-black text-white"
      >
        Search
      </button>
    </form>
  );
}
