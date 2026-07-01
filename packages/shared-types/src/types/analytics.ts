export interface VendorAnalytics {
  totalRevenueMinor: number;
  thisMonthRevenueMinor: number;
  totalOrders: number;
  topProducts: { title: string; slug: string; totalSold: number; revenueMinor: number }[];
}
