import {
    deleteRentProof,
    update,
    uploadRentProof,
} from '@/actions/App/Http/Controllers/Web/EmployeeTaxSettingsController';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/AppLayout';
import type {
    AppliedRelief,
    EmployeeTaxSettings,
    TaxCalculationResult,
    TaxLawVersion,
    TaxRelief,
} from '@/types/payroll';
import { Form, Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Calculator,
    CheckCircle,
    Home,
    Info,
    Receipt,
    ShieldCheck,
    Trash2,
    Upload,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    employee: {
        id: number;
        name: string;
        email: string;
    };
    taxSettings: EmployeeTaxSettings;
    availableReliefs: TaxRelief[];
    taxSummary: TaxCalculationResult | { error: string };
    taxLawVersion: TaxLawVersion | null;
    taxLawLabel: string | null;
}

export default function TaxSettings({
    employee,
    taxSettings,
    availableReliefs,
    taxSummary,
    taxLawVersion,
    taxLawLabel,
}: Props) {
    const [isHomeowner, setIsHomeowner] = useState(
        taxSettings.is_homeowner ?? false,
    );
    const [isTaxExempt, setIsTaxExempt] = useState(
        taxSettings.is_tax_exempt ?? false,
    );
    const [selectedReliefs, setSelectedReliefs] = useState<string[]>(
        taxSettings.active_reliefs ?? [],
    );
    const [uploading, setUploading] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleReliefToggle = (code: string) => {
        setSelectedReliefs((prev) =>
            prev.includes(code)
                ? prev.filter((r) => r !== code)
                : [...prev, code],
        );
    };

    const handleRentProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('rent_proof_document', file);

        router.post(uploadRentProof.url({ user: employee.id }), formData, {
            forceFormData: true,
            onFinish: () => setUploading(false),
        });
    };

    const handleDeleteRentProof = () => {
        if (
            confirm('Are you sure you want to remove the rent proof document?')
        ) {
            router.delete(deleteRentProof.url({ user: employee.id }));
        }
    };

    const isNTA2025 = taxLawVersion === 'nta_2025';
    const hasTaxError = 'error' in taxSummary;
    const taxResult = hasTaxError ? null : (taxSummary as TaxCalculationResult);

    const getProofStatus = (): 'valid' | 'expired' | 'missing' => {
        if (!taxSettings.rent_proof_document) return 'missing';
        if (!taxSettings.rent_proof_expiry) return 'valid';
        return new Date(taxSettings.rent_proof_expiry) > new Date()
            ? 'valid'
            : 'expired';
    };

    const proofStatus = getProofStatus();

    const estimatedRentRelief = taxSettings.annual_rent_paid
        ? Math.min(500000, taxSettings.annual_rent_paid * 0.2)
        : 0;

    return (
        <>
            <Head title={`${employee.name} - Tax Settings`} />

            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    startIcon={<ArrowLeft className="h-4 w-4" />}
                    onClick={() => router.visit(`/staff/${employee.id}`)}
                    className="mb-4"
                >
                    Back to Employee
                </Button>

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Tax Settings
                            </h1>
                            {taxLawLabel && (
                                <Badge
                                    color={isNTA2025 ? 'info' : 'light'}
                                    size="md"
                                >
                                    {taxLawLabel}
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Configure tax settings for {employee.name}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Form
                        action={update.url({ user: employee.id })}
                        method="put"
                    >
                        {({ errors, processing }) => (
                            <>
                                <Card className="p-6">
                                    <div className="mb-6 flex items-center gap-3">
                                        <div className="rounded-lg bg-brand-100 p-3 dark:bg-brand-900/20">
                                            <Receipt className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Tax Identification
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Employee tax identification
                                                details
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="tax_id_number">
                                                Tax ID Number (TIN)
                                            </Label>
                                            <Input
                                                id="tax_id_number"
                                                name="tax_id_number"
                                                type="text"
                                                defaultValue={
                                                    taxSettings.tax_id_number ||
                                                    ''
                                                }
                                                placeholder="Enter TIN"
                                                error={!!errors.tax_id_number}
                                            />
                                            <InputError
                                                message={errors.tax_id_number}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="tax_state">
                                                Tax State
                                            </Label>
                                            <Input
                                                id="tax_state"
                                                name="tax_state"
                                                type="text"
                                                defaultValue={
                                                    taxSettings.tax_state || ''
                                                }
                                                placeholder="e.g., Lagos"
                                                error={!!errors.tax_state}
                                            />
                                            <InputError
                                                message={errors.tax_state}
                                            />
                                        </div>
                                    </div>
                                </Card>

                                <Card className="mt-6 p-6">
                                    <div className="mb-6 flex items-center gap-3">
                                        <div className="rounded-lg bg-warning-100 p-3 dark:bg-warning-900/20">
                                            <ShieldCheck className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Tax Exemption
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Configure tax exemption status
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="flex items-center gap-3">
                                            {!isTaxExempt && <input type="hidden" name="is_tax_exempt" value="0" />}
                                            <input
                                                type="checkbox"
                                                name="is_tax_exempt"
                                                value="1"
                                                checked={isTaxExempt}
                                                onChange={(e) =>
                                                    setIsTaxExempt(
                                                        e.target.checked,
                                                    )
                                                }
                                                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                            />
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                Employee is tax exempt
                                            </span>
                                        </label>

                                        {isTaxExempt && (
                                            <div className="ml-7 grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <Label htmlFor="exemption_reason">
                                                        Reason
                                                    </Label>
                                                    <Input
                                                        id="exemption_reason"
                                                        name="exemption_reason"
                                                        type="text"
                                                        defaultValue={
                                                            taxSettings.exemption_reason ||
                                                            ''
                                                        }
                                                        placeholder="Enter exemption reason"
                                                        error={
                                                            !!errors.exemption_reason
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.exemption_reason
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="exemption_expires_at">
                                                        Expires
                                                    </Label>
                                                    <Input
                                                        id="exemption_expires_at"
                                                        name="exemption_expires_at"
                                                        type="date"
                                                        defaultValue={
                                                            taxSettings.exemption_expires_at?.split(
                                                                'T',
                                                            )[0] || ''
                                                        }
                                                        error={
                                                            !!errors.exemption_expires_at
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.exemption_expires_at
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {isNTA2025 && (
                                    <Card className="mt-6 p-6">
                                        <div className="mb-6 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-info-100 dark:bg-info-900/20 rounded-lg p-3">
                                                    <Home className="text-info-600 dark:text-info-400 h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        Housing Status (NTA
                                                        2025)
                                                    </h2>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Rent relief eligibility
                                                        under NTA 2025
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge color="info" size="sm">
                                                <Info className="mr-1 h-3 w-3" />
                                                NTA 2025
                                            </Badge>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <label
                                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                                                        !isHomeowner
                                                            ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/20'
                                                            : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="is_homeowner"
                                                        value="0"
                                                        checked={!isHomeowner}
                                                        onChange={() =>
                                                            setIsHomeowner(
                                                                false,
                                                            )
                                                        }
                                                        className="h-4 w-4 border-gray-300 text-brand-600 focus:ring-brand-500"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                                        <div>
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                Renter
                                                            </span>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Eligible for
                                                                rent relief
                                                            </p>
                                                        </div>
                                                    </div>
                                                </label>

                                                <label
                                                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                                                        isHomeowner
                                                            ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/20'
                                                            : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="is_homeowner"
                                                        value="1"
                                                        checked={isHomeowner}
                                                        onChange={() =>
                                                            setIsHomeowner(true)
                                                        }
                                                        className="h-4 w-4 border-gray-300 text-brand-600 focus:ring-brand-500"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Home className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                                        <div>
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                Homeowner
                                                            </span>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Not eligible for
                                                                rent relief
                                                            </p>
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>

                                            {!isHomeowner && (
                                                <div className="mt-4 space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                                                    <div>
                                                        <Label htmlFor="annual_rent_paid">
                                                            Annual Rent Paid (₦)
                                                        </Label>
                                                        <Input
                                                            id="annual_rent_paid"
                                                            name="annual_rent_paid"
                                                            type="number"
                                                            min="0"
                                                            step="1000"
                                                            defaultValue={
                                                                taxSettings.annual_rent_paid ||
                                                                ''
                                                            }
                                                            placeholder="e.g., 1200000"
                                                            error={
                                                                !!errors.annual_rent_paid
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.annual_rent_paid
                                                            }
                                                        />
                                                        {taxSettings.annual_rent_paid && (
                                                            <p className="mt-1 text-sm text-success-600 dark:text-success-400">
                                                                Estimated
                                                                relief:{' '}
                                                                {formatCurrency(
                                                                    estimatedRentRelief,
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <Label>
                                                            Rent Proof Document
                                                        </Label>
                                                        {taxSettings.rent_proof_document ? (
                                                            <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                                                <div className="flex items-center gap-2">
                                                                    {proofStatus ===
                                                                    'valid' ? (
                                                                        <CheckCircle className="h-5 w-5 text-success-500" />
                                                                    ) : proofStatus ===
                                                                      'expired' ? (
                                                                        <AlertCircle className="h-5 w-5 text-error-500" />
                                                                    ) : (
                                                                        <AlertCircle className="h-5 w-5 text-warning-500" />
                                                                    )}
                                                                    <div>
                                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            Document
                                                                            uploaded
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                            Expires:{' '}
                                                                            {formatDate(
                                                                                taxSettings.rent_proof_expiry,
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        color={
                                                                            proofStatus ===
                                                                            'valid'
                                                                                ? 'success'
                                                                                : proofStatus ===
                                                                                    'expired'
                                                                                  ? 'error'
                                                                                  : 'warning'
                                                                        }
                                                                        size="sm"
                                                                    >
                                                                        {proofStatus ===
                                                                        'valid'
                                                                            ? 'Valid'
                                                                            : proofStatus ===
                                                                                'expired'
                                                                              ? 'Expired'
                                                                              : 'Missing'}
                                                                    </Badge>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={
                                                                            handleDeleteRentProof
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-error-500" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-2">
                                                                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-brand-500 dark:border-gray-600 dark:hover:border-brand-400">
                                                                    <Upload className="h-5 w-5 text-gray-400" />
                                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                        {uploading
                                                                            ? 'Uploading...'
                                                                            : 'Upload rent receipt (PDF, JPG, PNG)'}
                                                                    </span>
                                                                    <input
                                                                        type="file"
                                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                                        onChange={
                                                                            handleRentProofUpload
                                                                        }
                                                                        disabled={
                                                                            uploading
                                                                        }
                                                                        className="hidden"
                                                                    />
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                )}

                                {taxResult?.is_low_income_exempt && (
                                    <Card className="mt-6 border-success-200 bg-success-50 p-6 dark:border-success-800 dark:bg-success-900/20">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
                                            <div>
                                                <h3 className="font-semibold text-success-800 dark:text-success-200">
                                                    Tax Exempt - Low Income
                                                </h3>
                                                <p className="text-sm text-success-600 dark:text-success-400">
                                                    Annual income ≤ ₦800,000 is
                                                    exempt under NTA 2025
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {availableReliefs.length > 0 && (
                                    <Card className="mt-6 p-6">
                                        <div className="mb-6 flex items-center gap-3">
                                            <div className="rounded-lg bg-success-100 p-3 dark:bg-success-900/20">
                                                <Calculator className="h-6 w-6 text-success-600 dark:text-success-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    Active Tax Reliefs
                                                </h2>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Select applicable tax
                                                    reliefs for this employee
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {selectedReliefs.length === 0 && <input type="hidden" name="active_reliefs" value="" />}
                                            {availableReliefs.map((relief) => (
                                                <label
                                                    key={relief.code}
                                                    className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="active_reliefs[]"
                                                        value={relief.code}
                                                        checked={selectedReliefs.includes(
                                                            relief.code,
                                                        )}
                                                        onChange={() =>
                                                            handleReliefToggle(
                                                                relief.code,
                                                            )
                                                        }
                                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                {relief.name}
                                                            </span>
                                                            <Badge
                                                                color="info"
                                                                size="sm"
                                                            >
                                                                {relief.rate
                                                                    ? `${relief.rate}%`
                                                                    : relief.amount
                                                                      ? formatCurrency(
                                                                            relief.amount,
                                                                        )
                                                                      : relief.relief_type}
                                                            </Badge>
                                                        </div>
                                                        {relief.description && (
                                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                {
                                                                    relief.description
                                                                }
                                                            </p>
                                                        )}
                                                        {relief.requires_proof && (
                                                            <p className="mt-1 text-xs text-warning-600 dark:text-warning-400">
                                                                Requires proof
                                                                documentation
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                <div className="mt-6 flex justify-end">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={processing}
                                        loading={processing}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                            Tax Summary
                        </h3>
                        {hasTaxError ? (
                            <div className="rounded-lg bg-error-50 p-4 dark:bg-error-900/20">
                                <p className="text-sm text-error-600 dark:text-error-400">
                                    {(taxSummary as { error: string }).error}
                                </p>
                            </div>
                        ) : taxResult ? (
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Annual Tax
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(taxResult.annual_tax)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Monthly Tax
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(taxResult.tax)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Total Reliefs
                                    </span>
                                    <span className="font-medium text-success-600 dark:text-success-400">
                                        -
                                        {formatCurrency(
                                            taxResult.total_reliefs,
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Taxable Income
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(
                                            taxResult.taxable_income,
                                        )}
                                    </span>
                                </div>
                                {taxResult.is_exempt && (
                                    <div className="mt-2 flex justify-center">
                                        <Badge color="success" size="md">
                                            Tax Exempt
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No tax calculation available
                            </p>
                        )}
                    </Card>

                    {taxResult?.reliefs_applied &&
                        taxResult.reliefs_applied.length > 0 && (
                            <Card className="p-6">
                                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                                    Reliefs Applied
                                </h3>
                                <div className="space-y-2">
                                    {taxResult.reliefs_applied.map(
                                        (
                                            relief: AppliedRelief,
                                            idx: number,
                                        ) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between text-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-600 dark:text-gray-300">
                                                        {relief.name}
                                                    </span>
                                                    {relief.proof_status && (
                                                        <Badge
                                                            color={
                                                                relief.proof_status ===
                                                                'valid'
                                                                    ? 'success'
                                                                    : relief.proof_status ===
                                                                        'expired'
                                                                      ? 'error'
                                                                      : 'warning'
                                                            }
                                                            size="sm"
                                                        >
                                                            {
                                                                relief.proof_status
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="font-medium text-success-600 dark:text-success-400">
                                                    {formatCurrency(
                                                        relief.amount,
                                                    )}
                                                </span>
                                            </div>
                                        ),
                                    )}
                                    <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
                                        <div className="flex justify-between font-semibold">
                                            <span className="text-gray-900 dark:text-white">
                                                Total
                                            </span>
                                            <span className="text-success-600 dark:text-success-400">
                                                {formatCurrency(
                                                    taxResult.total_reliefs,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                    {isNTA2025 && (
                        <Card className="border-info-200 bg-info-50 dark:border-info-800 dark:bg-info-900/20 p-6">
                            <div className="mb-3 flex items-center gap-2">
                                <Info className="text-info-600 dark:text-info-400 h-5 w-5" />
                                <h3 className="text-info-800 dark:text-info-200 font-semibold">
                                    NTA 2025 Changes
                                </h3>
                            </div>
                            <ul className="text-info-700 dark:text-info-300 space-y-2 text-sm">
                                <li>• CRA is abolished</li>
                                <li>• Income ≤ ₦800K is tax-exempt</li>
                                <li>• New rent relief available</li>
                                <li>• Top rate increased to 25%</li>
                            </ul>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}

TaxSettings.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
