tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "background": "#09090b", // zinc-950
                "surface": "#18181b", // zinc-900
                "surface-container-low": "#27272a", // zinc-800
                "surface-container-lowest": "#18181b", 
                "surface-container-high": "#3f3f46", // zinc-700
                "on-surface": "#fafafa", // zinc-50
                "on-surface-variant": "#a1a1aa", // zinc-400
                "outline-variant": "#3f3f46", 
                "primary": "#6366f1", // indigo-500
                "primary-container": "#4338ca", // indigo-700
                "on-primary": "#ffffff",
                "on-primary-container": "#e0e7ff",
                "secondary": "#10b981", // emerald-500
                "secondary-container": "#047857", // emerald-700
                "on-secondary-container": "#d1fae5",
                "tertiary": "#f43f5e", // rose-500
                "tertiary-fixed": "#e11d48", // rose-600
                "on-tertiary-fixed": "#ffe4e6",
                "tertiary-container": "#be123c",
                "error": "#ef4444",
                "error-container": "#b91c1c",
                "on-error-container": "#fee2e2"
            },
            fontFamily: {
                "headline": ["Outfit", "sans-serif"],
                "body": ["Inter", "sans-serif"],
                "label": ["Inter", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.375rem", 
                "md": "0.5rem",
                "lg": "0.75rem", 
                "xl": "1rem", 
                "2xl": "1.5rem",
                "3xl": "2rem",
                "full": "9999px"
            },
            boxShadow: {
                'glow': '0 0 20px -5px rgba(99, 102, 241, 0.4)',
                'glow-secondary': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
                'glow-tertiary': '0 0 20px -5px rgba(244, 63, 94, 0.4)',
                'soft': '0 10px 40px -10px rgba(0,0,0,0.5)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
}
