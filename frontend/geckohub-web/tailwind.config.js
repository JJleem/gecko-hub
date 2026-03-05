/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "rgb(from var(--border) r g b)",
        input: "rgb(from var(--input) r g b)",
        ring: "rgb(from var(--ring) r g b)",
        background: "rgb(from var(--background) r g b)",
        foreground: "rgb(from var(--foreground) r g b)",
        primary: {
          DEFAULT: "rgb(from var(--primary) r g b)",
          foreground: "rgb(from var(--primary-foreground) r g b)",
        },
        secondary: {
          DEFAULT: "rgb(from var(--secondary) r g b)",
          foreground: "rgb(from var(--secondary-foreground) r g b)",
        },
        muted: {
          DEFAULT: "rgb(from var(--muted) r g b)",
          foreground: "rgb(from var(--muted-foreground) r g b)",
        },
        accent: {
          DEFAULT: "rgb(from var(--accent) r g b)",
          foreground: "rgb(from var(--accent-foreground) r g b)",
        },
        destructive: {
          DEFAULT: "rgb(from var(--destructive) r g b)",
        },
        card: {
          DEFAULT: "rgb(from var(--card) r g b)",
          foreground: "rgb(from var(--card-foreground) r g b)",
        },
        popover: {
          DEFAULT: "rgb(from var(--popover) r g b)",
          foreground: "rgb(from var(--popover-foreground) r g b)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss/plugin")(function ({ addBase, addComponents, addUtilities }) {
    addBase({
      html: {
        // Apply global styles here if needed
      },
    });
  })],
};