import { PageTemplate, buildTemplateConfig, heading, body, button, photo, linkTo } from "./helpers";

export const loginTemplates: PageTemplate[] = [
  {
    id: "login-centered-card", pageTypeId: "login", name: "Centered Card",
    config: buildTemplateConfig(
      "Login",
      {
        height: 700,
        components: [
          heading(760, 140, 400, 50, "Welcome Back", { textAlign: "center" }),
          body(760, 200, 400, 30, "Log in to your account", { textAlign: "center", fontColor: "#64748b" }),
          photo(760, 260, 400, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(760, 326, 400, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(760, 400, 400, 56, "Log In", { type: "custom", value: "" }),
          button(760, 470, 400, 40, "Forgot your password?", linkTo("forgot-password"), { buttonStyle: "link", fontColor: "#2563eb" }),
          button(760, 520, 400, 40, "Don't have an account? Register", linkTo("register"), { buttonStyle: "link", fontColor: "#2563eb" }),
        ],
      },
      {
        height: 700,
        components: [
          heading(16, 100, 343, 44, "Welcome Back", { fontSize: 22, textAlign: "center" }),
          body(16, 150, 343, 26, "Log in to your account", { textAlign: "center", fontColor: "#64748b" }),
          photo(16, 200, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(16, 260, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(16, 330, 343, 52, "Log In", { type: "custom", value: "" }),
          button(16, 396, 343, 36, "Forgot password?", linkTo("forgot-password"), { buttonStyle: "link", fontColor: "#2563eb" }),
          button(16, 434, 343, 36, "Register", linkTo("register"), { buttonStyle: "link", fontColor: "#2563eb" }),
        ],
      },
    ),
  },
  {
    id: "login-split-image", pageTypeId: "login", name: "Split with Image",
    config: buildTemplateConfig(
      "Login",
      {
        height: 800,
        components: [
          photo(0, 0, 960, 800, { borderRadius: 0 }),
          heading(1060, 220, 700, 50, "Sign In", { fontSize: 34 }),
          photo(1060, 300, 700, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(1060, 366, 700, 56, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(1060, 440, 700, 56, "Log In", { type: "custom", value: "" }),
          button(1060, 510, 300, 36, "Create an account", linkTo("register"), { buttonStyle: "link", fontColor: "#2563eb" }),
        ],
      },
      {
        height: 700,
        components: [
          photo(0, 0, 375, 220, { borderRadius: 0 }),
          heading(16, 244, 343, 44, "Sign In", { fontSize: 22 }),
          photo(16, 296, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          photo(16, 356, 343, 50, { bgColor: "#f8fafc", borderRadius: 6 }),
          button(16, 420, 343, 52, "Log In", { type: "custom", value: "" }),
          button(16, 480, 343, 36, "Create an account", linkTo("register"), { buttonStyle: "link", fontColor: "#2563eb" }),
        ],
      },
    ),
  },
  {
    id: "login-minimal", pageTypeId: "login", name: "Minimal",
    config: buildTemplateConfig(
      "Login",
      {
        height: 600,
        components: [
          heading(660, 160, 600, 50, "Log In", { textAlign: "center", fontSize: 36 }),
          photo(760, 240, 400, 56, { bgColor: "#f8fafc", borderRadius: 999 }),
          photo(760, 306, 400, 56, { bgColor: "#f8fafc", borderRadius: 999 }),
          button(760, 380, 400, 56, "Continue", { type: "custom", value: "" }, { borderRadius: 999 }),
        ],
      },
      {
        height: 560,
        components: [
          heading(16, 120, 343, 44, "Log In", { textAlign: "center", fontSize: 26 }),
          photo(16, 190, 343, 50, { bgColor: "#f8fafc", borderRadius: 999 }),
          photo(16, 250, 343, 50, { bgColor: "#f8fafc", borderRadius: 999 }),
          button(16, 320, 343, 52, "Continue", { type: "custom", value: "" }, { borderRadius: 999 }),
        ],
      },
    ),
  },
];
