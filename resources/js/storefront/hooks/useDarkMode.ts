import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'storefront-color-mode';

export function useDarkMode(): { isDark: boolean; toggle: () => void } {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window === 'undefined') return false;

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'dark') return true;
        if (saved === 'light') return false;

        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');

        function handleChange(e: MediaQueryListEvent) {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) {
                setIsDark(e.matches);
            }
        }

        mq.addEventListener('change', handleChange);
        return () => mq.removeEventListener('change', handleChange);
    }, []);

    const toggle = useCallback(() => {
        setIsDark((prev) => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
            return next;
        });
    }, []);

    return { isDark, toggle };
}
