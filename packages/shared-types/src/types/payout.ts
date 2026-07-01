import type { PayoutStatus } from "../enums";

export interface Payout {
  id: string;
  vendorId: string;
  subOrderId: string;
  amountMinor: number;
  status: PayoutStatus;
  razorpaySettlementId: string | null;
  processedAt: string | null;
  createdAt: string;
  subOrder?: { subOrderNumber: string };
}
