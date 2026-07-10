// Fallback layouts for any of the 50+ page types that don't have a hand-built
// template set — so the New Page dialog never dead-ends. Generic and
// page-type-agnostic on purpose; pageTypeId is set per-use at selection time
// (see index.ts), not baked in here.
import { PageTemplate, buildTemplateConfig, heading, body, button, photo, linkTo } from "./helpers";

export const genericTemplates: PageTemplate[] = [
  {
    id: "generic-header-content", pageTypeId: "generic", name: "Header + Content",
    config: buildTemplateConfig(
      "New Page",
      {
        height: 700,
        components: [
          heading(160, 80, 1200, 70, "Page Title"),
          body(160, 170, 1200, 100, "Add a short description of this page here. Replace this text and the placeholder image below with your own content."),
          photo(160, 300, 1600, 340),
        ],
      },
      {
        height: 620,
        components: [
          heading(16, 32, 343, 60, "Page Title", { fontSize: 26 }),
          body(16, 100, 343, 90, "Add a short description of this page here.", { fontSize: 14 }),
          photo(16, 200, 343, 300),
        ],
      },
    ),
  },
  {
    id: "generic-two-column", pageTypeId: "generic", name: "Two-Column",
    config: buildTemplateConfig(
      "New Page",
      {
        height: 700,
        components: [
          heading(160, 80, 800, 70, "Page Title"),
          body(160, 170, 700, 200, "Left column content — replace with your own copy. This layout works well for content paired with a supporting image."),
          photo(1000, 80, 760, 500),
        ],
      },
      {
        height: 800,
        components: [
          heading(16, 32, 343, 60, "Page Title", { fontSize: 26 }),
          body(16, 100, 343, 90, "Replace with your own copy.", { fontSize: 14 }),
          photo(16, 200, 343, 300),
        ],
      },
    ),
  },
  {
    id: "generic-form-centered", pageTypeId: "generic", name: "Form Centered",
    config: buildTemplateConfig(
      "New Page",
      {
        height: 700,
        components: [
          heading(660, 120, 600, 60, "Page Title", { textAlign: "center" }),
          body(660, 190, 600, 60, "Add supporting text here.", { textAlign: "center" }),
          photo(760, 280, 400, 280, { bgColor: "#f1f5f9" }),
          button(810, 590, 300, 52, "Continue", linkTo("homepage"), { borderRadius: 8 }),
        ],
      },
      {
        height: 640,
        components: [
          heading(16, 40, 343, 50, "Page Title", { fontSize: 24, textAlign: "center" }),
          body(16, 100, 343, 50, "Add supporting text here.", { fontSize: 14, textAlign: "center" }),
          photo(48, 170, 279, 240, { bgColor: "#f1f5f9" }),
          button(48, 440, 279, 48, "Continue", linkTo("homepage"), { borderRadius: 8 }),
        ],
      },
    ),
  },
];
