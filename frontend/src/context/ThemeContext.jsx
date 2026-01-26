import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
    // Default to 'system' if no preference saved
    const [theme, setTheme] = useState(
        localStorage.getItem('theme') || 'system'
    );

    useEffect(() => {
        const root = document.documentElement;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            if (theme === 'dark') {
                root.classList.add('dark');
            } else if (theme === 'light') {
                root.classList.remove('dark');
            } else if (theme === 'system') {
                if (mediaQuery.matches) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        };

        applyTheme();

        const handleChange = () => {
            if (theme === 'system') {
                applyTheme();
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        localStorage.setItem('theme', theme);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => {
            if (prevTheme === 'system') return 'light';
            if (prevTheme === 'light') return 'dark';
            return 'system';
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
