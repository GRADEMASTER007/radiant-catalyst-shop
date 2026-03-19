import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Gut Health Custom Colors
        gut: {
          green: "hsl(var(--gut-green))",
          forest: "hsl(var(--gut-forest))",
          lime: "hsl(var(--gut-lime))",
          cream: "hsl(var(--gut-cream))",
          brown: "hsl(var(--gut-brown))",
          teal: "hsl(var(--gut-teal))",
          blue: "hsl(var(--gut-blue))",
          dark: "hsl(var(--gut-dark))",
          gold: "hsl(var(--gut-gold))",
          DEFAULT: "hsl(var(--gut-green))",
        },
        // Legacy compatibility mappings
        dragon: {
          pink: "hsl(var(--gut-green))",
          magenta: "hsl(var(--gut-forest))",
          green: "hsl(var(--gut-green))",
          lime: "hsl(var(--gut-lime))",
          white: "hsl(var(--gut-cream))",
          gold: "hsl(var(--gut-gold))",
          dark: "hsl(var(--gut-dark))",
          DEFAULT: "hsl(var(--gut-green))",
        },
        earth: {
          brown: "hsl(var(--gut-brown))",
          DEFAULT: "hsl(var(--gut-brown))",
        },
        sahara: {
          gold: "hsl(var(--gut-gold))",
          DEFAULT: "hsl(var(--gut-gold))",
        },
        savanna: {
          green: "hsl(var(--gut-green))",
          DEFAULT: "hsl(var(--gut-green))",
        },
        sunset: {
          orange: "hsl(var(--gut-gold))",
          DEFAULT: "hsl(var(--gut-gold))",
        },
        tribal: {
          red: "hsl(var(--gut-brown))",
          DEFAULT: "hsl(var(--gut-brown))",
        },
        sky: {
          blue: "hsl(var(--gut-teal))",
          DEFAULT: "hsl(var(--gut-teal))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
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
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        bubble: {
          "0%": { transform: "translateY(100%) scale(0.8)", opacity: "0" },
          "10%": { opacity: "0.6" },
          "90%": { opacity: "0.6" },
          "100%": { transform: "translateY(-100vh) scale(1.2)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-in-left": "slide-in-left 0.5s ease-out forwards",
        "slide-in-right": "slide-in-right 0.5s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        marquee: "marquee 30s linear infinite",
        "marquee-slow": "marquee 60s linear infinite",
        bubble: "bubble 8s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-probiotic": "var(--gradient-probiotic)",
        "gradient-earth": "var(--gradient-earth)",
        "gradient-fresh": "var(--gradient-fresh)",
        "gradient-hero": "var(--gradient-hero)",
        // Legacy compatibility
        "gradient-dragon": "var(--gradient-probiotic)",
        "gradient-sunset": "var(--gradient-earth)",
        "gradient-tropical": "var(--gradient-fresh)",
        "gradient-savanna": "var(--gradient-probiotic)",
        shimmer: "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.1) 50%, transparent 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
