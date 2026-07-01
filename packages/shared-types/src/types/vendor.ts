import type { VendorStatus } from "../enums";

export interface Vendor {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  storeDescription: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: VendorStatus;
  rejectionReason: string | null;
  razorpayAccountId: string | null;
  commissionPercent: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminVendor extends Vendor {
  user: { name: string; email: string };
}
