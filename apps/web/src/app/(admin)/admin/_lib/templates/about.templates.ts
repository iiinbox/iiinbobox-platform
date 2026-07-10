import { PageTemplate, DESKTOP_W, buildTemplateConfig, heading, subheading, body, button, photo, linkTo } from "./helpers";

export const aboutTemplates: PageTemplate[] = [
  {
    id: "about-story-hero", pageTypeId: "about", name: "Our Story Hero",
    config: buildTemplateConfig(
      "About",
      {
        height: 1000,
        components: [
          photo(0, 0, DESKTOP_W, 500, { borderRadius: 0 }),
          heading(660, 560, 600, 60, "Our Story", { textAlign: "center" }),
          body(460, 640, 1000, 100, "We started with a simple idea: make quality products accessible to everyone. Today we're proud to serve thousands of happy customers.", { textAlign: "center" }),
          button(810, 760, 300, 52, "Shop Now", linkTo("homepage")),
        ],
      },
      {
        height: 800,
        components: [
          photo(0, 0, 375, 260, { borderRadius: 0 }),
          heading(16, 284, 343, 50, "Our Story", { fontSize: 24, textAlign: "center" }),
          body(16, 344, 343, 100, "We started with a simple idea: make quality products accessible to everyone.", { textAlign: "center" }),
          button(48, 460, 279, 52, "Shop Now", linkTo("homepage")),
        ],
      },
    ),
  },
  {
    id: "about-team-grid", pageTypeId: "about", name: "Meet the Team",
    config: buildTemplateConfig(
      "About",
      {
        height: 900,
        components: [
          heading(160, 60, 700, 60, "Meet the Team"),
          body(160, 140, 700, 40, "The people behind the mission."),
          photo(160, 220, 380, 380, { borderRadius: 999 }),
          subheading(160, 610, 380, 30, "Jane Doe", { textAlign: "center" }),
          photo(660, 220, 380, 380, { borderRadius: 999 }),
          subheading(660, 610, 380, 30, "John Smith", { textAlign: "center" }),
          photo(1160, 220, 380, 380, { borderRadius: 999 }),
          subheading(1160, 610, 380, 30, "Alex Lee", { textAlign: "center" }),
          button(160, 700, 220, 52, "Meet the Full Team", linkTo("team")),
        ],
      },
      {
        height: 700,
        components: [
          heading(16, 24, 343, 40, "Meet the Team", { fontSize: 22 }),
          photo(16, 80, 160, 160, { borderRadius: 999 }),
          subheading(16, 246, 160, 24, "Jane Doe", { fontSize: 14, textAlign: "center" }),
          photo(199, 80, 160, 160, { borderRadius: 999 }),
          subheading(199, 246, 160, 24, "John Smith", { fontSize: 14, textAlign: "center" }),
          button(16, 320, 343, 48, "Meet the Full Team", linkTo("team")),
        ],
      },
    ),
  },
  {
    id: "about-mission-values", pageTypeId: "about", name: "Mission & Values",
    config: buildTemplateConfig(
      "About",
      {
        height: 800,
        components: [
          heading(660, 60, 600, 60, "Our Mission", { textAlign: "center" }),
          body(560, 140, 800, 60, "To deliver quality and value to every customer, every time.", { textAlign: "center", fontSize: 20 }),
          photo(160, 260, 500, 340, { bgColor: "#f8fafc", borderRadius: 12 }),
          subheading(180, 320, 400, 30, "Quality First"),
          photo(710, 260, 500, 340, { bgColor: "#f8fafc", borderRadius: 12 }),
          subheading(730, 320, 400, 30, "Customer Obsessed"),
          photo(1260, 260, 500, 340, { bgColor: "#f8fafc", borderRadius: 12 }),
          subheading(1280, 320, 400, 30, "Built to Last"),
        ],
      },
      {
        height: 900,
        components: [
          heading(16, 24, 343, 44, "Our Mission", { fontSize: 22, textAlign: "center" }),
          body(16, 80, 343, 60, "To deliver quality and value, every time.", { textAlign: "center" }),
          photo(16, 160, 343, 200, { bgColor: "#f8fafc", borderRadius: 12 }),
          subheading(32, 220, 300, 26, "Quality First"),
          photo(16, 380, 343, 200, { bgColor: "#f8fafc", borderRadius: 12 }),
          subheading(32, 440, 300, 26, "Customer Obsessed"),
        ],
      },
    ),
  },
];
