import { PageTemplate, buildTemplateConfig, heading, body, button, photo, linkTo } from "./helpers";

export const registerTemplates: PageTemplate[] = [
  {
    id: "register-centered-card", pageTypeId: "register", name: "Centered Card",
    config: buildTemplateConfig(
      "Register",
      {
        height: 760,
        components: [
          heading(760, 100, 400, 50, "Create Account", { textAlign: "center", fontSize: 30 }),
          body(760, 160, 400, 30, "Join us in seconds", { textAlign: "center", fontColor: "#64748b" }),
          photo(760, 220, 400, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(760, 286, 400, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(760, 352, 400, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(760, 420, 400, 56, "Create Account", { type: "custom", value: "" }),
          button(760, 490, 400, 40, "Already have an account? Log In", linkTo("login"), { buttonStyle: "link", fontColor: "#2563eb" }),
        ],
      },
      {
        height: 760,
        components: [
          heading(16, 80, 343, 44, "Create Account", { fontSize: 22, textAlign: "center" }),
          body(16, 130, 343, 26, "Join us in seconds", { textAlign: "center", fontColor: "#64748b" }),
          photo(16, 180, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(16, 240, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(16, 300, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(16, 366, 343, 52, "Create Account", { type: "custom", value: "" }),
          button(16, 430, 343, 36, "Already have an account? Log In", linkTo("login"), { buttonStyle: "link", fontColor: "#2563eb" }),
        ],
      },
    ),
  },
  {
    id: "register-split-image", pageTypeId: "register", name: "Split with Image",
    config: buildTemplateConfig(
      "Register",
      {
        height: 820,
        components: [
          photo(960, 0, 960, 820, { borderRadius: 0 }),
          heading(160, 200, 700, 50, "Join Us", { fontSize: 34 }),
          photo(160, 280, 700, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(160, 346, 700, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(160, 412, 700, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(160, 490, 700, 56, "Create Account", { type: "custom", value: "" }),
          button(160, 560, 300, 36, "Log in instead", linkTo("login"), { buttonStyle: "link", fontColor: "#2563eb" }),
        ],
      },
      {
        height: 720,
        components: [
          photo(0, 0, 375, 220, { borderRadius: 0 }),
          heading(16, 244, 343, 44, "Join Us", { fontSize: 22 }),
          photo(16, 296, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(16, 356, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(16, 420, 343, 52, "Create Account", { type: "custom", value: "" }),
          button(16, 480, 343, 36, "Log in instead", linkTo("login"), { buttonStyle: "link", fontColor: "#2563eb" }),
        ],
      },
    ),
  },
  {
    id: "register-benefits", pageTypeId: "register", name: "With Benefits List",
    config: buildTemplateConfig(
      "Register",
      {
        height: 800,
        components: [
          heading(160, 140, 600, 60, "Create your account", { fontSize: 32 }),
          body(160, 220, 500, 140, "✓ Free shipping on every order\n✓ Early access to sales\n✓ Track orders in real time", { lineHeight: 2 }),
          photo(1000, 140, 760, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(1000, 206, 760, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(1000, 272, 760, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(1000, 340, 760, 56, "Create Account", { type: "custom", value: "" }),
          button(1000, 410, 300, 36, "Log in instead", linkTo("login"), { buttonStyle: "link", fontColor: "#2563eb" }),
        ],
      },
      {
        height: 900,
        components: [
          heading(16, 24, 343, 60, "Create your account", { fontSize: 22 }),
          body(16, 90, 343, 100, "✓ Free shipping\n✓ Early access to sales\n✓ Track orders in real time", { lineHeight: 1.8 }),
          photo(16, 200, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(16, 260, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(16, 330, 343, 52, "Create Account", { type: "custom", value: "" }),
        ],
      },
    ),
  },
];
