"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, User } from "lucide-react";
import { Logo } from "@/components/logo";
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

export function HeaderClient({ user }: { user: SessionUser | null }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="w-full bg-white">
      <div className="flex h-14 items-center px-4">
        {/* Logo — left corner */}
        <Link href="/" aria-label="iiinbox home">
          <Logo size={28} />
        </Link>

        {/* Right corner: profile + menu */}
        <div className="ml-auto flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center w-8 h-8">
                <User className="h-4 w-4 text-black" />
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
                  <DropdownMenuItem asChild>
                    <Link href="/login">Log in</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">Register</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menu icon */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center justify-center w-8 h-8">
                <Menu className="h-4 w-4 text-black" />
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
    </header>
  );
}
