import { VendorStatus } from "@iiiiibox/shared-types";
import { getServerApiClient } from "@/lib/server-api";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VendorActions } from "./vendor-actions";

export default async function AdminVendorsPage() {
  const vendors = await getServerApiClient().adminVendors.list(VendorStatus.PENDING);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vendor applications</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {vendors.length === 0 ? "No pending applications." : `${vendors.length} pending`}
        </p>
      </div>

      {vendors.length > 0 && (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.storeName}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{vendor.user.name}</p>
                      <p className="text-xs text-muted-foreground">{vendor.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(vendor.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="pending">{vendor.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <VendorActions vendorId={vendor.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
