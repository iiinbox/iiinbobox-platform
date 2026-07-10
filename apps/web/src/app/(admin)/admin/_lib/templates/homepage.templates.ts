import { PageTemplate, DESKTOP_W, MOBILE_W, buildTemplateConfig, heading, subheading, body, button, photo, heroCarousel, categoryCarousel, linkTo } from "./helpers";

const heroSlidesDesktop = [
  { headline: "New Season Arrivals", subtext: "Fresh styles just landed — shop the collection.", buttonLabel: "Shop Now", buttonLink: "/product-listing" },
  { headline: "Up to 50% Off", subtext: "This week only — while stocks last.", buttonLabel: "View Deals", buttonLink: "/product-listing" },
];

const categories = [
  { name: "New Arrivals", descriptor: "Just landed" },
  { name: "Best Sellers", descriptor: "Customer favorites" },
  { name: "Sale", descriptor: "Up to 50% off" },
  { name: "Accessories", descriptor: "Complete the look" },
];

export const homepageTemplates: PageTemplate[] = [
  {
    id: "homepage-hero-banner", pageTypeId: "homepage", name: "Hero Banner + Categories",
    config: buildTemplateConfig(
      "Homepage",
      {
        height: 1100,
        components: [
          heroCarousel(0, 0, DESKTOP_W, 640, heroSlidesDesktop),
          categoryCarousel(160, 700, 1600, 340, "Shop by Category", categories),
        ],
      },
      {
        height: 900,
        components: [
          heroCarousel(0, 0, MOBILE_W, 420, heroSlidesDesktop),
          categoryCarousel(16, 460, 343, 380, "Shop by Category", categories),
        ],
      },
    ),
  },
  {
    id: "homepage-grid-showcase", pageTypeId: "homepage", name: "Feature Grid Showcase",
    config: buildTemplateConfig(
      "Homepage",
      {
        height: 980,
        components: [
          heading(160, 80, 1000, 70, "Everything you need, in one place"),
          subheading(160, 160, 900, 40, "Curated collections, fast shipping, easy returns.", { fontColor: "#64748b", fontWeight: 400 }),
          button(160, 220, 200, 52, "Shop Now", linkTo("product-listing")),
          photo(160, 340, 520, 420),
          photo(700, 340, 520, 420),
          photo(1240, 340, 520, 420),
          heading(160, 800, 700, 40, "Free shipping on orders over $50", { fontSize: 22 }),
        ],
      },
      {
        height: 1400,
        components: [
          heading(16, 32, 343, 60, "Everything you need, in one place", { fontSize: 26 }),
          subheading(16, 100, 343, 50, "Curated collections, fast shipping.", { fontSize: 15, fontColor: "#64748b", fontWeight: 400 }),
          button(16, 160, 160, 44, "Shop Now", linkTo("product-listing")),
          photo(16, 230, 343, 300),
          photo(16, 550, 343, 300),
          photo(16, 870, 343, 300),
          heading(16, 1190, 343, 60, "Free shipping over $50", { fontSize: 18 }),
        ],
      },
    ),
  },
  {
    id: "homepage-minimal-split", pageTypeId: "homepage", name: "Minimal Split Hero",
    config: buildTemplateConfig(
      "Homepage",
      {
        height: 800,
        components: [
          heading(160, 260, 700, 120, "Quality goods,\ndelivered fast", { fontSize: 52 }),
          body(160, 400, 620, 80, "Handpicked products from trusted vendors, shipped to your door in days.", { fontSize: 18 }),
          button(160, 500, 220, 56, "Browse Products", linkTo("product-listing"), { borderRadius: 999 }),
          photo(1000, 0, 920, 800, { borderRadius: 0 }),
        ],
      },
      {
        height: 760,
        components: [
          photo(0, 0, MOBILE_W, 320, { borderRadius: 0 }),
          heading(16, 344, 343, 90, "Quality goods, delivered fast", { fontSize: 26 }),
          body(16, 440, 343, 80, "Handpicked products, shipped fast.", { fontSize: 14 }),
          button(16, 540, 180, 48, "Browse Products", linkTo("product-listing"), { borderRadius: 999 }),
        ],
      },
    ),
  },
];
