import { Star } from 'lucide-react';

const testimonials = [
    {
        quote: "ShelfWise completely transformed how we manage our electronics store. Stock tracking alone saved us from ₦2M in losses last quarter.",
        name: 'Adebayo Ogunlesi',
        role: 'Owner, TechHub Electronics',
        initials: 'AO',
        color: 'bg-brand-500',
    },
    {
        quote: "The payroll system is a game changer. What used to take us two days now happens in 30 minutes. Our staff loves getting payslips on time.",
        name: 'Kemi Ibrahim',
        role: 'HR Manager, Fashionista Boutique',
        initials: 'KI',
        color: 'bg-success-500',
    },
    {
        quote: "We launched our online store in one afternoon. The POS and e-commerce work together seamlessly — no double entry, no confusion.",
        name: 'Tunde Fashola',
        role: 'Owner, Fresh Mart Groceries',
        initials: 'TF',
        color: 'bg-orange-500',
    },
    {
        quote: "Managing 4 shops used to be chaos. ShelfWise gives me one dashboard to see everything. I can't imagine going back.",
        name: 'Blessing Sani',
        role: 'CEO, Bella Beauty Chain',
        initials: 'BS',
        color: 'bg-blue-light-500',
    },
    {
        quote: "The supplier management feature saved us hours of phone calls and WhatsApp messages. Purchase orders are now just a few clicks.",
        name: 'Emeka Okafor',
        role: 'Procurement, BuildRight Hardware',
        initials: 'EO',
        color: 'bg-theme-purple-500',
    },
    {
        quote: "I was skeptical about moving from pen and paper, but the POS system is so intuitive that even my oldest staff member picked it up in a day.",
        name: 'Fatima Yusuf',
        role: 'Owner, Fatima Pharmacy',
        initials: 'FY',
        color: 'bg-theme-pink-500',
    },
    {
        quote: "Real-time inventory alerts mean I never run out of bestsellers anymore. My revenue increased 35% in the first three months.",
        name: 'Chidi Nwankwo',
        role: 'Owner, GadgetZone',
        initials: 'CN',
        color: 'bg-warning-500',
    },
    {
        quote: "The reporting is incredible. I finally understand which products are actually profitable and which ones are just taking up shelf space.",
        name: 'Amaka Eze',
        role: 'Manager, StyleHub Fashion',
        initials: 'AE',
        color: 'bg-error-500',
    },
];

const row1 = testimonials.slice(0, 4);
const row2 = testimonials.slice(4, 8);

function TestimonialCard({
    testimonial,
}: {
    testimonial: (typeof testimonials)[0];
}) {
    return (
        <div className="mx-3 w-[340px] shrink-0 rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/5 dark:bg-navy-900/50">
            <div className="mb-3 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className="h-4 w-4 fill-accent-400 text-accent-400"
                    />
                ))}
            </div>
            <p className="mb-5 leading-relaxed text-gray-600 italic dark:text-gray-300">
                &ldquo;{testimonial.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${testimonial.color} text-sm font-semibold text-white`}
                >
                    {testimonial.initials}
                </div>
                <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {testimonial.role}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ScrollRow({
    items,
    direction = 'left',
}: {
    items: typeof testimonials;
    direction?: 'left' | 'right';
}) {
    const doubled = [...items, ...items];

    return (
        <div className="group relative overflow-hidden py-2">
            <div
                className={`flex w-max ${
                    direction === 'left'
                        ? 'animate-[scroll-left_40s_linear_infinite]'
                        : 'animate-[scroll-right_40s_linear_infinite]'
                } group-hover:[animation-play-state:paused]`}
            >
                {doubled.map((t, i) => (
                    <TestimonialCard key={`${t.name}-${i}`} testimonial={t} />
                ))}
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-gray-950" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white dark:from-gray-950" />
        </div>
    );
}

export default function Testimonials() {
    return (
        <section
            id="testimonials"
            className="relative border-t border-gray-100 bg-white py-20 lg:py-28 dark:border-white/5 dark:bg-gray-950"
        >
            <div className="mx-auto mb-14 max-w-2xl px-6 text-center lg:px-8">
                <span className="mb-3 inline-block text-sm font-semibold tracking-wider text-brand-500 uppercase dark:text-brand-400">
                    Testimonials
                </span>
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                    Loved by businesses across Nigeria
                </h2>
                <p className="text-lg text-gray-500 dark:text-gray-400">
                    See what shop owners and managers are saying about
                    ShelfWise.
                </p>
            </div>

            <div className="space-y-4">
                <ScrollRow items={row1} direction="left" />
                <ScrollRow items={row2} direction="right" />
            </div>
        </section>
    );
}
