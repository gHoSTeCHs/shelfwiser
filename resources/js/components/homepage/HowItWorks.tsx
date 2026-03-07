import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Rocket, ShoppingBag, UserPlus } from 'lucide-react';

const steps = [
    {
        icon: UserPlus,
        title: 'Sign Up',
        description:
            'Create your account in under 2 minutes. No credit card required — start with a 50-day free trial.',
    },
    {
        icon: ShoppingBag,
        title: 'Set Up Your Shop',
        description:
            'Add your products, configure your point-of-sale, set up your storefront, and invite your team.',
    },
    {
        icon: Rocket,
        title: 'Start Selling',
        description:
            'Process sales in-store and online, track everything in real time, and watch your business grow.',
    },
];

export default function HowItWorks() {
    const sectionRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

    return (
        <section
            id="how-it-works"
            className="relative border-t border-gray-100 bg-gray-50/50 py-20 lg:py-28 dark:border-white/5 dark:bg-navy-950/30"
        >
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
                <div className="mx-auto mb-16 max-w-2xl text-center">
                    <span className="mb-3 inline-block text-sm font-semibold tracking-wider text-brand-500 uppercase dark:text-brand-400">
                        How It Works
                    </span>
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                        Up and running in three steps
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                        Getting started with ShelfWise is straightforward — no
                        complicated setup, no steep learning curve.
                    </p>
                </div>

                <div ref={sectionRef} className="reveal-section relative">
                    <div className="absolute top-12 right-[calc(16.67%+24px)] left-[calc(16.67%+24px)] hidden lg:block">
                        <div className="line-draw h-[2px] w-full bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 dark:from-brand-800 dark:via-brand-500 dark:to-brand-800" />
                    </div>

                    <div className="absolute top-[60px] left-6 hidden h-[calc(100%-120px)] lg:hidden">
                        <div className="line-draw-vertical h-full w-[2px] bg-gradient-to-b from-brand-200 via-brand-400 to-brand-200 dark:from-brand-800 dark:via-brand-500 dark:to-brand-800" />
                    </div>

                    <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={step.title}
                                    className="step-item flex flex-col items-center text-center"
                                    style={{
                                        animationDelay: `${index * 200 + 400}ms`,
                                    }}
                                >
                                    <div className="relative mb-6">
                                        <div className="absolute -inset-3 rounded-full bg-brand-100/50 dark:bg-brand-500/10" />
                                        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 shadow-lg shadow-brand-500/25">
                                            <Icon className="h-7 w-7 text-white" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-500 shadow-md dark:bg-navy-900 dark:text-brand-400">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                                        {step.title}
                                    </h3>
                                    <p className="max-w-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                        {step.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
