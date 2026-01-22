import SupplierProfileController from '@/actions/App/Http/Controllers/SupplierProfileController.ts';
import Input from '@/components/form/input/InputField';
import InputError from '@/components/form/InputError';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AppLayout from '@/layouts/AppLayout';
import { ConnectionApprovalMode, SupplierProfile } from '@/types/supplier';
import { Form, Head, router } from '@inertiajs/react';
import { Building2, CheckCircle2, Info, Settings, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    profile: SupplierProfile;
    isSupplier: boolean;
}

const approvalModeOptions: { value: ConnectionApprovalMode; label: string }[] =
    [
        { value: 'auto', label: 'Auto-approve all connections' },
        { value: 'owner', label: 'Require Owner approval' },
        { value: 'general_manager', label: 'Require General Manager approval' },
        {
            value: 'assistant_manager',
            label: 'Require Assistant Manager approval',
        },
    ];

export default function Index({ profile, isSupplier }: Props) {
    const [businessRegistration, setBusinessRegistration] = useState<string>(
        profile?.business_registration || '',
    );
    const [taxId, setTaxId] = useState<string>(profile?.tax_id || '');
    const [paymentTerms, setPaymentTerms] = useState<string>(
        profile?.payment_terms || 'Net 30',
    );
    const [leadTimeDays, setLeadTimeDays] = useState<number>(
        profile?.lead_time_days || 7,
    );
    const [minimumOrderValue, setMinimumOrderValue] = useState<number>(
        profile?.minimum_order_value || 0,
    );
    const [connectionApprovalMode, setConnectionApprovalMode] =
        useState<ConnectionApprovalMode>(
            profile?.connection_approval_mode || 'owner',
        );
    const [showDisableConfirm, setShowDisableConfirm] = useState(false);
    const [isDisabling, setIsDisabling] = useState(false);

    const handleDisable = () => {
        setIsDisabling(true);
        router.post(
            SupplierProfileController.disable.url(),
            {},
            {
                onFinish: () => {
                    setIsDisabling(false);
                    setShowDisableConfirm(false);
                },
            },
        );
    };

    if (!isSupplier) {
        return (
            <>
                <Head title="Supplier Profile" />

                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Supplier Profile
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Enable supplier mode to sell to other businesses
                        </p>
                    </div>

                    <Card className="p-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <Building2 className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600" />
                            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                                Become a Supplier
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Enable supplier mode to create a catalog and
                                sell your products to other businesses on the
                                ShelfWiser network.
                            </p>

                            <Form
                                action={SupplierProfileController.enable()}
                                method="post"
                                className="mt-8 space-y-6 text-left"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="business_registration">
                                                    Business Registration
                                                </Label>
                                                <Input
                                                    id="business_registration"
                                                    name="business_registration"
                                                    value={businessRegistration}
                                                    onChange={(e) =>
                                                        setBusinessRegistration(
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={
                                                        !!errors.business_registration
                                                    }
                                                    placeholder="e.g., REG123456"
                                                />
                                                <InputError
                                                    message={
                                                        errors.business_registration
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="tax_id">
                                                    Tax ID
                                                </Label>
                                                <Input
                                                    id="tax_id"
                                                    name="tax_id"
                                                    value={taxId}
                                                    onChange={(e) =>
                                                        setTaxId(e.target.value)
                                                    }
                                                    error={!!errors.tax_id}
                                                    placeholder="e.g., TAX-123-456"
                                                />
                                                <InputError
                                                    message={errors.tax_id}
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="payment_terms">
                                                    Payment Terms
                                                </Label>
                                                <Input
                                                    id="payment_terms"
                                                    name="payment_terms"
                                                    value={paymentTerms}
                                                    onChange={(e) =>
                                                        setPaymentTerms(
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={
                                                        !!errors.payment_terms
                                                    }
                                                    placeholder="e.g., Net 30, Net 60"
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors.payment_terms
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="lead_time_days">
                                                    Default Lead Time (days)
                                                </Label>
                                                <Input
                                                    id="lead_time_days"
                                                    name="lead_time_days"
                                                    type="number"
                                                    min="1"
                                                    value={leadTimeDays.toString()}
                                                    onChange={(e) =>
                                                        setLeadTimeDays(
                                                            parseInt(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    error={
                                                        !!errors.lead_time_days
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.lead_time_days
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="minimum_order_value">
                                                    Minimum Order Value
                                                </Label>
                                                <Input
                                                    id="minimum_order_value"
                                                    name="minimum_order_value"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={minimumOrderValue.toString()}
                                                    onChange={(e) =>
                                                        setMinimumOrderValue(
                                                            parseFloat(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    error={
                                                        !!errors.minimum_order_value
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.minimum_order_value
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="approval_mode">
                                                    Connection Approval Mode
                                                </Label>
                                                <Select
                                                    options={
                                                        approvalModeOptions
                                                    }
                                                    value={
                                                        connectionApprovalMode
                                                    }
                                                    onChange={(value) =>
                                                        setConnectionApprovalMode(
                                                            value as ConnectionApprovalMode,
                                                        )
                                                    }
                                                />
                                                <input
                                                    type="hidden"
                                                    name="connection_approval_mode"
                                                    value={
                                                        connectionApprovalMode
                                                    }
                                                />
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <Info className="mr-1 inline h-4 w-4" />
                                                    Choose who can approve
                                                    connection requests from
                                                    buyers
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full"
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            {processing
                                                ? 'Enabling...'
                                                : 'Enable Supplier Mode'}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </div>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Supplier Profile" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Supplier Profile
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Manage your supplier settings and configuration
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Badge
                            color={profile?.is_enabled ? 'success' : 'primary'}
                        >
                            {profile?.is_enabled ? (
                                <>
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Active
                                </>
                            ) : (
                                <>
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Inactive
                                </>
                            )}
                        </Badge>
                    </div>
                </div>

                <Card className="p-6">
                    <Form
                        action={SupplierProfileController.update({
                            id: profile.id,
                        })}
                        method="put"
                        className="space-y-6"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div>
                                    <h3 className="flex items-center text-lg font-semibold text-gray-900 dark:text-white">
                                        <Settings className="mr-2 h-5 w-5" />
                                        Supplier Configuration
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Update your supplier profile information
                                    </p>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="business_registration">
                                            Business Registration
                                        </Label>
                                        <Input
                                            id="business_registration"
                                            name="business_registration"
                                            value={businessRegistration}
                                            onChange={(e) =>
                                                setBusinessRegistration(
                                                    e.target.value,
                                                )
                                            }
                                            error={
                                                !!errors.business_registration
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors.business_registration
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="tax_id">Tax ID</Label>
                                        <Input
                                            id="tax_id"
                                            name="tax_id"
                                            value={taxId}
                                            onChange={(e) =>
                                                setTaxId(e.target.value)
                                            }
                                            error={!!errors.tax_id}
                                        />
                                        <InputError message={errors.tax_id} />
                                    </div>

                                    <div>
                                        <Label htmlFor="payment_terms">
                                            Payment Terms
                                        </Label>
                                        <Input
                                            id="payment_terms"
                                            name="payment_terms"
                                            value={paymentTerms}
                                            onChange={(e) =>
                                                setPaymentTerms(e.target.value)
                                            }
                                            error={!!errors.payment_terms}
                                            required
                                        />
                                        <InputError
                                            message={errors.payment_terms}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="lead_time_days">
                                            Default Lead Time (days)
                                        </Label>
                                        <Input
                                            id="lead_time_days"
                                            name="lead_time_days"
                                            type="number"
                                            min="1"
                                            value={leadTimeDays.toString()}
                                            onChange={(e) =>
                                                setLeadTimeDays(
                                                    parseInt(e.target.value),
                                                )
                                            }
                                            error={!!errors.lead_time_days}
                                        />
                                        <InputError
                                            message={errors.lead_time_days}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="minimum_order_value">
                                            Minimum Order Value
                                        </Label>
                                        <Input
                                            id="minimum_order_value"
                                            name="minimum_order_value"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={minimumOrderValue.toString()}
                                            onChange={(e) =>
                                                setMinimumOrderValue(
                                                    parseFloat(e.target.value),
                                                )
                                            }
                                            error={!!errors.minimum_order_value}
                                        />
                                        <InputError
                                            message={errors.minimum_order_value}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="approval_mode">
                                            Connection Approval Mode
                                        </Label>
                                        <Select
                                            options={approvalModeOptions}
                                            value={connectionApprovalMode}
                                            onChange={(value) =>
                                                setConnectionApprovalMode(
                                                    value as ConnectionApprovalMode,
                                                )
                                            }
                                        />
                                        <input
                                            type="hidden"
                                            name="connection_approval_mode"
                                            value={connectionApprovalMode}
                                        />
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            <Info className="mr-1 inline h-4 w-4" />
                                            Who can approve buyer connection
                                            requests
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between border-t pt-6 dark:border-gray-700">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setShowDisableConfirm(true)
                                        }
                                        disabled={processing || isDisabling}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Disable Supplier Mode
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        {processing
                                            ? 'Saving...'
                                            : 'Save Changes'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card>
            </div>

            <ConfirmDialog
                isOpen={showDisableConfirm}
                onClose={() => setShowDisableConfirm(false)}
                onConfirm={handleDisable}
                title="Disable Supplier Mode"
                message="Are you sure you want to disable supplier mode? This will affect your active connections and buyers will no longer be able to place orders."
                confirmLabel="Disable"
                variant="warning"
                isLoading={isDisabling}
            />
        </>
    );
}

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
