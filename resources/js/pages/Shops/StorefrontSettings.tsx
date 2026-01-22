import ShopController from '@/actions/App/Http/Controllers/ShopController';
import Checkbox from '@/components/form/input/Checkbox';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Shop } from '@/types/shop';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Save, Store } from 'lucide-react';
import React from 'react';

interface StorefrontSettingsProps {
    shop: Shop;
    currencies: Record<string, string>;
}

/**
 * Admin storefront settings page for configuring shop's e-commerce frontend.
 * Controls storefront status, currency, tax, shipping, appearance, and SEO settings.
 */
export default function StorefrontSettings({
    shop,
    currencies,
}: StorefrontSettingsProps) {
    const [storefrontEnabled, setStorefrontEnabled] = React.useState(
        shop.storefront_enabled,
    );
    const [allowRetailSales, setAllowRetailSales] = React.useState(
        shop.allow_retail_sales,
    );
    const [selectedCurrency, setSelectedCurrency] = React.useState(
        shop.currency,
    );
    const [vatEnabled, setVatEnabled] = React.useState(shop.vat_enabled);
    const [vatInclusive, setVatInclusive] = React.useState(shop.vat_inclusive);

    const currencyOptions = Object.entries(currencies).map(([code, name]) => ({
        value: code,
        label: name,
    }));

    const handleCurrencyChange = (code: string) => {
        setSelectedCurrency(code);
        const symbol =
            code === 'NGN'
                ? '₦'
                : code === 'USD'
                  ? '$'
                  : code === 'EUR'
                    ? '€'
                    : code === 'GBP'
                      ? '£'
                      : code === 'GHS'
                        ? '₵'
                        : code === 'KES'
                          ? 'KSh'
                          : code === 'ZAR'
                            ? 'R'
                            : code;
        return symbol;
    };

    const isWholesale = shop.inventory_model === 'wholesale_only';

    return (
        <>
            <Head title={`Storefront Settings - ${shop.name}`} />

            <div className="space-y-6">
                <div>
                    <Link
                        href={`/shops/${shop.id}`}
                        className="mb-2 inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Shop
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                                <Store className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    Storefront Settings
                                </h1>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Configure {shop.name}'s online storefront
                                    appearance and functionality
                                </p>
                            </div>
                        </div>
                        {storefrontEnabled && (
                            <a
                                href={`/store/${shop.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="outline">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Storefront
                                </Button>
                            </a>
                        )}
                    </div>
                </div>

                <Form
                    action={ShopController.updateStorefrontSettings.url({
                        shop: shop.id,
                    })}
                    method="patch"
                >
                    {({ errors, processing }) => (
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h2 className="mb-6 text-xl font-semibold text-gray-900">
                                    General Settings
                                </h2>

                                <div className="space-y-6">
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="storefront_enabled"
                                            checked={storefrontEnabled}
                                            onChange={(checked) =>
                                                setStorefrontEnabled(checked)
                                            }
                                        />
                                        <Label
                                            htmlFor="storefront_enabled"
                                            className="mb-0 ml-3"
                                        >
                                            Enable Storefront
                                        </Label>
                                    </div>
                                    <input
                                        type="hidden"
                                        name="storefront_enabled"
                                        value={storefrontEnabled ? '1' : '0'}
                                    />
                                    <p className="ml-8 text-sm text-gray-600">
                                        Allow customers to browse and purchase
                                        products online
                                    </p>

                                    {isWholesale && (
                                        <>
                                            <div className="flex items-center">
                                                <Checkbox
                                                    id="allow_retail_sales"
                                                    checked={allowRetailSales}
                                                    onChange={(checked) =>
                                                        setAllowRetailSales(
                                                            checked,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor="allow_retail_sales"
                                                    className="mb-0 ml-3"
                                                >
                                                    Allow Retail Sales
                                                </Label>
                                            </div>
                                            <input
                                                type="hidden"
                                                name="allow_retail_sales"
                                                value={
                                                    allowRetailSales ? '1' : '0'
                                                }
                                            />
                                            <p className="ml-8 text-sm text-gray-600">
                                                Enable retail pricing for
                                                wholesale products on storefront
                                            </p>
                                        </>
                                    )}
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h2 className="mb-6 text-xl font-semibold text-gray-900">
                                    Currency Settings
                                </h2>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div>
                                        <Label htmlFor="currency">
                                            Currency{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            options={currencyOptions}
                                            defaultValue={selectedCurrency}
                                            onChange={(value) =>
                                                handleCurrencyChange(value)
                                            }
                                        />
                                        <input
                                            type="hidden"
                                            name="currency"
                                            value={selectedCurrency}
                                        />
                                        <InputError message={errors.currency} />
                                    </div>

                                    <div>
                                        <Label htmlFor="currency_symbol">
                                            Currency Symbol{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="text"
                                            name="currency_symbol"
                                            id="currency_symbol"
                                            defaultValue={shop.currency_symbol}
                                            error={!!errors.currency_symbol}
                                        />
                                        <InputError
                                            message={errors.currency_symbol}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="currency_decimals">
                                            Decimal Places{' '}
                                            <span className="text-error-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            type="number"
                                            name="currency_decimals"
                                            id="currency_decimals"
                                            defaultValue={shop.currency_decimals.toString()}
                                            error={!!errors.currency_decimals}
                                            min={0}
                                            max={4}
                                        />
                                        <InputError
                                            message={errors.currency_decimals}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h2 className="mb-6 text-xl font-semibold text-gray-900">
                                    Tax Settings
                                </h2>

                                <div className="space-y-6">
                                    <div className="flex items-center">
                                        <Checkbox
                                            id="vat_enabled"
                                            checked={vatEnabled}
                                            onChange={(checked) =>
                                                setVatEnabled(checked)
                                            }
                                        />
                                        <Label
                                            htmlFor="vat_enabled"
                                            className="mb-0 ml-3"
                                        >
                                            Enable Tax/VAT
                                        </Label>
                                    </div>
                                    <input
                                        type="hidden"
                                        name="vat_enabled"
                                        value={vatEnabled ? '1' : '0'}
                                    />

                                    {vatEnabled && (
                                        <div className="ml-8 space-y-6">
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                <div>
                                                    <Label htmlFor="vat_rate">
                                                        Tax Rate (%){' '}
                                                        <span className="text-error-500">
                                                            *
                                                        </span>
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        name="vat_rate"
                                                        id="vat_rate"
                                                        defaultValue={shop.vat_rate.toString()}
                                                        error={
                                                            !!errors.vat_rate
                                                        }
                                                        min={0}
                                                        max={100}
                                                        step={0.01}
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.vat_rate
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <div className="flex h-full items-center pt-7">
                                                        <Checkbox
                                                            id="vat_inclusive"
                                                            checked={
                                                                vatInclusive
                                                            }
                                                            onChange={(
                                                                checked,
                                                            ) =>
                                                                setVatInclusive(
                                                                    checked,
                                                                )
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor="vat_inclusive"
                                                            className="mb-0 ml-3"
                                                        >
                                                            Tax Inclusive
                                                            Pricing
                                                        </Label>
                                                    </div>
                                                    <input
                                                        type="hidden"
                                                        name="vat_inclusive"
                                                        value={
                                                            vatInclusive
                                                                ? '1'
                                                                : '0'
                                                        }
                                                    />
                                                    <p className="mt-1 ml-8 text-sm text-gray-600">
                                                        Product prices already
                                                        include tax
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h2 className="mb-6 text-xl font-semibold text-gray-900">
                                    Shipping Settings
                                </h2>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="shipping_fee">
                                            Shipping Fee ({shop.currency_symbol}
                                            )
                                        </Label>
                                        <Input
                                            type="number"
                                            name="shipping_fee"
                                            id="shipping_fee"
                                            defaultValue={
                                                shop.storefront_settings?.shipping_fee?.toString() ||
                                                '0'
                                            }
                                            error={!!errors.shipping_fee}
                                            min={0}
                                            step={0.01}
                                        />
                                        <InputError
                                            message={errors.shipping_fee}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="free_shipping_threshold">
                                            Free Shipping Threshold (
                                            {shop.currency_symbol})
                                        </Label>
                                        <Input
                                            type="number"
                                            name="free_shipping_threshold"
                                            id="free_shipping_threshold"
                                            defaultValue={
                                                shop.storefront_settings?.free_shipping_threshold?.toString() ||
                                                '0'
                                            }
                                            error={
                                                !!errors.free_shipping_threshold
                                            }
                                            min={0}
                                            step={0.01}
                                            hint="Orders above this amount ship for free"
                                        />
                                        <InputError
                                            message={
                                                errors.free_shipping_threshold
                                            }
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h2 className="mb-6 text-xl font-semibold text-gray-900">
                                    Appearance
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="theme_color">
                                            Theme Color
                                        </Label>
                                        <Input
                                            type="color"
                                            name="theme_color"
                                            id="theme_color"
                                            defaultValue={
                                                shop.storefront_settings
                                                    ?.theme_color || '#6366f1'
                                            }
                                            error={!!errors.theme_color}
                                            className="h-10 w-20"
                                        />
                                        <InputError
                                            message={errors.theme_color}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="logo_url">
                                            Logo URL
                                        </Label>
                                        <Input
                                            type="url"
                                            name="logo_url"
                                            id="logo_url"
                                            defaultValue={
                                                shop.storefront_settings
                                                    ?.logo_url || ''
                                            }
                                            error={!!errors.logo_url}
                                            hint="Link to your shop logo image"
                                        />
                                        <InputError message={errors.logo_url} />
                                    </div>

                                    <div>
                                        <Label htmlFor="banner_url">
                                            Banner URL
                                        </Label>
                                        <Input
                                            type="url"
                                            name="banner_url"
                                            id="banner_url"
                                            defaultValue={
                                                shop.storefront_settings
                                                    ?.banner_url || ''
                                            }
                                            error={!!errors.banner_url}
                                            hint="Link to your homepage banner image"
                                        />
                                        <InputError
                                            message={errors.banner_url}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h2 className="mb-6 text-xl font-semibold text-gray-900">
                                    SEO & Meta
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="meta_title">
                                            Meta Title
                                        </Label>
                                        <Input
                                            type="text"
                                            name="meta_title"
                                            id="meta_title"
                                            defaultValue={
                                                shop.storefront_settings
                                                    ?.meta_title || ''
                                            }
                                            error={!!errors.meta_title}
                                            hint="SEO title for search engines (max 100 characters)"
                                        />
                                        <InputError
                                            message={errors.meta_title}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="meta_description">
                                            Meta Description
                                        </Label>
                                        <TextArea
                                            name="meta_description"
                                            id="meta_description"
                                            value={
                                                shop.storefront_settings
                                                    ?.meta_description || ''
                                            }
                                            error={!!errors.meta_description}
                                            hint="SEO description for search engines (max 200 characters)"
                                            rows={3}
                                        />
                                        <InputError
                                            message={errors.meta_description}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h2 className="mb-6 text-xl font-semibold text-gray-900">
                                    Social Media
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="social_facebook">
                                            Facebook URL
                                        </Label>
                                        <Input
                                            type="url"
                                            name="social_facebook"
                                            id="social_facebook"
                                            defaultValue={
                                                shop.storefront_settings
                                                    ?.social_facebook || ''
                                            }
                                            error={!!errors.social_facebook}
                                            placeholder="https://facebook.com/yourpage"
                                        />
                                        <InputError
                                            message={errors.social_facebook}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="social_instagram">
                                            Instagram URL
                                        </Label>
                                        <Input
                                            type="url"
                                            name="social_instagram"
                                            id="social_instagram"
                                            defaultValue={
                                                shop.storefront_settings
                                                    ?.social_instagram || ''
                                            }
                                            error={!!errors.social_instagram}
                                            placeholder="https://instagram.com/yourprofile"
                                        />
                                        <InputError
                                            message={errors.social_instagram}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="social_twitter">
                                            Twitter URL
                                        </Label>
                                        <Input
                                            type="url"
                                            name="social_twitter"
                                            id="social_twitter"
                                            defaultValue={
                                                shop.storefront_settings
                                                    ?.social_twitter || ''
                                            }
                                            error={!!errors.social_twitter}
                                            placeholder="https://twitter.com/yourhandle"
                                        />
                                        <InputError
                                            message={errors.social_twitter}
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h2 className="mb-6 text-xl font-semibold text-gray-900">
                                    Business Information
                                </h2>

                                <div>
                                    <Label htmlFor="business_hours">
                                        Business Hours
                                    </Label>
                                    <TextArea
                                        name="business_hours"
                                        id="business_hours"
                                        value={
                                            shop.storefront_settings
                                                ?.business_hours || ''
                                        }
                                        error={!!errors.business_hours}
                                        hint="Operating hours for customer reference"
                                        rows={4}
                                        placeholder="Mon-Fri: 9:00 AM - 6:00 PM&#10;Sat: 10:00 AM - 4:00 PM&#10;Sun: Closed"
                                    />
                                    <InputError
                                        message={errors.business_hours}
                                    />
                                </div>
                            </Card>

                            <div className="flex justify-end gap-4">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    disabled={processing}
                                    loading={processing}
                                    startIcon={<Save />}
                                >
                                    Save Settings
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </>
    );
};

StorefrontSettings.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);
