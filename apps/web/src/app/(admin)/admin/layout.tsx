import Link from "next/link";
import { Users, Package, ShoppingBag, Shield, LayoutGrid } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const NAV = [
  { href: "/admin/vendors", label: "Vendors", icon: Users },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container flex gap-8 py-8 min-h-[calc(100vh-56px)]">
      <aside className="w-52 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Admin</p>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <Separator orientation="vertical" className="h-auto" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
