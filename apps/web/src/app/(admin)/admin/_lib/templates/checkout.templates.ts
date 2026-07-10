import { PageTemplate, buildTemplateConfig, heading, subheading, body, label, button, photo, linkTo } from "./helpers";

export const checkoutTemplates: PageTemplate[] = [
  {
    id: "checkout-single-page", pageTypeId: "checkout", name: "Single-Page Checkout",
    config: buildTemplateConfig(
      "Checkout",
      {
        height: 900,
        components: [
          heading(160, 60, 600, 60, "Checkout"),
          label(160, 150, 300, 20, "CONTACT"),
          photo(160, 180, 760, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          label(160, 260, 300, 20, "SHIPPING ADDRESS"),
          photo(160, 290, 760, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(160, 356, 760, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          label(160, 440, 300, 20, "PAYMENT"),
          photo(160, 470, 760, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(1040, 60, 720, 500, { bgColor: "#f8fafc", borderRadius: 12 }),
          label(1080, 100, 300, 20, "ORDER SUMMARY"),
          body(1080, 140, 640, 24, "Subtotal          $147.00"),
          body(1080, 170, 640, 24, "Shipping          Free"),
          heading(1080, 220, 640, 40, "Total  $147.00", { fontSize: 22 }),
          button(160, 560, 660, 56, "Place Order", linkTo("payment-confirmation"), { bgColor: "#16a34a" }),
        ],
      },
      {
        height: 900,
        components: [
          heading(16, 24, 343, 40, "Checkout", { fontSize: 24 }),
          label(16, 80, 300, 18, "CONTACT"),
          photo(16, 104, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          label(16, 170, 300, 18, "SHIPPING ADDRESS"),
          photo(16, 194, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          label(16, 260, 300, 18, "PAYMENT"),
          photo(16, 284, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          heading(16, 360, 300, 36, "Total  $147.00", { fontSize: 20 }),
          button(16, 420, 343, 52, "Place Order", linkTo("payment-confirmation"), { bgColor: "#16a34a" }),
        ],
      },
    ),
  },
  {
    id: "checkout-steps", pageTypeId: "checkout", name: "Step-by-Step",
    config: buildTemplateConfig(
      "Checkout",
      {
        height: 760,
        components: [
          label(160, 60, 1600, 24, "STEP 2 OF 3 — SHIPPING"),
          heading(160, 100, 600, 50, "Shipping Details", { fontSize: 30 }),
          photo(160, 180, 900, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(160, 246, 900, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(160, 312, 430, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(630, 312, 430, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(160, 420, 220, 52, "Continue to Payment", linkTo("payment-confirmation")),
        ],
      },
      {
        height: 640,
        components: [
          label(16, 24, 343, 18, "STEP 2 OF 3 — SHIPPING"),
          heading(16, 50, 343, 44, "Shipping Details", { fontSize: 22 }),
          photo(16, 110, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(16, 174, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(16, 250, 343, 52, "Continue", linkTo("payment-confirmation")),
        ],
      },
    ),
  },
  {
    id: "checkout-guest-express", pageTypeId: "checkout", name: "Guest Express",
    config: buildTemplateConfig(
      "Checkout",
      {
        height: 700,
        components: [
          heading(660, 60, 600, 60, "Express Checkout", { textAlign: "center" }),
          body(660, 130, 600, 30, "3 items · $147.00", { textAlign: "center", fontColor: "#64748b" }),
          photo(760, 200, 400, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(760, 266, 400, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(760, 340, 400, 56, "Pay & Place Order", linkTo("payment-confirmation"), { bgColor: "#16a34a" }),
          body(760, 410, 400, 24, "Secure checkout · SSL encrypted", { fontColor: "#94a3b8", fontSize: 12, textAlign: "center" }),
        ],
      },
      {
        height: 600,
        components: [
          heading(16, 40, 343, 50, "Express Checkout", { fontSize: 22, textAlign: "center" }),
          body(16, 96, 343, 24, "3 items · $147.00", { textAlign: "center", fontColor: "#64748b" }),
          photo(16, 140, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(16, 210, 343, 52, "Pay & Place Order", linkTo("payment-confirmation"), { bgColor: "#16a34a" }),
        ],
      },
    ),
  },
];
