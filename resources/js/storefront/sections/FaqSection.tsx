import { useState } from 'react';
import { ScrollAnimation } from '../components/ScrollAnimation';
import type { SectionProps } from '../types/storefront';

interface FaqItem {
    question: string;
    answer: string;
}

interface AccordionItemProps {
    item: FaqItem;
    isOpen: boolean;
    onToggle: () => void;
}

function AccordionItem({ item, isOpen, onToggle }: AccordionItemProps) {
    return (
        <div
            style={{
                borderBottom: '1px solid var(--color-border, #e5e7eb)',
            }}
        >
            <button
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
                aria-expanded={isOpen}
            >
                <span
                    className="text-base font-semibold sm:text-lg"
                    style={{
                        fontFamily: 'var(--font-heading, sans-serif)',
                        color: 'var(--color-heading, var(--color-text, #1a1a1a))',
                    }}
                >
                    {item.question}
                </span>

                <span
                    className="flex shrink-0 items-center justify-center"
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius, 8px)',
                        backgroundColor: isOpen
                            ? 'var(--color-primary, #2563eb)'
                            : 'var(--color-surface, #f3f4f6)',
                        color: isOpen
                            ? 'var(--color-primary-foreground, #ffffff)'
                            : 'var(--color-text, #6b7280)',
                        transition: 'background-color 0.2s ease, color 0.2s ease',
                    }}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        {isOpen ? (
                            <line x1="3" y1="7" x2="11" y2="7" />
                        ) : (
                            <>
                                <line x1="7" y1="3" x2="7" y2="11" />
                                <line x1="3" y1="7" x2="11" y2="7" />
                            </>
                        )}
                    </svg>
                </span>
            </button>

            <div
                className="faq-accordion-body"
                style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.3s ease',
                }}
            >
                <div style={{ overflow: 'hidden' }}>
                    <div
                        className="pb-5"
                        style={{
                            fontFamily: 'var(--font-body, sans-serif)',
                            color: 'var(--color-text, #4b5563)',
                            lineHeight: 'var(--line-height, 1.7)',
                            fontSize: 'var(--font-base-size, 16px)',
                        }}
                    >
                        {item.answer}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function FaqSection({ config }: SectionProps) {
    const heading = config.heading as string | undefined;
    const subheading = config.subheading as string | undefined;
    const items = (config.items ?? []) as FaqItem[];
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    if (items.length === 0) {
        return null;
    }

    function handleToggle(index: number) {
        setOpenIndex((prev) => (prev === index ? null : index));
    }

    return (
        <section style={{ padding: 'var(--section-spacing, 64px) 0' }}>
            <div
                className="mx-auto px-4 sm:px-6"
                style={{ maxWidth: 'var(--container-width, 1280px)' }}
            >
                <div className="mx-auto max-w-3xl">
                    {(heading || subheading) && (
                        <ScrollAnimation>
                            <div className="mb-10 text-center">
                                {heading && (
                                    <h2
                                        className="text-3xl font-bold sm:text-4xl"
                                        style={{
                                            fontFamily: 'var(--font-heading, sans-serif)',
                                            color: 'var(--color-heading, var(--color-text, #1a1a1a))',
                                        }}
                                    >
                                        {heading}
                                    </h2>
                                )}
                                {subheading && (
                                    <p
                                        className="mt-3 text-base sm:text-lg"
                                        style={{
                                            fontFamily: 'var(--font-body, sans-serif)',
                                            color: 'var(--color-muted, #6b7280)',
                                        }}
                                    >
                                        {subheading}
                                    </p>
                                )}
                            </div>
                        </ScrollAnimation>
                    )}

                    <ScrollAnimation>
                        <div
                            style={{
                                borderTop: '1px solid var(--color-border, #e5e7eb)',
                            }}
                        >
                            {items.map((item, index) => (
                                <AccordionItem
                                    key={index}
                                    item={item}
                                    isOpen={openIndex === index}
                                    onToggle={() => handleToggle(index)}
                                />
                            ))}
                        </div>
                    </ScrollAnimation>
                </div>
            </div>
        </section>
    );
}
