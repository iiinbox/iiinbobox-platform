import { PageTemplate, DESKTOP_W, buildTemplateConfig, heading, subheading, body, label, button, photo, linkTo } from "./helpers";

function productCard(x: number, y: number, w: number) {
  return [
    photo(x, y, w, w),
    label(x, y + w + 12, w, 18, "IN STOCK"),
    subheading(x, y + w + 34, w, 26, "Product Name", { fontSize: 16, fontWeight: 600 }),
    body(x, y + w + 62, w, 22, "$49.00", { fontColor: "#111827", fontWeight: 700 }),
    button(x, y + w + 92, w, 40, "View Details", linkTo("product-detail"), { buttonStyle: "outline", bgColor: "#111827", fontColor: "#111827", borderColor: "#111827", borderRadius: 6 }),
  ];
}

function mobileCard(x: number, y: number, w: number) {
  return [
    photo(x, y, w, w),
    subheading(x, y + w + 10, w, 24, "Product Name", { fontSize: 14, fontWeight: 600 }),
    body(x, y + w + 34, w, 20, "$49.00", { fontColor: "#111827", fontWeight: 700, fontSize: 13 }),
  ];
}

export const productListingTemplates: PageTemplate[] = [
  {
    id: "product-listing-grid-4up", pageTypeId: "product-listing", name: "4-Up Grid",
    config: buildTemplateConfig(
      "Product Listing",
      {
        height: 1150,
        components: [
          heading(160, 60, 700, 60, "All Products"),
          body(160, 130, 600, 30, "128 items", { fontColor: "#64748b" }),
          ...productCard(160, 200, 400),
          ...productCard(600, 200, 400),
          ...productCard(1040, 200, 400),
          ...productCard(1480, 200, 400),
        ],
      },
      {
        height: 1600,
        components: [
          heading(16, 24, 343, 40, "All Products", { fontSize: 24 }),
          ...mobileCard(16, 80, 163),
          ...mobileCard(196, 80, 163),
          ...mobileCard(16, 380, 163),
          ...mobileCard(196, 380, 163),
        ],
      },
    ),
  },
  {
    id: "product-listing-sidebar-filters", pageTypeId: "product-listing", name: "Sidebar Filters",
    config: buildTemplateConfig(
      "Product Listing",
      {
        height: 1150,
        components: [
          heading(160, 60, 700, 60, "Shop All"),
          label(160, 160, 200, 24, "FILTERS"),
          body(160, 200, 240, 200, "Category\nPrice\nBrand\nAvailability", { lineHeight: 2 }),
          ...productCard(460, 160, 340),
          ...productCard(830, 160, 340),
          ...productCard(1200, 160, 340),
        ],
      },
      {
        height: 1400,
        components: [
          heading(16, 24, 343, 40, "Shop All", { fontSize: 24 }),
          button(16, 76, 120, 36, "Filters", { type: "custom", value: "" }, { buttonStyle: "outline", bgColor: "#111827", fontColor: "#111827", borderColor: "#111827" }),
          ...mobileCard(16, 130, 163),
          ...mobileCard(196, 130, 163),
          ...mobileCard(16, 430, 163),
          ...mobileCard(196, 430, 163),
        ],
      },
    ),
  },
  {
    id: "product-listing-banner-grid", pageTypeId: "product-listing", name: "Banner + Grid",
    config: buildTemplateConfig(
      "Product Listing",
      {
        height: 1300,
        components: [
          photo(0, 0, DESKTOP_W, 320, { borderRadius: 0 }),
          heading(160, 360, 700, 60, "New Arrivals"),
          ...productCard(160, 460, 400),
          ...productCard(600, 460, 400),
          ...productCard(1040, 460, 400),
          ...productCard(1480, 460, 400),
        ],
      },
      {
        height: 1500,
        components: [
          photo(0, 0, 375, 200, { borderRadius: 0 }),
          heading(16, 224, 343, 40, "New Arrivals", { fontSize: 24 }),
          ...mobileCard(16, 280, 163),
          ...mobileCard(196, 280, 163),
          ...mobileCard(16, 580, 163),
          ...mobileCard(196, 580, 163),
        ],
      },
    ),
  },
];
