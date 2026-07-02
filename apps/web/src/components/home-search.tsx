"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      query.trim()
        ? `/products?search=${encodeURIComponent(query.trim())}`
        : "/products"
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-1">
      <div className="flex flex-1 items-center px-4 bg-white">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 text-gray-400"
          aria-hidden
        >
          <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for anything"
          className="flex-1 pl-3 py-3 text-sm outline-none bg-white text-black placeholder:text-gray-400"
          autoFocus
        />
      </div>
      <button
        type="submit"
        className="px-4 sm:px-5 py-3 text-sm font-medium bg-black text-white whitespace-nowrap"
      >
        <span className="hidden sm:inline">Search</span>
        <svg className="sm:hidden" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="6.5" cy="6.5" r="5.5" stroke="white" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
