import { PageTemplate, buildTemplateConfig, heading, subheading, body, label, button, photo, linkTo } from "./helpers";

function postCard(x: number, y: number, w: number) {
  return [
    photo(x, y, w, w * 0.6),
    label(x, y + w * 0.6 + 16, w, 18, "GUIDES"),
    subheading(x, y + w * 0.6 + 40, w, 30, "Blog Post Title Goes Here", { fontSize: 18 }),
    button(x, y + w * 0.6 + 78, 120, 32, "Read More", linkTo("blog-post"), { buttonStyle: "link", fontColor: "#2563eb", fontSize: 13 }),
  ];
}

function mobilePostCard(x: number, y: number, w: number) {
  return [
    photo(x, y, w, w * 0.6),
    subheading(x, y + w * 0.6 + 12, w, 26, "Blog Post Title", { fontSize: 14 }),
    button(x, y + w * 0.6 + 44, 100, 28, "Read More", linkTo("blog-post"), { buttonStyle: "link", fontColor: "#2563eb", fontSize: 12 }),
  ];
}

export const blogListingTemplates: PageTemplate[] = [
  {
    id: "blog-listing-grid", pageTypeId: "blog-listing", name: "3-Up Grid",
    config: buildTemplateConfig(
      "Blog",
      {
        height: 800,
        components: [
          heading(160, 60, 700, 60, "From the Blog"),
          ...postCard(160, 160, 500),
          ...postCard(710, 160, 500),
          ...postCard(1260, 160, 500),
        ],
      },
      {
        height: 1300,
        components: [
          heading(16, 24, 343, 40, "From the Blog", { fontSize: 24 }),
          ...mobilePostCard(16, 80, 343),
          ...mobilePostCard(16, 380, 343),
          ...mobilePostCard(16, 680, 343),
        ],
      },
    ),
  },
  {
    id: "blog-listing-featured", pageTypeId: "blog-listing", name: "Featured + List",
    config: buildTemplateConfig(
      "Blog",
      {
        height: 900,
        components: [
          photo(160, 60, 1000, 500, { borderRadius: 12 }),
          label(1220, 90, 300, 18, "FEATURED"),
          heading(1220, 120, 540, 100, "The Big Featured Post Title", { fontSize: 28 }),
          body(1220, 240, 540, 80, "A short excerpt introducing the featured article."),
          button(1220, 340, 160, 44, "Read More", linkTo("blog-post"), { buttonStyle: "outline", bgColor: "#111827", fontColor: "#111827", borderColor: "#111827" }),
          ...postCard(160, 620, 500),
          ...postCard(710, 620, 500),
          ...postCard(1260, 620, 500),
        ],
      },
      {
        height: 1500,
        components: [
          photo(16, 24, 343, 200, { borderRadius: 12 }),
          heading(16, 240, 343, 60, "The Big Featured Post", { fontSize: 20 }),
          body(16, 300, 343, 60, "A short excerpt introducing it."),
          ...mobilePostCard(16, 400, 343),
          ...mobilePostCard(16, 700, 343),
        ],
      },
    ),
  },
  {
    id: "blog-listing-sidebar-cats", pageTypeId: "blog-listing", name: "With Category Sidebar",
    config: buildTemplateConfig(
      "Blog",
      {
        height: 900,
        components: [
          heading(160, 60, 700, 60, "Blog"),
          label(160, 160, 200, 20, "CATEGORIES"),
          body(160, 200, 240, 160, "Guides\nNews\nTutorials\nCase Studies", { lineHeight: 2 }),
          ...postCard(460, 160, 340),
          ...postCard(830, 160, 340),
          ...postCard(1200, 160, 340),
        ],
      },
      {
        height: 1300,
        components: [
          heading(16, 24, 343, 40, "Blog", { fontSize: 24 }),
          ...mobilePostCard(16, 90, 343),
          ...mobilePostCard(16, 390, 343),
          ...mobilePostCard(16, 690, 343),
        ],
      },
    ),
  },
];
