"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function CategoryDropdown({
  categories,
  compact = false,
}: {
  categories: Category[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [panelTop, setPanelTop] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function toggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPanelTop(rect.bottom);
    }
    setOpen((v) => !v);
  }

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        btnRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className={`flex shrink-0 items-center gap-1.5 text-sm font-medium text-black bg-white whitespace-nowrap hover:bg-gray-50 select-none ${compact ? "px-3 py-2" : "px-4 py-3 border-r border-gray-100"}`}
      >
        <span className="sm:hidden">Category</span>
        <span className="hidden sm:inline">Shop by category</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
        >
          <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-md"
          style={{ top: panelTop }}
        >
          <div className="px-8 py-6">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-5">
              Category
            </p>
            <div className="grid grid-cols-4 gap-x-10 gap-y-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="text-sm font-semibold text-black hover:underline underline-offset-2"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
