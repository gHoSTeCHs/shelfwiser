import { useCountUp } from '@/hooks/useCountUp';

function StatItem({
    end,
    suffix,
    prefix,
    label,
}: {
    end: number;
    suffix: string;
    prefix?: string;
    label: string;
}) {
    const { ref, display } = useCountUp({ end, suffix, prefix });

    return (
        <div className="flex flex-col items-center gap-1 px-4 py-3">
            <span
                ref={ref}
                className="text-2xl font-bold text-brand-500 sm:text-3xl dark:text-brand-400"
            >
                {display}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
                {label}
            </span>
        </div>
    );
}

export default function StatsBar() {
    return (
        <section className="relative border-y border-gray-100 bg-gray-50/80 py-12 dark:border-white/5 dark:bg-navy-950/50">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-gray-200 dark:lg:divide-white/10">
                    <StatItem end={500} suffix="+" label="Businesses" />
                    <StatItem
                        end={10000}
                        suffix="+"
                        label="Products Managed"
                    />
                    <StatItem
                        end={50}
                        prefix="₦"
                        suffix="M+"
                        label="Sales Processed"
                    />
                    <StatItem end={98} suffix="%" label="Uptime" />
                </div>
            </div>
        </section>
    );
}
