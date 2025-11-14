import Button from '@/components/ui/button/Button';
import { Card } from '@/components/ui/card';
import Badge from '@/components/ui/badge/Badge';
import AppLayout from '@/layouts/AppLayout';
import { SupplierProfile, ConnectionApprovalMode } from '@/types/supplier';
import { Head, useForm, router } from '@inertiajs/react';
import { Building2, CheckCircle2, Settings, XCircle, Info } from 'lucide-react';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import { FormEventHandler } from 'react';

interface Props {
    profile: SupplierProfile | null;
    isSupplier: boolean;
}

const approvalModeOptions: { value: ConnectionApprovalMode; label: string }[] = [
    { value: 'auto', label: 'Auto-approve all connections' },
    { value: 'owner', label: 'Require Owner approval' },
    { value: 'general_manager', label: 'Require General Manager approval' },
    { value: 'assistant_manager', label: 'Require Assistant Manager approval' },
];

export default function Index({ profile, isSupplier }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        business_registration: profile?.business_registration || '',
        tax_id: profile?.tax_id || '',
        payment_terms: profile?.payment_terms || 'Net 30',
        lead_time_days: profile?.lead_time_days || 7,
        minimum_order_value: profile?.minimum_order_value || 0,
        connection_approval_mode: profile?.connection_approval_mode || ('owner' as ConnectionApprovalMode),
    });

    const handleEnable: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('supplier.profile.enable'));
    };

    const handleUpdate: FormEventHandler = (e) => {
        e.preventDefault();
        if (profile) {
            put(route('supplier.profile.update', profile.id));
        }
    };

    const handleDisable = () => {
        if (confirm('Are you sure you want to disable supplier mode? This will affect your active connections.')) {
            router.post(route('supplier.profile.disable'));
        }
    };

    if (!isSupplier) {
        return (
            <AppLayout>
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
                                Enable supplier mode to create a catalog and sell your products to other businesses
                                on the ShelfWiser network.
                            </p>

                            <form onSubmit={handleEnable} className="mt-8 space-y-6 text-left">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="business_registration">
                                            Business Registration
                                        </Label>
                                        <Input
                                            id="business_registration"
                                            value={data.business_registration}
                                            onChange={(e) => setData('business_registration', e.target.value)}
                                            error={errors.business_registration}
                                            placeholder="e.g., REG123456"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="tax_id">Tax ID</Label>
                                        <Input
                                            id="tax_id"
                                            value={data.tax_id}
                                            onChange={(e) => setData('tax_id', e.target.value)}
                                            error={errors.tax_id}
                                            placeholder="e.g., TAX-123-456"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="payment_terms" required>
                                            Payment Terms
                                        </Label>
                                        <Input
                                            id="payment_terms"
                                            value={data.payment_terms}
                                            onChange={(e) => setData('payment_terms', e.target.value)}
                                            error={errors.payment_terms}
                                            placeholder="e.g., Net 30, Net 60"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="lead_time_days">
                                            Default Lead Time (days)
                                        </Label>
                                        <Input
                                            id="lead_time_days"
                                            type="number"
                                            min="1"
                                            value={data.lead_time_days.toString()}
                                            onChange={(e) => setData('lead_time_days', parseInt(e.target.value))}
                                            error={errors.lead_time_days}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="minimum_order_value">
                                            Minimum Order Value
                                        </Label>
                                        <Input
                                            id="minimum_order_value"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.minimum_order_value.toString()}
                                            onChange={(e) =>
                                                setData('minimum_order_value', parseFloat(e.target.value))
                                            }
                                            error={errors.minimum_order_value}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="approval_mode" required>
                                            Connection Approval Mode
                                        </Label>
                                        <Select
                                            options={approvalModeOptions}
                                            value={data.connection_approval_mode}
                                            onChange={(value) =>
                                                setData('connection_approval_mode', value as ConnectionApprovalMode)
                                            }
                                        />
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            <Info className="mr-1 inline h-4 w-4" />
                                            Choose who can approve connection requests from buyers
                                        </p>
                                    </div>
                                </div>

                                <Button type="submit" disabled={processing} className="w-full">
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Enable Supplier Mode
                                </Button>
                            </form>
                        </div>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
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
                        <Badge variant={profile?.is_enabled ? 'success' : 'secondary'}>
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
                    <form onSubmit={handleUpdate} className="space-y-6">
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
                                    value={data.business_registration}
                                    onChange={(e) => setData('business_registration', e.target.value)}
                                    error={errors.business_registration}
                                />
                            </div>

                            <div>
                                <Label htmlFor="tax_id">Tax ID</Label>
                                <Input
                                    id="tax_id"
                                    value={data.tax_id}
                                    onChange={(e) => setData('tax_id', e.target.value)}
                                    error={errors.tax_id}
                                />
                            </div>

                            <div>
                                <Label htmlFor="payment_terms" required>
                                    Payment Terms
                                </Label>
                                <Input
                                    id="payment_terms"
                                    value={data.payment_terms}
                                    onChange={(e) => setData('payment_terms', e.target.value)}
                                    error={errors.payment_terms}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="lead_time_days">
                                    Default Lead Time (days)
                                </Label>
                                <Input
                                    id="lead_time_days"
                                    type="number"
                                    min="1"
                                    value={data.lead_time_days.toString()}
                                    onChange={(e) => setData('lead_time_days', parseInt(e.target.value))}
                                    error={errors.lead_time_days}
                                />
                            </div>

                            <div>
                                <Label htmlFor="minimum_order_value">
                                    Minimum Order Value
                                </Label>
                                <Input
                                    id="minimum_order_value"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.minimum_order_value.toString()}
                                    onChange={(e) => setData('minimum_order_value', parseFloat(e.target.value))}
                                    error={errors.minimum_order_value}
                                />
                            </div>

                            <div>
                                <Label htmlFor="approval_mode" required>
                                    Connection Approval Mode
                                </Label>
                                <Select
                                    options={approvalModeOptions}
                                    value={data.connection_approval_mode}
                                    onChange={(value) =>
                                        setData('connection_approval_mode', value as ConnectionApprovalMode)
                                    }
                                />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    <Info className="mr-1 inline h-4 w-4" />
                                    Who can approve buyer connection requests
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between border-t pt-6 dark:border-gray-700">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDisable}
                                disabled={processing}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Disable Supplier Mode
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
