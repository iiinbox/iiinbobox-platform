import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, CreditCard, BarChart3 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/products", label: "Products", icon: Package },
  { href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
  { href: "/vendor/payouts", label: "Payouts", icon: CreditCard },
  { href: "/vendor/analytics", label: "Analytics", icon: BarChart3 },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container flex gap-8 py-8 min-h-[calc(100vh-56px)]">
      <aside className="w-52 shrink-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Vendor</p>
        <nav className="flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              )}
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
