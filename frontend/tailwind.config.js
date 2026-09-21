/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            screens: {
                xs: '475px',
            },
            colors: {
                // Brand primary: warm orange — single source of truth via CSS variables
                primary: {
                    50:  'var(--primary-50,  #fff7ed)',
                    100: 'var(--primary-100, #ffedd5)',
                    200: 'var(--primary-200, #fed7aa)',
                    300: 'var(--primary-300, #fdba74)',
                    400: 'var(--primary-400, #fb923c)',
                    500: 'var(--primary-500, #f97316)',
                    600: 'var(--primary-600, #ea580c)',
                    700: 'var(--primary-700, #c2410c)',
                    800: 'var(--primary-800, #9a3412)',
                    900: 'var(--primary-900, #7c2d12)',
                },
                // Brand accent: emerald — matches card/seat/stats panels across admin
                accent: {
                    50:  '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                },
            },
            backgroundImage: {
                'gradient-primary':   'linear-gradient(135deg, var(--primary-500, #f97316) 0%, var(--primary-600, #ea580c) 100%)',
                'gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'gradient-success':   'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'gradient-dark':      'linear-gradient(135deg, #1a0f00 0%, #0f0a00 100%)',
            },
            animation: {
                'fade-in':  'fadeIn 0.3s ease-in',
                'slide-up': 'slideUp 0.4s ease-out',
                'shimmer':  'shimmer 2s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%':   { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%':   { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                shimmer: {
                    '0%':   { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
            },
        },
    },
    plugins: [],
}
