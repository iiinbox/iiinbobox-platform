import type { OrderStatus, PaymentStatus, SubOrderStatus } from "../enums";

export interface OrderItemSummary {
  id: string;
  productId: string;
  titleSnapshot: string;
  priceMinorSnap: number;
  quantity: number;
}

export interface SubOrderSummary {
  id: string;
  subOrderNumber: string;
  vendorId: string;
  status: SubOrderStatus;
  itemsSubtotalMinor: number;
  commissionMinor: number;
  vendorPayoutMinor: number;
  items: OrderItemSummary[];
  vendor?: { storeName: string; storeSlug: string };
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmountMinor: number;
  currency: string;
  createdAt: string;
  subOrders: SubOrderSummary[];
}

export interface CheckoutSession {
  orderId: string;
  razorpayOrderId: string;
  amountMinor: number;
  currency: string;
  razorpayKeyId: string;
}

export interface PaymentSummary {
  id: string;
  orderId: string;
  status: PaymentStatus;
  amountMinor: number;
  currency: string;
}

export interface VendorSubOrder {
  id: string;
  subOrderNumber: string;
  status: SubOrderStatus;
  itemsSubtotalMinor: number;
  commissionMinor: number;
  vendorPayoutMinor: number;
  items: OrderItemSummary[];
  order: { orderNumber: string; createdAt: string; user: { name: string; email: string } };
}

export interface AdminOrderSummary extends OrderSummary {
  user: { name: string; email: string };
}
