import { PageTemplate, DESKTOP_W, buildTemplateConfig, heading, subheading, body, label, button, photo, linkTo } from "./helpers";

export const productDetailTemplates: PageTemplate[] = [
  {
    id: "product-detail-split", pageTypeId: "product-detail", name: "Image Left, Info Right",
    config: buildTemplateConfig(
      "Product Detail",
      {
        height: 900,
        components: [
          photo(160, 80, 760, 760),
          label(1000, 80, 400, 20, "IN STOCK"),
          heading(1000, 110, 700, 60, "Product Name", { fontSize: 34 }),
          subheading(1000, 180, 300, 40, "$79.00", { fontSize: 28, fontColor: "#111827" }),
          body(1000, 240, 700, 120, "A short, compelling description of the product goes here. Highlight the key features and benefits that matter most to your customer."),
          button(1000, 400, 260, 56, "Buy Now", linkTo("checkout"), { bgColor: "#16a34a", hoverBgColor: "#15803d" }),
          button(1280, 400, 260, 56, "Add to Cart", linkTo("cart"), { buttonStyle: "outline", bgColor: "#111827", fontColor: "#111827", borderColor: "#111827" }),
          body(1000, 490, 700, 60, "Free shipping · 30-day returns · Secure checkout", { fontColor: "#64748b", fontSize: 13 }),
        ],
      },
      {
        height: 900,
        components: [
          photo(0, 0, 375, 375, { borderRadius: 0 }),
          heading(16, 400, 343, 50, "Product Name", { fontSize: 24 }),
          subheading(16, 456, 200, 36, "$79.00", { fontSize: 22 }),
          body(16, 500, 343, 90, "A short, compelling product description."),
          button(16, 600, 343, 52, "Buy Now", linkTo("checkout"), { bgColor: "#16a34a" }),
          button(16, 660, 343, 52, "Add to Cart", linkTo("cart"), { buttonStyle: "outline", bgColor: "#111827", fontColor: "#111827", borderColor: "#111827" }),
        ],
      },
    ),
  },
  {
    id: "product-detail-full-hero", pageTypeId: "product-detail", name: "Full-Width Hero",
    config: buildTemplateConfig(
      "Product Detail",
      {
        height: 1200,
        components: [
          photo(0, 0, DESKTOP_W, 700, { borderRadius: 0 }),
          heading(660, 740, 600, 60, "Product Name", { fontSize: 34, textAlign: "center" }),
          subheading(760, 800, 400, 40, "$79.00", { fontSize: 26, textAlign: "center" }),
          button(760, 870, 200, 52, "Buy Now", linkTo("checkout"), { bgColor: "#16a34a" }),
          body(560, 960, 800, 100, "A short, compelling description of the product highlighting key features and benefits.", { textAlign: "center" }),
        ],
      },
      {
        height: 900,
        components: [
          photo(0, 0, 375, 375, { borderRadius: 0 }),
          heading(16, 400, 343, 50, "Product Name", { fontSize: 24, textAlign: "center" }),
          subheading(16, 456, 343, 36, "$79.00", { fontSize: 22, textAlign: "center" }),
          button(48, 510, 279, 52, "Buy Now", linkTo("checkout"), { bgColor: "#16a34a" }),
          body(16, 580, 343, 90, "A short product description here.", { textAlign: "center" }),
        ],
      },
    ),
  },
  {
    id: "product-detail-gallery-sticky", pageTypeId: "product-detail", name: "Gallery + Sticky Info",
    config: buildTemplateConfig(
      "Product Detail",
      {
        height: 980,
        components: [
          photo(160, 80, 380, 380),
          photo(560, 80, 380, 380),
          photo(160, 480, 380, 380),
          photo(560, 480, 380, 380),
          heading(1040, 80, 700, 60, "Product Name", { fontSize: 32 }),
          subheading(1040, 150, 300, 36, "$79.00"),
          label(1040, 200, 400, 20, "Select Size"),
          button(1040, 230, 80, 44, "S", { type: "custom", value: "" }, { buttonStyle: "outline", bgColor: "#111827", fontColor: "#111827", borderColor: "#111827", borderRadius: 6 }),
          button(1130, 230, 80, 44, "M", { type: "custom", value: "" }, { buttonStyle: "outline", bgColor: "#111827", fontColor: "#111827", borderColor: "#111827", borderRadius: 6 }),
          button(1220, 230, 80, 44, "L", { type: "custom", value: "" }, { buttonStyle: "outline", bgColor: "#111827", fontColor: "#111827", borderColor: "#111827", borderRadius: 6 }),
          button(1040, 300, 660, 56, "Add to Cart", linkTo("cart"), { bgColor: "#111827" }),
          button(1040, 370, 660, 56, "Buy Now", linkTo("checkout"), { bgColor: "#16a34a" }),
        ],
      },
      {
        height: 1000,
        components: [
          photo(0, 0, 375, 375, { borderRadius: 0 }),
          heading(16, 400, 343, 50, "Product Name", { fontSize: 24 }),
          subheading(16, 456, 200, 36, "$79.00", { fontSize: 22 }),
          button(16, 520, 343, 52, "Add to Cart", linkTo("cart"), { bgColor: "#111827" }),
          button(16, 580, 343, 52, "Buy Now", linkTo("checkout"), { bgColor: "#16a34a" }),
        ],
      },
    ),
  },
];
