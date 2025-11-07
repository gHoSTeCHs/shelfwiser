export const PERMISSIONS = [
    'manage_tenant',
    'manage_stores',
    'manage_users',
    'view_all_reports',
    'manage_inventory',
    'manage_products',
    'process_orders',
    'manage_customers',
    'manage_settings',
] as const;

export type Permission = typeof PERMISSIONS[number];

