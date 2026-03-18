import { useState, useEffect, useCallback } from 'react';
import { narrowConfig } from '../lib/section-helpers';
import type { SectionProps } from '../types/storefront';

interface CountdownConfig {
    heading?: string;
    target_date: string;
    expired_message?: string;
    cta_text?: string;
    cta_link?: string;
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function calculateTimeRemaining(targetDate: string): TimeRemaining | null {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return null;

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div
                className="flex h-16 w-16 items-center justify-center text-2xl font-bold sm:h-20 sm:w-20 sm:text-3xl"
                style={{
                    backgroundColor: 'var(--color-surface, #f5f5f5)',
                    color: 'var(--color-text, #1a1a1a)',
                    borderRadius: 'var(--radius, 8px)',
                    fontFamily: 'var(--font-heading, sans-serif)',
                }}
            >
                {String(value).padStart(2, '0')}
            </div>
            <span
                className="mt-2 text-xs font-medium uppercase tracking-wider"
                style={{
                    color: 'var(--color-text-muted, #666)',
                    fontFamily: 'var(--font-body, sans-serif)',
                }}
            >
                {label}
            </span>
        </div>
    );
}

export function CountdownSection({ config }: SectionProps) {
    const {
        heading,
        target_date,
        expired_message,
        cta_text,
        cta_link,
    } = narrowConfig<CountdownConfig>(config);

    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
        () => calculateTimeRemaining(target_date),
    );

    const updateTime = useCallback(() => {
        setTimeRemaining(calculateTimeRemaining(target_date));
    }, [target_date]);

    useEffect(() => {
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [updateTime]);

    const isExpired = timeRemaining === null;

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-4 text-center sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                {heading && (
                    <h2
                        className="mb-8 text-2xl font-bold sm:text-3xl"
                        style={{
                            color: 'var(--color-text, #1a1a1a)',
                            fontFamily: 'var(--font-heading, sans-serif)',
                            fontWeight: 'var(--font-heading-weight, 700)',
                        }}
                    >
                        {heading}
                    </h2>
                )}

                {isExpired ? (
                    <p
                        className="text-lg"
                        style={{
                            color: 'var(--color-text-muted, #666)',
                            fontFamily: 'var(--font-body, sans-serif)',
                        }}
                    >
                        {expired_message || 'This offer has ended.'}
                    </p>
                ) : (
                    <div className="flex items-center justify-center gap-3 sm:gap-6">
                        <TimeUnit value={timeRemaining.days} label="Days" />
                        <span
                            className="mt-[-1rem] text-2xl font-bold"
                            style={{ color: 'var(--color-text-muted, #999)' }}
                        >
                            :
                        </span>
                        <TimeUnit value={timeRemaining.hours} label="Hours" />
                        <span
                            className="mt-[-1rem] text-2xl font-bold"
                            style={{ color: 'var(--color-text-muted, #999)' }}
                        >
                            :
                        </span>
                        <TimeUnit value={timeRemaining.minutes} label="Minutes" />
                        <span
                            className="mt-[-1rem] text-2xl font-bold"
                            style={{ color: 'var(--color-text-muted, #999)' }}
                        >
                            :
                        </span>
                        <TimeUnit value={timeRemaining.seconds} label="Seconds" />
                    </div>
                )}

                {cta_text && cta_link && !isExpired && (
                    <a
                        href={cta_link}
                        className="mt-8 inline-block px-8 py-3 text-sm font-semibold uppercase tracking-wider transition-opacity hover:opacity-90"
                        style={{
                            backgroundColor: 'var(--color-primary, #1a1a1a)',
                            color: 'var(--color-primary-foreground, #ffffff)',
                            borderRadius: 'var(--radius, 8px)',
                            fontFamily: 'var(--font-body, sans-serif)',
                        }}
                    >
                        {cta_text}
                    </a>
                )}
            </div>
        </section>
    );
}
