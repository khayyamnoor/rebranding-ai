import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          dim: '#8A6B2E',
          light: '#E8D5A3',
        },
        bg: '#FDFAF5',
        surface: '#F5F0E8',
        ink: '#1A1714',
        muted: '#6B6560',
        success: '#2D7A4F',
      },
      borderColor: {
        goldline: 'rgba(201, 168, 76, 0.25)',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
