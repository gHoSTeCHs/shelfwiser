import StorefrontController from '@/actions/App/Http/Controllers/Storefront/StorefrontController';
import ProductCard from '@/components/storefront/ProductCard';
import ServiceCard from '@/components/storefront/ServiceCard';
import Button from '@/components/ui/button/Button';
import EmptyState from '@/components/ui/EmptyState';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { StorefrontHomeProps } from '@/types/storefront';
import { Link } from '@inertiajs/react';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, Clock, Package, Sparkles } from 'lucide-react';
import React from 'react';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
};

/**
 * Storefront homepage displaying featured products, services, and categories.
 * Features playful-luxury design with warm terracotta accents.
 */
const Home: React.FC<StorefrontHomeProps> = ({
    shop,
    featuredProducts,
    featuredServices,
    categories,
    cartSummary,
}) => {
    return (
        <StorefrontLayout shop={shop} cartItemCount={cartSummary.item_count}>
            <div className="space-y-12 md:space-y-16">
                {/* Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-6 text-white shadow-xl sm:p-8 md:rounded-3xl md:p-12 lg:p-16 dark:from-brand-600 dark:via-brand-700 dark:to-brand-800"
                >
                    {/* Decorative elements */}
                    <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/10 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/4 rounded-full bg-brand-400/20 blur-2xl" />

                    <div className="relative z-10 max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium backdrop-blur-sm"
                        >
                            <Sparkles className="h-4 w-4" />
                            <span>Quality products & services</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
                        >
                            Welcome to{' '}
                            <span className="text-brand-100">{shop.name}</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="mb-8 text-base text-brand-100 sm:text-lg md:text-xl"
                        >
                            {shop.description ||
                                'Discover our quality products and enjoy a seamless shopping experience.'}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="flex flex-col gap-3 sm:flex-row sm:gap-4"
                        >
                            <Link
                                href={StorefrontController.products.url({
                                    shop: shop.slug,
                                })}
                            >
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    endIcon={<ArrowRight className="h-4 w-4" />}
                                    className="w-full sm:w-auto"
                                >
                                    Browse Products
                                </Button>
                            </Link>
                            <Link
                                href={StorefrontController.services.url({
                                    shop: shop.slug,
                                })}
                            >
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full border-white/30 text-white hover:bg-white/10 sm:w-auto"
                                >
                                    View Services
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </motion.section>

                {/* Categories */}
                {categories && categories.length > 0 && (
                    <motion.section
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        variants={containerVariants}
                    >
                        <motion.div variants={itemVariants} className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                                Shop by Category
                            </h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Find exactly what you're looking for
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                            {categories.map((category, index) => (
                                <motion.div
                                    key={category.id}
                                    variants={itemVariants}
                                    custom={index}
                                >
                                    <Link
                                        href={
                                            StorefrontController.products.url({
                                                shop: shop.slug,
                                            }) + `?category=${category.id}`
                                        }
                                        className="group block rounded-xl border border-gray-200 bg-white p-4 text-center transition-all duration-200 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100/50 sm:rounded-2xl sm:p-6 dark:border-navy-700 dark:bg-navy-800 dark:hover:border-brand-500 dark:hover:shadow-brand-500/10"
                                    >
                                        <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                                            {category.name}
                                        </h3>
                                        {category.description && (
                                            <p className="mt-1 line-clamp-2 text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                                                {category.description}
                                            </p>
                                        )}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Featured Products */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={containerVariants}
                >
                    <motion.div
                        variants={itemVariants}
                        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                                Featured Products
                            </h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Handpicked selections just for you
                            </p>
                        </div>
                        <Link
                            href={StorefrontController.products.url({
                                shop: shop.slug,
                            })}
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                endIcon={<ArrowRight className="h-4 w-4" />}
                            >
                                View All
                            </Button>
                        </Link>
                    </motion.div>

                    {featuredProducts && featuredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                            {featuredProducts.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    variants={itemVariants}
                                    custom={index}
                                >
                                    <ProductCard
                                        product={product}
                                        shop={shop}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <motion.div variants={itemVariants}>
                            <EmptyState
                                icon={<Package className="h-12 w-12" />}
                                title="No products available"
                                description="Check back soon for new products."
                            />
                        </motion.div>
                    )}
                </motion.section>

                {/* Featured Services */}
                {featuredServices && featuredServices.length > 0 && (
                    <motion.section
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        variants={containerVariants}
                    >
                        <motion.div
                            variants={itemVariants}
                            className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
                                    Featured Services
                                </h2>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Professional services tailored to your needs
                                </p>
                            </div>
                            <Link
                                href={StorefrontController.services.url({
                                    shop: shop.slug,
                                })}
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    endIcon={<ArrowRight className="h-4 w-4" />}
                                >
                                    View All
                                </Button>
                            </Link>
                        </motion.div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
                            {featuredServices.map((service, index) => (
                                <motion.div
                                    key={service.id}
                                    variants={itemVariants}
                                    custom={index}
                                >
                                    <ServiceCard
                                        service={service}
                                        shop={shop}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Business Hours */}
                {shop.storefront_settings?.business_hours && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:rounded-2xl sm:p-6 dark:border-navy-700 dark:bg-navy-800"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 sm:h-12 sm:w-12 dark:bg-brand-500/10 dark:text-brand-400">
                                <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Business Hours
                                </h3>
                                <p className="mt-1 text-sm text-gray-600 sm:text-base dark:text-gray-400">
                                    {shop.storefront_settings.business_hours}
                                </p>
                            </div>
                        </div>
                    </motion.section>
                )}
            </div>
        </StorefrontLayout>
    );
};

export default Home;
