import { PageTemplate, buildTemplateConfig, heading, body, button, photo, icon, linkTo } from "./helpers";

export const contactUsTemplates: PageTemplate[] = [
  {
    id: "contact-us-form-map", pageTypeId: "contact-us", name: "Form + Map",
    config: buildTemplateConfig(
      "Contact Us",
      {
        height: 800,
        components: [
          heading(160, 60, 700, 60, "Get in Touch"),
          body(160, 140, 600, 40, "We'd love to hear from you. Fill out the form and we'll respond within 24 hours."),
          photo(160, 220, 700, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(160, 286, 700, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(160, 352, 700, 140, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(160, 510, 220, 52, "Send Message", { type: "custom", value: "" }),
          button(400, 510, 200, 52, "View FAQ", linkTo("faq"), { buttonStyle: "outline", bgColor: "#111827", fontColor: "#111827", borderColor: "#111827" }),
          photo(1000, 60, 760, 620, { bgColor: "#dbeafe" }),
        ],
      },
      {
        height: 900,
        components: [
          heading(16, 24, 343, 50, "Get in Touch", { fontSize: 24 }),
          body(16, 84, 343, 60, "We'd love to hear from you."),
          photo(16, 150, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(16, 210, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(16, 270, 343, 120, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(16, 410, 343, 52, "Send Message", { type: "custom", value: "" }),
        ],
      },
    ),
  },
  {
    id: "contact-us-info-cards", pageTypeId: "contact-us", name: "Info Cards",
    config: buildTemplateConfig(
      "Contact Us",
      {
        height: 700,
        components: [
          heading(660, 60, 600, 60, "Contact Us", { textAlign: "center" }),
          icon(300, 220, 48, 48, "phone"),
          body(220, 290, 200, 24, "Call Us", { textAlign: "center", fontWeight: 600 }),
          body(220, 320, 200, 24, "+1 555 0100", { textAlign: "center", fontColor: "#64748b" }),
          icon(900, 220, 48, 48, "mail"),
          body(820, 290, 200, 24, "Email Us", { textAlign: "center", fontWeight: 600 }),
          body(820, 320, 200, 24, "hello@site.com", { textAlign: "center", fontColor: "#64748b" }),
          icon(1500, 220, 48, 48, "map-pin"),
          body(1420, 290, 200, 24, "Visit Us", { textAlign: "center", fontWeight: 600 }),
          body(1420, 320, 200, 24, "123 Main St", { textAlign: "center", fontColor: "#64748b" }),
          button(810, 420, 300, 52, "View FAQ", linkTo("faq")),
        ],
      },
      {
        height: 700,
        components: [
          heading(16, 32, 343, 50, "Contact Us", { fontSize: 24, textAlign: "center" }),
          icon(163, 120, 40, 40, "phone"),
          body(16, 172, 343, 22, "+1 555 0100", { textAlign: "center" }),
          icon(163, 220, 40, 40, "mail"),
          body(16, 272, 343, 22, "hello@site.com", { textAlign: "center" }),
          button(48, 340, 279, 52, "View FAQ", linkTo("faq")),
        ],
      },
    ),
  },
  {
    id: "contact-us-split-banner", pageTypeId: "contact-us", name: "Split Banner",
    config: buildTemplateConfig(
      "Contact Us",
      {
        height: 700,
        components: [
          photo(0, 0, 900, 700, { borderRadius: 0 }),
          heading(1000, 100, 700, 60, "Let's Talk", { fontSize: 40 }),
          body(1000, 180, 600, 60, "Have a question? We're here to help — reach out any time."),
          photo(1000, 260, 700, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(1000, 326, 700, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(1000, 400, 220, 52, "Send Message", { type: "custom", value: "" }),
        ],
      },
      {
        height: 800,
        components: [
          photo(0, 0, 375, 260, { borderRadius: 0 }),
          heading(16, 284, 343, 50, "Let's Talk", { fontSize: 24 }),
          body(16, 344, 343, 60, "Have a question? We're here to help."),
          photo(16, 410, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(16, 470, 343, 52, "Send Message", { type: "custom", value: "" }),
        ],
      },
    ),
  },
];
