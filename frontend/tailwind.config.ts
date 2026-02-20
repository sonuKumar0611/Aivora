import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* Semantic (CSS variables for theming) */
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        /* Aivora brand palette (direct hex for gradients, borders, etc.) */
        brand: {
          primary: '#6366F1',
          primaryHover: '#5458E6',
          primaryLight: '#A5B4FC',
          accent: '#22D3EE',
          accentHover: '#06B6D4',
          accentLight: '#67E8F9',
          bg: '#0B0F19',
          bgCard: '#111827',
          bgCardHover: '#161F2F',
          sidebar: '#0F172A',
          border: '#1F2937',
          borderLight: '#2A3446',
          divider: '#1C2433',
          text: '#E5E7EB',
          textHeading: '#F9FAFB',
          textMuted: '#9CA3AF',
          textDisabled: '#4B5563',
          link: '#818CF8',
          linkHover: '#A5B4FC',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#38BDF8',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        'gradient-ai-glow': 'linear-gradient(135deg, #6366F1, #22D3EE)',
        'gradient-hero-glow': 'radial-gradient(circle at center, rgba(99,102,241,0.15), transparent 60%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(99, 102, 241, 0.25)',
        'glow-accent': '0 0 20px rgba(34, 211, 238, 0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
