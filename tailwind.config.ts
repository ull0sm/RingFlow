import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-secondary-fixed-variant": "#003ea8",
        "surface-dim": "#d8dadc",
        "inverse-surface": "#2d3133",
        "on-error": "#ffffff",
        "primary-fixed": "#dae2fd",
        "on-error-container": "#93000a",
        "surface-variant": "#e0e3e5",
        "tertiary-container": "#271901",
        "on-secondary-container": "#fefcff",
        "secondary-fixed": "#dbe1ff",
        "secondary-container": "#316bf3",
        "error-container": "#ffdad6",
        "primary": "#000000",
        "surface-container-low": "#f2f4f6",
        "on-secondary": "#ffffff",
        "primary-fixed-dim": "#bec6e0",
        "surface-bright": "#f7f9fb",
        "on-tertiary-fixed-variant": "#574425",
        "on-primary-container": "#7c839b",
        "tertiary-fixed-dim": "#dec29a",
        "on-tertiary": "#ffffff",
        "on-surface-variant": "#45464d",
        "surface": "#f7f9fb",
        "tertiary": "#000000",
        "tertiary-fixed": "#fcdeb5",
        "on-tertiary-container": "#98805d",
        "surface-container": "#eceef0",
        "inverse-on-surface": "#eff1f3",
        "outline-variant": "#c6c6cd",
        "surface-container-highest": "#e0e3e5",
        "on-primary": "#ffffff",
        "outline": "#76777d",
        "secondary-fixed-dim": "#b4c5ff",
        "on-surface": "#191c1e",
        "secondary": "#0051d5",
        "on-primary-fixed-variant": "#3f465c",
        "on-primary-fixed": "#131b2e",
        "on-background": "#191c1e",
        "on-secondary-fixed": "#00174b",
        "surface-container-high": "#e6e8ea",
        "inverse-primary": "#bec6e0",
        "primary-container": "#131b2e",
        "error": "#ba1a1a",
        "background": "#f7f9fb",
        "surface-container-lowest": "#ffffff",
        "surface-tint": "#565e74",
        "on-tertiary-fixed": "#271901"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "unit": "4px",
        "margin-desktop": "32px",
        "gutter": "16px",
        "margin-mobile": "16px",
        "card-padding": "20px"
      },
      fontFamily: {
        "headline-sm": ["Inter", "sans-serif"],
        "headline-lg": ["Inter", "sans-serif"],
        "label-caps": ["Inter", "sans-serif"],
        "display-lg": ["Inter", "sans-serif"],
        "data-mono": ["JetBrains Mono", "monospace"],
        "body-md": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"]
      },
      fontSize: {
        "headline-sm": ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        "headline-lg": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "label-caps": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "700" }],
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "data-mono": ["14px", { lineHeight: "1.2", fontWeight: "500" }],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.4", fontWeight: "400" }]
      }
    },
  },
  plugins: [],
};
export default config;
