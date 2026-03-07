import { useScrollReveal } from '@/hooks/useScrollReveal';
import { register } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
    const { auth } = usePage<SharedData>().props;
    const sectionRef = useScrollReveal<HTMLDivElement>();

    return (
        <section className="relative overflow-hidden py-20 lg:py-28">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 dark:from-navy-900 dark:via-brand-950 dark:to-navy-950" />

            <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
            />

            <div className="absolute top-10 -right-20 h-[300px] w-[300px] rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-10 -left-20 h-[250px] w-[250px] rounded-full bg-white/5 blur-3xl" />

            <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
                <div ref={sectionRef} className="reveal-section">
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                        Ready to streamline your business?
                    </h2>
                    <p className="mx-auto mb-8 max-w-lg text-lg text-white/70">
                        Join hundreds of businesses already using ShelfWise to
                        manage inventory, process sales, and run payroll — all
                        from one platform.
                    </p>

                    {auth.user ? (
                        <Link
                            href="/dashboard"
                            className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-brand-600 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                        >
                            Go to Dashboard
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </Link>
                    ) : (
                        <Link
                            href={register()}
                            className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-brand-600 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                        >
                            Get Started Free
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </Link>
                    )}

                    <p className="mt-4 text-sm text-white/50">
                        No credit card required. 50-day free trial.
                    </p>
                </div>
            </div>
        </section>
    );
}
