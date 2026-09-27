/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FBF4E6', // Canvas
          200: '#F4E9D2',
          300: '#EADEBE',
        },
        ink: {
          DEFAULT: '#111111', // Navigation / strong text
          light: '#2A2A2A',
          muted: '#6B6861',
        },
        brand: {
          brown: '#88713C', // Brand brown
          dark: '#685429',
          light: '#B0975C',
        },
        category: {
          research: '#FF9AD5', // Evidence / RAG / Documents
          ops: '#F5D867',      // Operations / workflow
          geo: '#9BAB64',      // Geology / correlation / formation
          live: '#B7CBEB',     // Live technical / parameters
        },
        semantic: {
          green: '#2E7D32',
          'green-bg': '#E8F5E9',
          amber: '#ED6C02',
          'amber-bg': '#FFF4E5',
          red: '#D32F2F',
          'red-bg': '#FFEBEE',
        }
      },
      borderRadius: {
        'card': '20px',
        'control': '12px',
      },
      boxShadow: {
        'card': '0 8px 30px rgba(17,17,17,0.06)',
        'card-hover': '0 12px 36px rgba(17,17,17,0.09)',
        'drawer': '-6px 0 25px rgba(17,17,17,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
