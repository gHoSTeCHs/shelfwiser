import GridShape from '@/components/common/GridShape.tsx';
import ThemeTogglerTwo from '@/components/common/ThemeTogglerTwo';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import React from 'react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative z-1 min-h-screen bg-white dark:bg-navy-900">
            <div className="flex min-h-screen flex-col lg:flex-row">
                {/* Form Side */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-1 flex-col p-6 sm:p-8 lg:p-12"
                >
                    {children}
                </motion.div>

                {/* Decorative Side */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 lg:flex lg:w-1/2"
                >
                    {/* Decorative Elements */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/30 to-brand-700/30" />
                    <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />

                    <GridShape />

                    <div className="relative z-10 flex max-w-md flex-col items-center px-8 text-center">
                        <Link href="/" className="mb-6 block">
                            <img
                                width={180}
                                height={48}
                                src={'/images/logo/auth-logo.svg'}
                                alt="Logo"
                                className="brightness-0 invert"
                            />
                        </Link>
                        <h2 className="mb-3 text-2xl font-bold text-white">
                            Welcome to ShelfWise
                        </h2>
                        <p className="text-white/80">
                            Manage your inventory with ease. Track products,
                            process orders, and grow your business.
                        </p>
                    </div>
                </motion.div>

                {/* Theme Toggle */}
                <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
                    <ThemeTogglerTwo />
                </div>
            </div>
        </div>
    );
}
