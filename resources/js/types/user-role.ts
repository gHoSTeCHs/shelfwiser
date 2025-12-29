export type UserRoleValue =
    | 'super_admin'
    | 'owner'
    | 'general_manager'
    | 'store_manager'
    | 'assistant_manager'
    | 'sales_rep'
    | 'cashier'
    | 'inventory_clerk';

export interface UserRole {
    value: UserRoleValue;
    label: string;
    description: string;
    level: number;
    permissions: string[];
}

export function isValidUserRole(role: string): role is UserRoleValue {
    return [
        'super_admin',
        'owner',
        'general_manager',
        'store_manager',
        'assistant_manager',
        'sales_rep',
        'cashier',
        'inventory_clerk'
    ].includes(role);
}
