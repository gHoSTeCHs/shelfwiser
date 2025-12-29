import type { FC } from 'react';
import { Building2, Phone } from 'lucide-react';
import CollapsibleSection from '@/components/ui/CollapsibleSection';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import Combobox from '@/components/form/Combobox';
import InputError from '@/components/form/InputError';
import type { CreateStaffFormData } from '@/types/staff';
import { NIGERIAN_BANKS } from '@/types/staff';

interface BankingSectionProps {
    data: CreateStaffFormData;
    errors: Record<string, string>;
    onChange: <K extends keyof CreateStaffFormData>(
        field: K,
        value: CreateStaffFormData[K],
    ) => void;
}

const BankingSection: FC<BankingSectionProps> = ({ data, errors, onChange }) => {
    const bankOptions = NIGERIAN_BANKS.map((bank) => ({
        value: bank,
        label: bank,
    }));

    return (
        <CollapsibleSection
            title="Banking & Emergency Contact"
            description="Payment details and emergency information"
            icon={Building2}
            defaultOpen={false}
        >
            <div className="space-y-6">
                <div>
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                        <Building2 className="h-4 w-4" />
                        Bank Account Details
                    </h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Label htmlFor="bank_name" optional>
                                Bank Name
                            </Label>
                            <Combobox
                                id="bank_name"
                                name="bank_name"
                                value={data.bank_name}
                                onChange={(value) => onChange('bank_name', value)}
                                options={bankOptions}
                                placeholder="Select or enter bank"
                                allowCustom
                                error={!!errors.bank_name}
                            />
                            <InputError message={errors.bank_name} />
                        </div>

                        <div>
                            <Label htmlFor="bank_account_number" optional>
                                Account Number
                            </Label>
                            <Input
                                id="bank_account_number"
                                name="bank_account_number"
                                type="text"
                                value={data.bank_account_number}
                                onChange={(e) =>
                                    onChange('bank_account_number', e.target.value)
                                }
                                error={!!errors.bank_account_number}
                                placeholder="10-digit account number"
                            />
                            <InputError message={errors.bank_account_number} />
                        </div>

                        <div>
                            <Label htmlFor="routing_number" optional>
                                Sort Code / Routing Number
                            </Label>
                            <Input
                                id="routing_number"
                                name="routing_number"
                                type="text"
                                value={data.routing_number}
                                onChange={(e) =>
                                    onChange('routing_number', e.target.value)
                                }
                                error={!!errors.routing_number}
                                placeholder="Optional"
                            />
                            <InputError message={errors.routing_number} />
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                        <Phone className="h-4 w-4" />
                        Emergency Contact
                    </h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="emergency_contact_name" optional>
                                Contact Name
                            </Label>
                            <Input
                                id="emergency_contact_name"
                                name="emergency_contact_name"
                                type="text"
                                value={data.emergency_contact_name}
                                onChange={(e) =>
                                    onChange('emergency_contact_name', e.target.value)
                                }
                                error={!!errors.emergency_contact_name}
                                placeholder="Full name"
                            />
                            <InputError message={errors.emergency_contact_name} />
                        </div>

                        <div>
                            <Label htmlFor="emergency_contact_phone" optional>
                                Contact Phone
                            </Label>
                            <Input
                                id="emergency_contact_phone"
                                name="emergency_contact_phone"
                                type="tel"
                                value={data.emergency_contact_phone}
                                onChange={(e) =>
                                    onChange('emergency_contact_phone', e.target.value)
                                }
                                error={!!errors.emergency_contact_phone}
                                placeholder="08012345678"
                            />
                            <InputError message={errors.emergency_contact_phone} />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        <strong>Privacy:</strong> Banking details are encrypted and only
                        visible to authorized payroll administrators.
                    </p>
                </div>
            </div>
        </CollapsibleSection>
    );
};

export default BankingSection;
