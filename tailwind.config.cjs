const { resolveProjectPath } = require('wasp/dev');
const tailwindCssAnimate = require('tailwindcss-animate');
const defaultTheme = require('tailwindcss/defaultTheme');

const fonts = ['inter', 'manrope', 'system'];

// Use destructuring with fallback to ensure fontFamily is defined
const { fontFamily = { sans: ['sans-serif'] } } = defaultTheme || {};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [resolveProjectPath('./src/**/*.{js,jsx,ts,tsx}')],
  safelist: fonts.map((font) => `font-${font}`),
  theme: {
    container: {
      center: 'true',
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      spacing: {
        0.5: '0.125rem', // 2px
        1: '0.25rem', // 4px
        1.5: '0.375rem', // 6px
        2: '0.5rem', // 8px
        2.5: '0.625rem', // 10px
        3: '0.75rem', // 12px
        3.5: '0.875rem', // 14px
        4: '1rem', // 16px (instead of 1.25rem)
        5: '1.25rem', // 20px
        6: '1.5rem', // 24px (instead of 1.75rem)
      },
      fontFamily: {
        inter: ['Inter', ...fontFamily.sans],
        manrope: ['Manrope', ...fontFamily.sans],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Nalanda Scholar Brand Colors
        nalanda: {
          terracotta: 'hsl(19 85% 38%)', // Ancient brick architecture
          saffron: 'hsl(30 100% 60%)', // Buddhist robes
          indigo: 'hsl(234 66% 30%)', // Wisdom and depth
          gold: 'hsl(46 64% 52%)', // Manuscript illumination
          palmleaf: 'hsl(30 42% 96%)', // Ancient manuscripts
          ink: 'hsl(16 25% 20%)', // Traditional ink
        },
        // Emerald Champions Brand Colors (previous theme)
        emerald: {
          primary: 'hsl(160 84% 39%)', // Emerald Green
          gold: 'hsl(43 96% 56%)', // Rich Gold
          ocean: 'hsl(199 89% 48%)', // Ocean Blue
          teal: 'hsl(173 80% 40%)', // Teal
          forest: 'hsl(142 76% 36%)', // Forest Green
        },
        // Legacy Competitor's Edge Colors (kept for reference)
        competitor: {
          charcoal: 'hsl(210 11% 15%)', // Dark Charcoal
          grey: 'hsl(210 8% 60%)', // Medium Grey
          red: 'hsl(0 84% 50%)', // Energetic Red
          gold: 'hsl(45 93% 55%)', // Gold/Yellow
          white: 'hsl(0 0% 98%)', // Off-White
        },
      },
    },
  },
  plugins: [tailwindCssAnimate],
};
