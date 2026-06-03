import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Wadi palette (flat — no gradients).
        canvas: '#ECE3D2',
        'canvas-alt': '#F2ECDD',
        card: '#FAF6EC',
        surface: '#F4EEE0',
        ink: '#241C12',
        soft: '#4E4536',
        muted: '#8A7E68',
        line: '#D8CCB2',
        green: { DEFAULT: '#155446', hover: '#0F4639' },
        terracotta: { DEFAULT: '#BB4A2C', deep: '#8F3A24' },
        'tint-green': '#DCE7E0',
        'tint-terra': '#F6E3DB',
        // `success` (upload check) maps to the Wadi action green.
        success: '#155446',
      },
      borderColor: {
        // legacy alias kept so existing `*-goldline` classes resolve.
        goldline: '#D8CCB2',
        line: '#D8CCB2',
      },
      borderRadius: {
        wadi: '14px',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"Spline Sans Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
