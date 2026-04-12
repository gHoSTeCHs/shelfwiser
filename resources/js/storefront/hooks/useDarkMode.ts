import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'storefront-color-mode';

type DarkModeStrategy = 'system' | 'toggle' | 'light' | 'dark';

export function useDarkMode(strategy: DarkModeStrategy = 'system'): {
    isDark: boolean;
    toggle: (() => void) | undefined;
} {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window === 'undefined') return false;

        if (strategy === 'dark') return true;
        if (strategy === 'light') return false;

        if (strategy === 'toggle') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'dark') return true;
            if (saved === 'light') return false;
        }

        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        if (strategy === 'dark') { setIsDark(true); return; }
        if (strategy === 'light') { setIsDark(false); return; }

        const mq = window.matchMedia('(prefers-color-scheme: dark)');

        if (strategy === 'toggle') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'dark') setIsDark(true);
            else if (saved === 'light') setIsDark(false);
            else setIsDark(mq.matches);
        } else {
            setIsDark(mq.matches);
        }

        function handleChange(e: MediaQueryListEvent) {
            if (strategy === 'toggle') {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) return;
            }
            setIsDark(e.matches);
        }

        mq.addEventListener('change', handleChange);
        return () => mq.removeEventListener('change', handleChange);
    }, [strategy]);

    const toggle = useCallback(() => {
        setIsDark((prev) => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
            return next;
        });
    }, []);

    return {
        isDark,
        toggle: strategy === 'toggle' ? toggle : undefined,
    };
}
