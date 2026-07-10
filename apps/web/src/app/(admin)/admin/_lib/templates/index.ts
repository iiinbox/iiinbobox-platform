import type { PageTemplate } from "./helpers";
import { homepageTemplates } from "./homepage.templates";
import { productListingTemplates } from "./product-listing.templates";
import { productDetailTemplates } from "./product-detail.templates";
import { cartTemplates } from "./cart.templates";
import { checkoutTemplates } from "./checkout.templates";
import { taxiBookingTemplates } from "./taxi-booking.templates";
import { contactUsTemplates } from "./contact-us.templates";
import { aboutTemplates } from "./about.templates";
import { loginTemplates } from "./login.templates";
import { registerTemplates } from "./register.templates";
import { vendorDashboardTemplates } from "./vendor-dashboard.templates";
import { blogListingTemplates } from "./blog-listing.templates";
import { genericTemplates } from "./generic.templates";

export type { PageTemplate } from "./helpers";

const ALL_CUSTOM: PageTemplate[] = [
  ...homepageTemplates,
  ...productListingTemplates,
  ...productDetailTemplates,
  ...cartTemplates,
  ...checkoutTemplates,
  ...taxiBookingTemplates,
  ...contactUsTemplates,
  ...aboutTemplates,
  ...loginTemplates,
  ...registerTemplates,
  ...vendorDashboardTemplates,
  ...blogListingTemplates,
];

export const TEMPLATES_BY_PAGE_TYPE: Record<string, PageTemplate[]> = {};
for (const t of ALL_CUSTOM) {
  (TEMPLATES_BY_PAGE_TYPE[t.pageTypeId] ??= []).push(t);
}

export const GENERIC_TEMPLATES: PageTemplate[] = genericTemplates;

export function templatesForPageType(pageTypeId: string): PageTemplate[] {
  return TEMPLATES_BY_PAGE_TYPE[pageTypeId] ?? GENERIC_TEMPLATES;
}
