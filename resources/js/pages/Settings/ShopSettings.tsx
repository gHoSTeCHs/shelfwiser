import ShopSettingsController from '@/actions/App/Http/Controllers/ShopSettingsController';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/input/Checkbox';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Save, Settings } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/useToast';

interface Shop {
    id: number;
    name: string;
    tax_settings?: TaxSettings;
}

interface TaxSettings {
    id?: number;
    shop_id: number;
    tax_jurisdiction_id: number | null;
    enable_tax_calculations: boolean;
    default_tax_handling: string;
    overtime_threshold_hours: number;
    overtime_multiplier: number;
    default_payroll_frequency: string;
    wage_advance_max_percentage: number;
    default_pension_enabled: boolean;
    default_nhf_enabled: boolean;
    default_nhis_enabled: boolean;
}

interface TaxJurisdiction {
    id: number;
    name: string;
    code: string;
    country_code: string;
}

interface OptionType {
    value: string;
    label: string;
    description?: string;
}

interface Props {
    shop: Shop;
    taxSettings: TaxSettings | null;
    taxJurisdictions: TaxJurisdiction[];
    taxHandlingOptions: OptionType[];
    payFrequencyOptions: OptionType[];
}

export default function ShopSettings({
    shop,
    taxSettings,
    taxJurisdictions,
    taxHandlingOptions,
    payFrequencyOptions,
}: Props) {
    const toast = useToast();

    const [taxJurisdictionId, setTaxJurisdictionId] = useState(
        taxSettings?.tax_jurisdiction_id?.toString() || '',
    );
    const [enableTax, setEnableTax] = useState(
        taxSettings?.enable_tax_calculations ?? true,
    );
    const [taxHandling, setTaxHandling] = useState(
        taxSettings?.default_tax_handling || 'inclusive',
    );
    const [overtimeThreshold, setOvertimeThreshold] = useState(
        taxSettings?.overtime_threshold_hours || 8,
    );
    const [overtimeMultiplier, setOvertimeMultiplier] = useState(
        taxSettings?.overtime_multiplier || 1.5,
    );
    const [payrollFrequency, setPayrollFrequency] = useState(
        taxSettings?.default_payroll_frequency || 'monthly',
    );
    const [wageAdvanceMax, setWageAdvanceMax] = useState(
        taxSettings?.wage_advance_max_percentage || 25,
    );
    const [pensionEnabled, setPensionEnabled] = useState(
        taxSettings?.default_pension_enabled ?? true,
    );
    const [nhfEnabled, setNhfEnabled] = useState(
        taxSettings?.default_nhf_enabled ?? true,
    );
    const [nhisEnabled, setNhisEnabled] = useState(
        taxSettings?.default_nhis_enabled ?? true,
    );

    return (
        <AppLayout>
            <Head title={`Settings - ${shop.name}`} />

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Shop Settings
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {shop.name}
                        </p>
                    </div>
                </div>

                <Form
                    action={ShopSettingsController.update.url({ shop: shop.id })}
                    method="patch"
                    onSuccess={() => {
                        toast.success('Settings updated successfully');
                    }}
                >
                    {({ errors, processing }) => (
                        <div className="space-y-6">
                            <Card
                                title="Tax Settings"
                                description="Configure tax calculations and handling"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="enable_tax_calculations"
                                            name="enable_tax_calculations"
                                            checked={enableTax}
                                            onChange={(e) =>
                                                setEnableTax(e.target.checked)
                                            }
                                        />
                                        <Label htmlFor="enable_tax_calculations">
                                            Enable tax calculations
                                        </Label>
                                    </div>

                                    {enableTax && (
                                        <>
                                            <div>
                                                <Label htmlFor="tax_jurisdiction_id">
                                                    Tax Jurisdiction
                                                </Label>
                                                <Select
                                                    options={[
                                                        {
                                                            value: '',
                                                            label: 'Select jurisdiction',
                                                        },
                                                        ...taxJurisdictions.map(
                                                            (tj) => ({
                                                                value: tj.id.toString(),
                                                                label: `${tj.name} (${tj.country_code})`,
                                                            }),
                                                        ),
                                                    ]}
                                                    value={taxJurisdictionId}
                                                    onChange={
                                                        setTaxJurisdictionId
                                                    }
                                                />
                                                <input
                                                    type="hidden"
                                                    name="tax_jurisdiction_id"
                                                    value={taxJurisdictionId}
                                                />
                                                <InputError
                                                    message={
                                                        errors.tax_jurisdiction_id
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="default_tax_handling">
                                                    Default Tax Handling
                                                </Label>
                                                <Select
                                                    options={taxHandlingOptions.map(
                                                        (option) => ({
                                                            value: option.value,
                                                            label: option.label,
                                                        }),
                                                    )}
                                                    value={taxHandling}
                                                    onChange={setTaxHandling}
                                                />
                                                <input
                                                    type="hidden"
                                                    name="default_tax_handling"
                                                    value={taxHandling}
                                                />
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                                                    {taxHandlingOptions.find(
                                                        (o) =>
                                                            o.value ===
                                                            taxHandling,
                                                    )?.description}
                                                </p>
                                                <InputError
                                                    message={
                                                        errors.default_tax_handling
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Card>

                            <Card
                                title="Payroll Settings"
                                description="Configure default payroll and compensation settings"
                            >
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="overtime_threshold_hours">
                                            Overtime Threshold (hours/day)
                                        </Label>
                                        <Input
                                            type="number"
                                            name="overtime_threshold_hours"
                                            id="overtime_threshold_hours"
                                            value={overtimeThreshold}
                                            onChange={(e) =>
                                                setOvertimeThreshold(
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 8,
                                                )
                                            }
                                            step="0.5"
                                            min="0"
                                            max="24"
                                            error={
                                                !!errors.overtime_threshold_hours
                                            }
                                            hint="Hours worked beyond this threshold count as overtime"
                                        />
                                        <InputError
                                            message={
                                                errors.overtime_threshold_hours
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="overtime_multiplier">
                                            Overtime Multiplier
                                        </Label>
                                        <Input
                                            type="number"
                                            name="overtime_multiplier"
                                            id="overtime_multiplier"
                                            value={overtimeMultiplier}
                                            onChange={(e) =>
                                                setOvertimeMultiplier(
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 1.5,
                                                )
                                            }
                                            step="0.1"
                                            min="1"
                                            max="5"
                                            error={!!errors.overtime_multiplier}
                                            hint="Overtime pay rate (e.g., 1.5 = time and a half)"
                                        />
                                        <InputError
                                            message={errors.overtime_multiplier}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="default_payroll_frequency">
                                            Default Payroll Frequency
                                        </Label>
                                        <Select
                                            options={payFrequencyOptions.map(
                                                (option) => ({
                                                    value: option.value,
                                                    label: option.label,
                                                }),
                                            )}
                                            value={payrollFrequency}
                                            onChange={setPayrollFrequency}
                                        />
                                        <input
                                            type="hidden"
                                            name="default_payroll_frequency"
                                            value={payrollFrequency}
                                        />
                                        <InputError
                                            message={
                                                errors.default_payroll_frequency
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="wage_advance_max_percentage">
                                            Max Wage Advance (% of salary)
                                        </Label>
                                        <Input
                                            type="number"
                                            name="wage_advance_max_percentage"
                                            id="wage_advance_max_percentage"
                                            value={wageAdvanceMax}
                                            onChange={(e) =>
                                                setWageAdvanceMax(
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 25,
                                                )
                                            }
                                            step="1"
                                            min="0"
                                            max="100"
                                            error={
                                                !!errors.wage_advance_max_percentage
                                            }
                                            hint="Maximum percentage of salary employees can request as advance"
                                        />
                                        <InputError
                                            message={
                                                errors.wage_advance_max_percentage
                                            }
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card
                                title="Statutory Deductions"
                                description="Default settings for pension, NHF, and NHIS contributions"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="default_pension_enabled"
                                            name="default_pension_enabled"
                                            checked={pensionEnabled}
                                            onChange={(e) =>
                                                setPensionEnabled(
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <div>
                                            <Label htmlFor="default_pension_enabled">
                                                Enable pension contributions
                                            </Label>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Apply pension deductions to new
                                                employees by default
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="default_nhf_enabled"
                                            name="default_nhf_enabled"
                                            checked={nhfEnabled}
                                            onChange={(e) =>
                                                setNhfEnabled(e.target.checked)
                                            }
                                        />
                                        <div>
                                            <Label htmlFor="default_nhf_enabled">
                                                Enable NHF contributions
                                            </Label>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Apply National Housing Fund
                                                deductions to new employees
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="default_nhis_enabled"
                                            name="default_nhis_enabled"
                                            checked={nhisEnabled}
                                            onChange={(e) =>
                                                setNhisEnabled(e.target.checked)
                                            }
                                        />
                                        <div>
                                            <Label htmlFor="default_nhis_enabled">
                                                Enable NHIS contributions
                                            </Label>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Apply National Health Insurance
                                                Scheme deductions to new
                                                employees
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="flex justify-end gap-3">
                                <Link href="/dashboard">
                                    <Button variant="outline">Cancel</Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    loading={processing}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Settings
                                </Button>
                            </div>
                        </div>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}

ShopSettings.layout = (page: React.ReactNode) => page;
