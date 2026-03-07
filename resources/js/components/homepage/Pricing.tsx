import { useStaggerReveal } from '@/hooks/useScrollReveal';
import { register } from '@/routes';
import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';

const tiers = [
    {
        name: 'Starter',
        description: 'For small shops just getting started',
        monthlyPrice: 5000,
        annualPrice: 4000,
        features: [
            '1 Shop',
            'Up to 100 Products',
            'Point of Sale',
            'Basic Reports',
            'Email Support',
            '2 Staff Accounts',
        ],
        cta: 'Get Started',
        popular: false,
    },
    {
        name: 'Professional',
        description: 'For growing businesses with multiple needs',
        monthlyPrice: 15000,
        annualPrice: 12000,
        features: [
            'Up to 5 Shops',
            'Unlimited Products',
            'Point of Sale + E-commerce',
            'Payroll & HR',
            'Supplier Management',
            'Advanced Reports',
            'Priority Support',
            '10 Staff Accounts',
        ],
        cta: 'Get Started',
        popular: true,
    },
    {
        name: 'Enterprise',
        description: 'For large operations needing full control',
        monthlyPrice: null,
        annualPrice: null,
        features: [
            'Unlimited Shops',
            'Unlimited Products',
            'Everything in Professional',
            'Custom Integrations',
            'Dedicated Account Manager',
            'SLA Guarantee',
            'Unlimited Staff',
            'API Access',
        ],
        cta: 'Contact Sales',
        popular: false,
    },
];

export default function Pricing() {
    const [annual, setAnnual] = useState(false);
    const containerRef = useStaggerReveal<HTMLDivElement>();

    return (
        <section id="pricing" className="relative py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto mb-10 max-w-2xl text-center">
                    <span className="mb-3 inline-block text-sm font-semibold tracking-wider text-brand-500 uppercase dark:text-brand-400">
                        Pricing
                    </span>
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                        Start free for 50 days. No credit card required. Upgrade
                        when you're ready.
                    </p>
                </div>

                <div className="mb-12 flex items-center justify-center gap-3">
                    <span
                        className={`text-sm font-medium ${!annual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Monthly
                    </span>
                    <button
                        onClick={() => setAnnual(!annual)}
                        className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
                            annual
                                ? 'bg-brand-500'
                                : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        aria-label="Toggle annual pricing"
                    >
                        <div
                            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                                annual
                                    ? 'translate-x-[22px]'
                                    : 'translate-x-0.5'
                            }`}
                        />
                    </button>
                    <span
                        className={`text-sm font-medium ${annual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Annual
                    </span>
                    {annual && (
                        <span className="rounded-full bg-accent-400/20 px-2.5 py-0.5 text-xs font-semibold text-accent-500 dark:bg-accent-400/10 dark:text-accent-400">
                            Save 20%
                        </span>
                    )}
                </div>

                <div
                    ref={containerRef}
                    className="grid items-start gap-6 lg:grid-cols-3"
                >
                    {tiers.map((tier) => (
                        <div
                            key={tier.name}
                            data-reveal
                            className={`reveal-item relative rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-theme-lg ${
                                tier.popular
                                    ? 'border-brand-500/30 bg-white shadow-xl shadow-brand-500/5 ring-1 ring-brand-500/20 dark:border-brand-500/20 dark:bg-navy-900/80 dark:ring-brand-500/10'
                                    : 'border-gray-100 bg-white dark:border-white/5 dark:bg-navy-900/50'
                            }`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-accent-400 to-accent-500 px-4 py-1 text-xs font-semibold text-white shadow-md">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">
                                    {tier.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {tier.description}
                                </p>
                            </div>

                            <div className="mb-6">
                                {tier.monthlyPrice !== null ? (
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                            ₦
                                            {(annual
                                                ? tier.annualPrice!
                                                : tier.monthlyPrice
                                            ).toLocaleString()}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            /month
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                            Custom
                                        </span>
                                    </div>
                                )}
                            </div>

                            <ul className="mb-8 space-y-3">
                                {tier.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-start gap-3"
                                    >
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {tier.monthlyPrice !== null ? (
                                <Link
                                    href={register()}
                                    className={`block rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200 ${
                                        tier.popular
                                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg'
                                            : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
                                    }`}
                                >
                                    {tier.cta}
                                </Link>
                            ) : (
                                <a
                                    href="mailto:sales@shelfwise.ng"
                                    className="block rounded-xl border border-gray-200 bg-white py-3 text-center text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                                >
                                    {tier.cta}
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
