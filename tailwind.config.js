/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Brand Colors
      colors: {
        primary: {
          DEFAULT: '#670FA4',
          light: '#8B3DB8',
          dark: '#4A0B78',
          muted: 'rgba(103, 15, 164, 0.1)',
        },
        secondary: {
          DEFAULT: '#F5C661',
          light: '#F7D48A',
          dark: '#D4A84A',
          muted: 'rgba(245, 198, 97, 0.2)',
        },
        background: '#F5F5F5',
        surface: '#FFFFFF',
        // Semantic colors
        success: {
          DEFAULT: '#4CAF50',
          light: '#E8F5E9',
        },
        warning: {
          DEFAULT: '#FF9800',
          light: '#FFF3E0',
        },
        error: {
          DEFAULT: '#F44336',
          light: '#FFEBEE',
        },
        info: {
          DEFAULT: '#2196F3',
          light: '#E3F2FD',
        },
      },
      // Font Families
      fontFamily: {
        // Poppins (EN/FR)
        thin: ['Poppins_100Thin'],
        extralight: ['Poppins_200ExtraLight'],
        light: ['Poppins_300Light'],
        regular: ['Poppins_400Regular'],
        medium: ['Poppins_500Medium'],
        semibold: ['Poppins_600SemiBold'],
        bold: ['Poppins_700Bold'],
        extrabold: ['Poppins_800ExtraBold'],
        black: ['Poppins_900Black'],
        // Cairo (Arabic)
        'arabic-light': ['Cairo_300Light'],
        'arabic-regular': ['Cairo_400Regular'],
        'arabic-medium': ['Cairo_500Medium'],
        'arabic-semibold': ['Cairo_600SemiBold'],
        'arabic-bold': ['Cairo_700Bold'],
      },
      // Border Radius
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      // Spacing
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        base: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '48px',
        '5xl': '64px',
      },
    },
  },
  plugins: [],
};
