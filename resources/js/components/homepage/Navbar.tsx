import { useAppearance } from '@/hooks/use-appearance';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const NAV_SECTIONS = ['features', 'how-it-works', 'pricing', 'testimonials'];

const NAV_LABELS: Record<string, string> = {
    features: 'Features',
    'how-it-works': 'How It Works',
    pricing: 'Pricing',
    testimonials: 'Testimonials',
};

export default function Navbar() {
    const { auth } = usePage<SharedData>().props;
    const { appearance, updateAppearance } = useAppearance();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const activeId = useScrollSpy(NAV_SECTIONS, 120);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleTheme = useCallback(() => {
        updateAppearance(appearance === 'dark' ? 'light' : 'dark');
    }, [appearance, updateAppearance]);

    const scrollTo = useCallback((id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setMobileOpen(false);
        }
    }, []);

    const isDark = appearance === 'dark';

    return (
        <nav
            className={`fixed top-0 right-0 left-0 z-9999 transition-all duration-500 ${
                scrolled
                    ? 'border-b border-gray-200/50 bg-white/80 shadow-theme-xs backdrop-blur-xl dark:border-white/5 dark:bg-navy-950/80'
                    : 'bg-transparent'
            }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
                <Link href={home.url()} className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 shadow-md">
                        <span className="text-lg font-bold text-white">S</span>
                    </div>
                    <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        ShelfWise
                    </span>
                </Link>

                <div className="hidden items-center gap-1 lg:flex">
                    {NAV_SECTIONS.map((id) => (
                        <button
                            key={id}
                            onClick={() => scrollTo(id)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                                activeId === id
                                    ? 'text-brand-500 dark:text-brand-400'
                                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                            }`}
                        >
                            {NAV_LABELS[id]}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                        aria-label="Toggle theme"
                    >
                        {isDark ? (
                            <Sun className="h-[18px] w-[18px]" />
                        ) : (
                            <Moon className="h-[18px] w-[18px]" />
                        )}
                    </button>

                    <div className="hidden items-center gap-3 lg:flex">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg"
                                >
                                    Get Started Free
                                </Link>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-white/10"
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <div className="border-t border-gray-200/50 bg-white/95 px-6 py-4 backdrop-blur-xl lg:hidden dark:border-white/5 dark:bg-navy-950/95">
                    <div className="flex flex-col gap-1">
                        {NAV_SECTIONS.map((id) => (
                            <button
                                key={id}
                                onClick={() => scrollTo(id)}
                                className={`rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                                    activeId === id
                                        ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400'
                                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
                                }`}
                            >
                                {NAV_LABELS[id]}
                            </button>
                        ))}
                        <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 dark:border-white/5">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-xl bg-brand-500 px-5 py-2.5 text-center text-sm font-medium text-white"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="rounded-xl px-5 py-2.5 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-xl bg-brand-500 px-5 py-2.5 text-center text-sm font-medium text-white"
                                    >
                                        Get Started Free
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
