import Features from '@/components/homepage/Features';
import FinalCTA from '@/components/homepage/FinalCTA';
import Footer from '@/components/homepage/Footer';
import Hero from '@/components/homepage/Hero';
import HowItWorks from '@/components/homepage/HowItWorks';
import Navbar from '@/components/homepage/Navbar';
import Pricing from '@/components/homepage/Pricing';
import StatsBar from '@/components/homepage/StatsBar';
import Testimonials from '@/components/homepage/Testimonials';
import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="ShelfWise — Manage Your Entire Business From One Platform">
                <meta
                    name="description"
                    content="Inventory, point-of-sale, payroll, e-commerce — everything your retail business needs to grow, all in one place."
                />
            </Head>

            <div className="min-h-screen bg-white font-outfit dark:bg-gray-950">
                <Navbar />
                <Hero />
                <StatsBar />
                <Features />
                <HowItWorks />
                <Pricing />
                <Testimonials />
                <FinalCTA />
                <Footer />
            </div>
        </>
    );
}
