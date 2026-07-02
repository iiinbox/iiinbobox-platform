"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, User, ShoppingCart } from "lucide-react";
import { Logo } from "@/components/logo";
import { CategoryDropdown } from "@/components/category-dropdown";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SessionUser } from "@/lib/session";

interface Category { id: string; name: string; slug: string }

export function HeaderClient({
  user,
  categories,
}: {
  user: SessionUser | null;
  categories: Category[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(
      query.trim()
        ? `/products?search=${encodeURIComponent(query.trim())}`
        : "/products"
    );
  }

  return (
    <header className="w-full bg-white">
      {/* Row 1: Logo + Icons */}
      <div className="flex items-center justify-between px-4 md:px-6 pt-3 pb-2">
        <Link href="/" aria-label="iiinbox home" className="shrink-0">
          <Logo size={44} />
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center w-11 h-11">
                <User className="h-6 w-6 text-black" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user ? (
                <>
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/orders">My orders</Link>
                    </DropdownMenuItem>
                    {user.role === "VENDOR" && (
                      <DropdownMenuItem asChild>
                        <Link href="/vendor/dashboard">Vendor dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === "ADMIN" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/vendors">Admin panel</Link>
                      </DropdownMenuItem>
                    )}
                    {!["VENDOR", "ADMIN"].includes(user.role) && (
                      <DropdownMenuItem asChild>
                        <Link href="/vendor/apply">Become a vendor</Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild><Link href="/login">Log in</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/register">Register</Link></DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/cart" className="flex items-center justify-center w-11 h-11">
            <ShoppingCart className="h-6 w-6 text-black" />
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center justify-center w-11 h-11">
                <Menu className="h-6 w-6 text-black" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-6">
              <nav className="flex flex-col gap-4 mt-6">
                <Link href="/products" className="text-sm font-medium">Browse</Link>
                <Link href="/orders" className="text-sm font-medium">My orders</Link>
                <Link href="/cart" className="text-sm font-medium">Cart</Link>
                {user?.role === "VENDOR" && (
                  <Link href="/vendor/dashboard" className="text-sm font-medium">Vendor dashboard</Link>
                )}
                {user?.role === "ADMIN" && (
                  <Link href="/admin/vendors" className="text-sm font-medium">Admin panel</Link>
                )}
                {!user && (
                  <>
                    <Link href="/login" className="text-sm font-medium">Log in</Link>
                    <Link href="/register" className="text-sm font-medium">Register</Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Row 2: Full-width search bar */}
      <div className="px-4 md:px-6 pb-3">
        <form
          onSubmit={onSearch}
          className="flex items-stretch border-2 border-black rounded overflow-hidden"
        >
          <CategoryDropdown categories={categories} compact />

          <div className="w-px bg-gray-300 shrink-0" />

          <div className="flex flex-1 items-center px-3 min-w-0">
            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none"
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
              className="flex-1 min-w-0 pl-2 py-3 text-sm outline-none bg-transparent text-black placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            className="shrink-0 px-5 py-3 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
}
