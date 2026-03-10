import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#FAFAFA',
        'bg-secondary': '#F0F0F0',
        'bg-terminal': '#0A0A0A',
        'text-primary': '#0A0A0A',
        'text-secondary': '#6B6B6B',
        'green': '#00FF66',
        'green-dim': '#00CC52',
        'green-muted': 'rgba(0, 255, 102, 0.13)',
        'red': '#FF3B3B',
        'border-light': '#E0E0E0',
        'border-dark': '#2A2A2A',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.4)', opacity: '0.7' },
        },
        drift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        },
      },
      animation: {
        blink: 'blink 1.06s step-end infinite',
        'pulse-dot': 'pulse 2s ease-in-out infinite',
        drift: 'drift 120s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
