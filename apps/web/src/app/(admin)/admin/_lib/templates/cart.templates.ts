import { PageTemplate, buildTemplateConfig, heading, subheading, body, label, button, photo, linkTo } from "./helpers";

function cartLine(y: number) {
  return [
    photo(160, y, 120, 120),
    subheading(300, y + 10, 500, 30, "Product Name", { fontSize: 18 }),
    body(300, y + 50, 300, 24, "Qty: 1", { fontColor: "#64748b" }),
    subheading(1400, y + 40, 200, 30, "$49.00", { fontSize: 18, textAlign: "right" }),
  ];
}

function mobileCartLine(y: number) {
  return [
    photo(16, y, 80, 80),
    subheading(112, y + 6, 200, 24, "Product Name", { fontSize: 14 }),
    body(112, y + 34, 150, 20, "Qty: 1", { fontColor: "#64748b", fontSize: 12 }),
    subheading(280, y + 24, 80, 24, "$49.00", { fontSize: 14, textAlign: "right" }),
  ];
}

export const cartTemplates: PageTemplate[] = [
  {
    id: "cart-standard", pageTypeId: "cart", name: "Standard Cart",
    config: buildTemplateConfig(
      "Cart",
      {
        height: 800,
        components: [
          heading(160, 60, 600, 60, "Your Cart"),
          ...cartLine(180),
          ...cartLine(320),
          ...cartLine(460),
          label(1400, 600, 200, 20, "SUBTOTAL"),
          heading(1400, 630, 300, 50, "$147.00", { fontSize: 30, textAlign: "right" }),
          button(1400, 700, 360, 56, "Checkout", linkTo("checkout"), { bgColor: "#16a34a" }),
        ],
      },
      {
        height: 780,
        components: [
          heading(16, 24, 343, 40, "Your Cart", { fontSize: 24 }),
          ...mobileCartLine(80),
          ...mobileCartLine(180),
          ...mobileCartLine(280),
          label(16, 400, 200, 18, "SUBTOTAL"),
          heading(16, 424, 300, 36, "$147.00", { fontSize: 22 }),
          button(16, 480, 343, 52, "Checkout", linkTo("checkout"), { bgColor: "#16a34a" }),
          button(16, 544, 343, 44, "Continue Shopping", linkTo("product-listing"), { buttonStyle: "outline", bgColor: "#111827", fontColor: "#111827", borderColor: "#111827" }),
        ],
      },
    ),
  },
  {
    id: "cart-summary-panel", pageTypeId: "cart", name: "Order Summary Panel",
    config: buildTemplateConfig(
      "Cart",
      {
        height: 820,
        components: [
          heading(160, 60, 600, 60, "Your Cart (3)"),
          ...cartLine(180),
          ...cartLine(320),
          ...cartLine(460),
          photo(1360, 60, 400, 500, { bgColor: "#f8fafc", borderRadius: 12 }),
          label(1400, 100, 300, 20, "ORDER SUMMARY"),
          body(1400, 140, 300, 24, "Subtotal          $147.00"),
          body(1400, 170, 300, 24, "Shipping          Free"),
          heading(1400, 220, 300, 40, "Total  $147.00", { fontSize: 22 }),
          button(1400, 480, 320, 56, "Checkout", linkTo("checkout"), { bgColor: "#16a34a" }),
        ],
      },
      {
        height: 780,
        components: [
          heading(16, 24, 343, 40, "Your Cart (3)", { fontSize: 24 }),
          ...mobileCartLine(80),
          ...mobileCartLine(180),
          ...mobileCartLine(280),
          heading(16, 400, 300, 36, "Total  $147.00", { fontSize: 20 }),
          button(16, 460, 343, 52, "Checkout", linkTo("checkout"), { bgColor: "#16a34a" }),
        ],
      },
    ),
  },
  {
    id: "cart-empty-friendly", pageTypeId: "cart", name: "Cart with Empty State",
    config: buildTemplateConfig(
      "Cart",
      {
        height: 700,
        components: [
          heading(660, 200, 600, 60, "Your cart is empty", { textAlign: "center" }),
          body(660, 280, 600, 40, "Looks like you haven't added anything yet.", { textAlign: "center" }),
          button(810, 350, 300, 56, "Start Shopping", linkTo("product-listing")),
        ],
      },
      {
        height: 500,
        components: [
          heading(16, 140, 343, 50, "Your cart is empty", { fontSize: 22, textAlign: "center" }),
          body(16, 200, 343, 40, "Nothing added yet.", { textAlign: "center" }),
          button(48, 260, 279, 52, "Start Shopping", linkTo("product-listing")),
        ],
      },
    ),
  },
];
