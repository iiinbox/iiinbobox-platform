import { AdminTopNav } from "./nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <AdminTopNav />
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-4 py-4">
        {children}
      </div>
    </div>
  );
}
