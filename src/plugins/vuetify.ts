import { createVuetify } from "vuetify";

export const vuetify = createVuetify({
  theme: {
    defaultTheme: "materioLight",
    themes: {
      materioLight: {
        dark: false,
        colors: {
          background: "#FAFAFA",
          surface: "#FFFFFF",
          primary: "#7C3AED",
          "primary-hover": "#6D28D9",
          "primary-light": "#EDE9FE",
          secondary: "#6B7280",
          success: "#10B981",
          info: "#3B82F6",
          warning: "#F59E0B",
          error: "#EF4444",
          "on-background": "#111827",
          "on-surface": "#111827",
        },
        variables: {
          "border-color": "#E5E7EB",
          "border-opacity": 0.8,
          "high-emphasis-opacity": 0.9,
          "medium-emphasis-opacity": 0.6,
        },
      },
      materioDark: {
        dark: true,
        colors: {
          background: "#090D16",
          surface: "#111827",
          primary: "#8B5CF6",
          "primary-hover": "#7C3AED",
          "primary-light": "#1F1934",
          secondary: "#9CA3AF",
          success: "#10B981",
          info: "#3B82F6",
          warning: "#F59E0B",
          error: "#EF4444",
          "on-background": "#F9FAFB",
          "on-surface": "#F9FAFB",
        },
        variables: {
          "border-color": "#1F2937",
          "border-opacity": 0.8,
          "high-emphasis-opacity": 0.9,
          "medium-emphasis-opacity": 0.65,
        },
      },
    },
  },
  defaults: {
    VCard: { elevation: 0, rounded: "lg" },
    VBtn: { rounded: "lg", variant: "flat" },
    VTextField: {
      variant: "outlined",
      density: "comfortable",
      color: "primary",
    },
    VSelect: { variant: "outlined", density: "comfortable", color: "primary" },
    VTextarea: {
      variant: "outlined",
      density: "comfortable",
      color: "primary",
    },
  },
});
