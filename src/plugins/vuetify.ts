import { createVuetify } from "vuetify";

export const vuetify = createVuetify({
  theme: {
    defaultTheme: "materioLight",
    themes: {
      materioLight: {
        dark: false,
        colors: {
          background: "#F4F5FA",
          surface: "#FFFFFF",
          primary: "#9155FD",
          secondary: "#8A8D93",
          success: "#56CA00",
          info: "#16B1FF",
          warning: "#FFB400",
          error: "#FF4C51",
          "on-background": "#3A3541",
          "on-surface": "#3A3541",
        },
        variables: {
          "border-color": "#3A3541",
          "border-opacity": 0.12,
          "high-emphasis-opacity": 0.87,
          "medium-emphasis-opacity": 0.68,
        },
      },
      materioDark: {
        dark: true,
        colors: {
          background: "#28243D",
          surface: "#312D4B",
          primary: "#9155FD",
          secondary: "#8A8D93",
          success: "#56CA00",
          info: "#16B1FF",
          warning: "#FFB400",
          error: "#FF4C51",
          "on-background": "#E7E3FC",
          "on-surface": "#E7E3FC",
        },
        variables: {
          "border-color": "#E7E3FC",
          "border-opacity": 0.12,
          "high-emphasis-opacity": 0.87,
          "medium-emphasis-opacity": 0.68,
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
