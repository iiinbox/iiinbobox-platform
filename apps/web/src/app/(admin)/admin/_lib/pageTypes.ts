export type PageTypeCategory =
  | "Storefront & Commerce"
  | "Booking & Travel"
  | "Account & Auth"
  | "Vendor & Dashboard"
  | "Content & Support"
  | "Utility";

export interface PageTypeDef {
  // Canonical slug — becomes the PageConfig row key when this type is used to
  // create a page, and is what hand-built templates' pre-linked buttons point
  // at (e.g. a "Buy Now" button targets the "checkout" id below).
  id: string;
  label: string;
  category: PageTypeCategory;
  // True only for the ~12 page types with genuinely hand-built templates
  // (see _lib/templates/index.ts). Every other type still works in the New
  // Page dialog — it just falls back to the generic starter layouts.
  hasCustomTemplates: boolean;
}

const CUSTOM_TEMPLATE_IDS = new Set([
  "homepage", "product-listing", "product-detail", "cart", "checkout",
  "taxi-booking", "contact-us", "about", "login", "register",
  "vendor-dashboard", "blog-listing",
]);

function def(id: string, label: string, category: PageTypeCategory): PageTypeDef {
  return { id, label, category, hasCustomTemplates: CUSTOM_TEMPLATE_IDS.has(id) };
}

export const PAGE_TYPES: PageTypeDef[] = [
  // Storefront & Commerce
  def("homepage", "Homepage", "Storefront & Commerce"),
  def("product-listing", "Product Listing", "Storefront & Commerce"),
  def("product-detail", "Product Detail", "Storefront & Commerce"),
  def("category-page", "Category Page", "Storefront & Commerce"),
  def("cart", "Cart", "Storefront & Commerce"),
  def("checkout", "Checkout", "Storefront & Commerce"),
  def("payment-confirmation", "Payment Confirmation", "Storefront & Commerce"),
  def("invoice", "Invoice", "Storefront & Commerce"),
  def("wishlist", "Wishlist", "Storefront & Commerce"),
  def("reviews", "Reviews", "Storefront & Commerce"),
  def("search-results", "Search Results", "Storefront & Commerce"),
  def("orders", "Orders", "Storefront & Commerce"),
  def("order-detail", "Order Detail", "Storefront & Commerce"),

  // Booking & Travel
  def("booking-page", "Booking Page", "Booking & Travel"),
  def("travel-booking", "Travel Booking", "Booking & Travel"),
  def("taxi-booking", "Taxi Booking", "Booking & Travel"),
  def("booking-confirmation", "Booking Confirmation", "Booking & Travel"),
  def("driver-profile", "Driver Profile", "Booking & Travel"),
  def("ride-history", "Ride History", "Booking & Travel"),
  def("service-list", "Service List", "Booking & Travel"),
  def("service-detail", "Service Detail", "Booking & Travel"),

  // Account & Auth
  def("login", "Login", "Account & Auth"),
  def("register", "Register", "Account & Auth"),
  def("forgot-password", "Forgot Password", "Account & Auth"),
  def("account-settings", "Account Settings", "Account & Auth"),
  def("address-book", "Address Book", "Account & Auth"),
  def("notifications", "Notifications", "Account & Auth"),

  // Vendor & Dashboard
  def("vendor-dashboard", "Vendor Dashboard", "Vendor & Dashboard"),
  def("vendor-orders", "Vendor Orders", "Vendor & Dashboard"),
  def("vendor-products", "Vendor Products", "Vendor & Dashboard"),
  def("vendor-analytics", "Vendor Analytics", "Vendor & Dashboard"),
  def("vendor-payouts", "Vendor Payouts", "Vendor & Dashboard"),
  def("admin-dashboard", "Admin Dashboard", "Vendor & Dashboard"),
  def("reports", "Reports", "Vendor & Dashboard"),
  def("settings", "Settings", "Vendor & Dashboard"),

  // Content & Support
  def("about", "About", "Content & Support"),
  def("contact-us", "Contact Us", "Content & Support"),
  def("blog-listing", "Blog Listing", "Content & Support"),
  def("blog-post", "Blog Post", "Content & Support"),
  def("faq", "FAQ", "Content & Support"),
  def("help-center", "Help Center", "Content & Support"),
  def("terms-of-service", "Terms of Service", "Content & Support"),
  def("privacy-policy", "Privacy Policy", "Content & Support"),
  def("404", "404 Not Found", "Content & Support"),
  def("coming-soon", "Coming Soon", "Content & Support"),

  // Utility
  def("landing-page", "Landing Page", "Utility"),
  def("thank-you", "Thank You", "Utility"),
  def("maintenance", "Maintenance", "Utility"),
  def("pricing", "Pricing", "Utility"),
  def("careers", "Careers", "Utility"),
  def("team", "Team", "Utility"),
];

export const PAGE_TYPE_CATEGORIES: PageTypeCategory[] = [
  "Storefront & Commerce",
  "Booking & Travel",
  "Account & Auth",
  "Vendor & Dashboard",
  "Content & Support",
  "Utility",
];

export function findPageType(id: string): PageTypeDef | undefined {
  return PAGE_TYPES.find((t) => t.id === id);
}
