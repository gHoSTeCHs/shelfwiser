import { useStaggerReveal } from '@/hooks/useScrollReveal';
import {
    BarChart3,
    Globe,
    Package,
    ShoppingCart,
    Truck,
    Users,
} from 'lucide-react';

const features = [
    {
        icon: Package,
        title: 'Inventory Management',
        description:
            'Track stock levels, manage packaging hierarchies, generate barcodes, and get reorder alerts before you run out.',
    },
    {
        icon: ShoppingCart,
        title: 'Point of Sale',
        description:
            'Fast checkout with offline capability, held sales, and a streamlined interface your cashiers will love.',
    },
    {
        icon: Users,
        title: 'Payroll & HR',
        description:
            'Run payroll with automated tax calculations, generate payslips, manage wage advances, and track timesheets.',
    },
    {
        icon: Globe,
        title: 'E-commerce Storefront',
        description:
            'Launch your online shop with customer authentication, cart, checkout, and integrated payment gateways.',
    },
    {
        icon: Truck,
        title: 'Supplier & B2B',
        description:
            'Connect with suppliers, browse catalogs, create purchase orders, and manage stock reservations.',
    },
    {
        icon: BarChart3,
        title: 'Reports & Analytics',
        description:
            'Deep insights into sales, inventory, financials, customer analytics, and product profitability.',
    },
];

export default function Features() {
    const containerRef = useStaggerReveal<HTMLDivElement>();

    return (
        <section id="features" className="relative py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto mb-14 max-w-2xl text-center">
                    <span className="mb-3 inline-block text-sm font-semibold tracking-wider text-brand-500 uppercase dark:text-brand-400">
                        Features
                    </span>
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                        Everything you need to run your business
                    </h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                        From inventory to payroll, from in-store sales to online
                        commerce — one platform that does it all.
                    </p>
                </div>

                <div
                    ref={containerRef}
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.title}
                                data-reveal
                                className="reveal-item group rounded-2xl border border-gray-100 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-theme-lg dark:border-white/5 dark:bg-navy-900/50 dark:hover:border-white/10 dark:hover:shadow-none"
                            >
                                <div className="mb-4 inline-flex rounded-xl bg-brand-50 p-3 transition-transform duration-300 group-hover:scale-110 dark:bg-brand-500/10">
                                    <Icon className="h-6 w-6 text-brand-500 dark:text-brand-400" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    {feature.title}
                                </h3>
                                <p className="leading-relaxed text-gray-500 dark:text-gray-400">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
