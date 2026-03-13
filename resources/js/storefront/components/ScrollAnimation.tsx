import type React from 'react';
import { useRef, useEffect, useState } from 'react';
import { useAnimation } from '../hooks/useAnimation';

interface ScrollAnimationProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    threshold?: number;
}

const entranceStyles: Record<string, { from: React.CSSProperties; to: React.CSSProperties }> = {
    fade_up: {
        from: { opacity: 0, transform: 'translateY(24px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
    },
    fade_in: {
        from: { opacity: 0 },
        to: { opacity: 1 },
    },
    slide_left: {
        from: { opacity: 0, transform: 'translateX(32px)' },
        to: { opacity: 1, transform: 'translateX(0)' },
    },
    slide_right: {
        from: { opacity: 0, transform: 'translateX(-32px)' },
        to: { opacity: 1, transform: 'translateX(0)' },
    },
    scale_in: {
        from: { opacity: 0, transform: 'scale(0.95)' },
        to: { opacity: 1, transform: 'scale(1)' },
    },
};

export function ScrollAnimation({
    children,
    className = '',
    delay = 0,
    threshold = 0.15,
}: ScrollAnimationProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const { tier, entranceStyle, isReduced } = useAnimation();

    useEffect(() => {
        if (tier === 'none' || isReduced) {
            setIsVisible(true);
            return;
        }

        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(el);
                }
            },
            { threshold, rootMargin: '0px 0px -40px 0px' },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [tier, isReduced, threshold]);

    if (tier === 'none' || isReduced) {
        return <div className={className}>{children}</div>;
    }

    const style = entranceStyles[entranceStyle] ?? entranceStyles.fade_up;
    const currentStyle = isVisible ? style.to : style.from;

    return (
        <div
            ref={ref}
            className={className}
            style={{
                ...currentStyle,
                transition: `opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
                willChange: isVisible ? 'auto' : 'opacity, transform',
            }}
        >
            {children}
        </div>
    );
}
