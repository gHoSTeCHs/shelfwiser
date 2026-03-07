import { useEffect, useRef } from 'react';

interface ScrollRevealOptions {
    threshold?: number;
    rootMargin?: string;
    once?: boolean;
}

export function useScrollReveal<T extends HTMLElement>(
    options: ScrollRevealOptions = {},
) {
    const ref = useRef<T>(null);
    const { threshold = 0.15, rootMargin = '0px', once = true } = options;

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        if (prefersReducedMotion) {
            element.style.opacity = '1';
            element.style.transform = 'none';
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    element.classList.add('revealed');
                    if (once) observer.unobserve(element);
                }
            },
            { threshold, rootMargin },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold, rootMargin, once]);

    return ref;
}

export function useStaggerReveal<T extends HTMLElement>(
    options: ScrollRevealOptions = {},
) {
    const ref = useRef<T>(null);
    const { threshold = 0.1, rootMargin = '0px', once = true } = options;

    useEffect(() => {
        const container = ref.current;
        if (!container) return;

        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        const children = container.querySelectorAll('[data-reveal]');

        if (prefersReducedMotion) {
            children.forEach((child) => {
                (child as HTMLElement).style.opacity = '1';
                (child as HTMLElement).style.transform = 'none';
            });
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    children.forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('revealed');
                        }, index * 100);
                    });
                    if (once) observer.unobserve(container);
                }
            },
            { threshold, rootMargin },
        );

        observer.observe(container);
        return () => observer.disconnect();
    }, [threshold, rootMargin, once]);

    return ref;
}
