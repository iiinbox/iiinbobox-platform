import { PageTemplate, buildTemplateConfig, heading, subheading, body, label, button, photo, linkTo } from "./helpers";

function statCard(x: number, y: number, w: number, title: string, value: string) {
  return [
    photo(x, y, w, 140, { bgColor: "#f8fafc", borderRadius: 12 }),
    label(x + 20, y + 20, w - 40, 18, title),
    heading(x + 20, y + 50, w - 40, 50, value, { fontSize: 30 }),
  ];
}

export const vendorDashboardTemplates: PageTemplate[] = [
  {
    id: "vendor-dashboard-overview", pageTypeId: "vendor-dashboard", name: "Overview Grid",
    config: buildTemplateConfig(
      "Vendor Dashboard",
      {
        height: 800,
        components: [
          heading(160, 60, 700, 60, "Dashboard"),
          body(160, 130, 500, 30, "Welcome back, here's your store today.", { fontColor: "#64748b" }),
          ...statCard(160, 200, 400, "TOTAL SALES", "$4,280"),
          ...statCard(600, 200, 400, "ORDERS", "38"),
          ...statCard(1040, 200, 400, "PRODUCTS", "56"),
          ...statCard(1480, 200, 400, "PAYOUTS DUE", "$920"),
          button(160, 400, 220, 52, "View Orders", linkTo("vendor-orders")),
          button(400, 400, 220, 52, "View Products", linkTo("vendor-products"), { buttonStyle: "outline", bgColor: "#111827", fontColor: "#111827", borderColor: "#111827" }),
        ],
      },
      {
        height: 900,
        components: [
          heading(16, 24, 343, 40, "Dashboard", { fontSize: 24 }),
          ...statCard(16, 80, 163, "SALES", "$4,280"),
          ...statCard(196, 80, 163, "ORDERS", "38"),
          button(16, 380, 343, 48, "View Orders", linkTo("vendor-orders")),
          button(16, 436, 343, 48, "View Products", linkTo("vendor-products"), { buttonStyle: "outline", bgColor: "#111827", fontColor: "#111827", borderColor: "#111827" }),
        ],
      },
    ),
  },
  {
    id: "vendor-dashboard-sidebar", pageTypeId: "vendor-dashboard", name: "Sidebar Nav",
    config: buildTemplateConfig(
      "Vendor Dashboard",
      {
        height: 800,
        components: [
          photo(0, 0, 320, 800, { bgColor: "#111827", borderRadius: 0 }),
          subheading(40, 40, 240, 30, "My Store", { fontColor: "#ffffff" }),
          body(40, 100, 240, 24, "Dashboard", { fontColor: "#ffffff" }),
          body(40, 140, 240, 24, "Orders", { fontColor: "#94a3b8" }),
          body(40, 180, 240, 24, "Products", { fontColor: "#94a3b8" }),
          body(40, 220, 240, 24, "Payouts", { fontColor: "#94a3b8" }),
          heading(380, 60, 600, 60, "Recent Orders", { fontSize: 28 }),
          photo(380, 140, 1480, 400, { bgColor: "#f8fafc", borderRadius: 12 }),
          button(380, 570, 220, 48, "View All Orders", linkTo("vendor-orders")),
        ],
      },
      {
        height: 700,
        components: [
          heading(16, 24, 343, 40, "Recent Orders", { fontSize: 22 }),
          photo(16, 80, 343, 300, { bgColor: "#f8fafc", borderRadius: 12 }),
          button(16, 400, 343, 48, "View All Orders", linkTo("vendor-orders")),
        ],
      },
    ),
  },
  {
    id: "vendor-dashboard-analytics", pageTypeId: "vendor-dashboard", name: "Analytics Focus",
    config: buildTemplateConfig(
      "Vendor Dashboard",
      {
        height: 800,
        components: [
          heading(160, 60, 700, 60, "Analytics"),
          photo(160, 150, 1600, 400, { bgColor: "#f8fafc", borderRadius: 12 }),
          label(200, 180, 200, 18, "REVENUE THIS MONTH"),
          heading(200, 210, 400, 50, "$12,480", { fontSize: 34 }),
          button(160, 580, 220, 52, "Full Report", linkTo("reports")),
          button(400, 580, 220, 52, "View Orders", linkTo("vendor-orders"), { buttonStyle: "outline", bgColor: "#111827", fontColor: "#111827", borderColor: "#111827" }),
        ],
      },
      {
        height: 700,
        components: [
          heading(16, 24, 343, 40, "Analytics", { fontSize: 22 }),
          photo(16, 80, 343, 220, { bgColor: "#f8fafc", borderRadius: 12 }),
          label(32, 100, 200, 16, "REVENUE"),
          heading(32, 122, 300, 40, "$12,480", { fontSize: 24 }),
          button(16, 330, 343, 48, "Full Report", linkTo("reports")),
        ],
      },
    ),
  },
];
