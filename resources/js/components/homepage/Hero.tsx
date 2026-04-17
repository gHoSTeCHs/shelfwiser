import { dashboard, register } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Play } from 'lucide-react';
import DeviceMockups from './DeviceMockups';

export default function Hero() {
    const { auth } = usePage<SharedData>().props;

    const scrollToHowItWorks = () => {
        document
            .getElementById('how-it-works')
            ?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="relative min-h-screen overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-blue-light-50 dark:from-navy-950 dark:via-brand-950/30 dark:to-navy-950" />

                <div className="absolute top-20 -left-32 h-[500px] w-[500px] animate-[float_20s_ease-in-out_infinite] rounded-full bg-brand-200/20 blur-3xl dark:bg-brand-500/5" />
                <div className="absolute top-40 -right-20 h-[400px] w-[400px] animate-[float_25s_ease-in-out_infinite_reverse] rounded-full bg-blue-light-200/20 blur-3xl dark:bg-blue-light-500/5" />
                <div className="absolute -bottom-20 left-1/3 h-[350px] w-[350px] animate-[float_22s_ease-in-out_infinite_2s] rounded-full bg-brand-100/30 blur-3xl dark:bg-brand-600/5" />

                <div
                    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />
            </div>

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    <div className="max-w-xl">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50/80 px-4 py-1.5 backdrop-blur-sm dark:border-brand-500/20 dark:bg-brand-500/10">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                            </span>
                            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                Trusted by 500+ businesses across Nigeria
                            </span>
                        </div>

                        <h1 className="mb-6 text-4xl leading-[1.1] font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-title-lg dark:text-white">
                            Manage Your Entire{' '}
                            <span className="bg-gradient-to-r from-brand-500 to-blue-light-500 bg-clip-text text-transparent dark:from-brand-400 dark:to-blue-light-400">
                                Business
                            </span>{' '}
                            From One Platform
                        </h1>

                        <p className="mb-8 text-lg leading-relaxed text-gray-500 dark:text-gray-400">
                            Inventory, point-of-sale, payroll, e-commerce —
                            everything your retail business needs to grow, all
                            in one place.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={dashboard.url()}
                                    className="group inline-flex items-center gap-2 rounded-xl bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30"
                                >
                                    Go to Dashboard
                                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={register()}
                                        className="group inline-flex items-center gap-2 rounded-xl bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30"
                                    >
                                        Get Started Free
                                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                    </Link>
                                    <button
                                        onClick={scrollToHowItWorks}
                                        className="group inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-gray-700 backdrop-blur-sm transition-all duration-200 hover:border-gray-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/20 dark:hover:bg-white/10"
                                    >
                                        <Play className="h-4 w-4 text-brand-500" />
                                        See How It Works
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="mt-10 flex items-center gap-3">
                            <div className="flex -space-x-2.5">
                                {[
                                    'bg-brand-500',
                                    'bg-success-500',
                                    'bg-orange-500',
                                    'bg-blue-light-500',
                                ].map((bg, i) => (
                                    <div
                                        key={i}
                                        className={`flex h-8 w-8 items-center justify-center rounded-full ${bg} text-xs font-semibold text-white ring-2 ring-white dark:ring-navy-950`}
                                    >
                                        {['AO', 'KI', 'TF', 'BS'][i]}
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    500+
                                </span>{' '}
                                business owners already onboard
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <DeviceMockups />
                    </div>
                </div>
            </div>
        </section>
    );
}
