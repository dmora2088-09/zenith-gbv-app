/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
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
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
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
        // Zenith GBV: Paleta Institucional
        navy: {
          50:  '#f0f3f7',
          100: '#d9e0ea',
          200: '#b3c1d5',
          300: '#8da2c0',
          400: '#6783ab',
          500: '#416496',
          600: '#345478',
          700: '#27455a',
          800: '#1a354c',
          900: '#0f2b4c',
          950: '#0a1e35',
        },
        steel: {
          50:  '#f4f7fa',
          100: '#e2eaf3',
          200: '#c5d5e7',
          300: '#9fb9d4',
          400: '#3b7dd8',
          500: '#2e6bc0',
          600: '#2459a3',
          700: '#1b4785',
          800: '#133667',
          900: '#0c2449',
        },
        pearl: '#f5f6f8',
        charcoal: '#1a2332',
        success: {
          DEFAULT: '#1B8A4F',
          light: '#e8f5ee',
          dark: '#156b3d',
        },
        warning: {
          DEFAULT: '#D4930D',
          light: '#fdf5e4',
          dark: '#a3720a',
        },
        danger: {
          DEFAULT: '#C0392B',
          light: '#fbe8e6',
          dark: '#992d22',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1.4' }],
        '3xl': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        '4xl': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
        '2xl': '0.75rem',
        '3xl': '1rem',
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.08), 0 4px 10px -6px rgb(0 0 0 / 0.02)',
        'sidebar': '4px 0 24px -4px rgb(15 43 76 / 0.08)',
        'dropdown': '0 10px 38px -10px rgb(15 43 76 / 0.15)',
        'toast': '0 8px 30px rgb(0 0 0 / 0.12)',
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
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}