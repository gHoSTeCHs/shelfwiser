<?php

namespace App\Enums;

enum UserRole: string
{
    case SUPER_ADMIN = 'super_admin';
    case OWNER = 'owner';
    case GENERAL_MANAGER = 'general_manager';
    case STORE_MANAGER = 'store_manager';
    case ASSISTANT_MANAGER = 'assistant_manager';
    case SALES_REP = 'sales_rep';
    case CASHIER = 'cashier';
    case INVENTORY_CLERK = 'inventory_clerk';

    public function label(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => 'Super Admin',
            self::OWNER => 'Owner',
            self::GENERAL_MANAGER => 'General Manager',
            self::STORE_MANAGER => 'Store Manager',
            self::ASSISTANT_MANAGER => 'Assistant Manager',
            self::SALES_REP => 'Sales Representative',
            self::CASHIER => 'Cashier',
            self::INVENTORY_CLERK => 'Inventory Clerk',
        };
    }

    /**
     * Get a brief description of the role's responsibilities.
     */
    public function description(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => 'Platform administrator with full system access. Manages all tenants, subscriptions, platform settings, and has complete visibility across the entire platform.',
            self::OWNER => 'Full system access. Manages tenant settings, all stores, users, billing, and has complete visibility across the entire organization.',
            self::GENERAL_MANAGER => 'Manages multiple stores, oversees store managers, handles cross-store reporting, inventory, and user management within the tenant.',
            self::STORE_MANAGER => 'Manages a single store location, including staff, inventory, products, orders, and customer relationships for that store.',
            self::ASSISTANT_MANAGER => 'Supports store manager with daily operations. Can manage inventory, process orders, and handle customer management tasks.',
            self::SALES_REP => 'Focuses on sales activities, customer acquisition, and order processing. Can view products and inventory to support sales efforts.',
            self::CASHIER => 'Processes customer sales transactions, handles basic customer inquiries, and has access to product information at checkout.',
            self::INVENTORY_CLERK => 'Manages stock levels, receives shipments, performs stock transfers, and maintains accurate inventory records for the store.',
        };
    }

    public function level(): int
    {
        return match ($this) {
            self::SUPER_ADMIN => 999,
            self::OWNER => 100,
            self::GENERAL_MANAGER => 80,
            self::STORE_MANAGER => 60,
            self::ASSISTANT_MANAGER => 50,
            self::SALES_REP => 40,
            self::CASHIER, self::INVENTORY_CLERK => 30,
        };
    }

    public function permissions(): array
    {
        return match ($this) {
            self::SUPER_ADMIN => [
                'platform_admin',
                'manage_all_tenants',
                'manage_subscriptions',
                'manage_platform_settings',
                'view_platform_analytics',
                'manage_api_access',
                'manage_marketplace',
                'impersonate_users',
                'manage_tenant',
                'manage_stores',
                'manage_users',
                'view_all_reports',
                'manage_inventory',
                'manage_products',
                'manage_orders',
                'process_orders',
                'manage_customers',
                'manage_settings',
                'view_financials',
                'view_profits',
                'view_costs',
                'manage_supplier_profile',
                'manage_supplier_catalog',
                'approve_supplier_connections',
                'manage_purchase_orders',
                'process_supplier_orders',
                'receive_stock',
                'view_supplier_analytics',
                'view_timesheets',
                'manage_timesheets',
                'approve_timesheets',
            ],
            self::OWNER => [
                'manage_tenant',
                'manage_stores',
                'manage_users',
                'view_reports',
                'view_all_reports',
                'manage_inventory',
                'manage_products',
                'manage_orders',
                'process_orders',
                'manage_customers',
                'manage_settings',
                'view_financials',
                'view_profits',
                'view_costs',
                'manage_supplier_profile',
                'manage_supplier_catalog',
                'approve_supplier_connections',
                'manage_purchase_orders',
                'process_supplier_orders',
                'receive_stock',
                'view_supplier_analytics',
                'view_timesheets',
                'manage_timesheets',
                'approve_timesheets',
            ],
            self::GENERAL_MANAGER => [
                'manage_stores',
                'manage_users',
                'view_reports',
                'manage_inventory',
                'manage_orders',
                'manage_products',
                'process_orders',
                'manage_customers',
                'view_financials',
                'view_profits',
                'view_costs',
                'manage_supplier_catalog',
                'approve_supplier_connections',
                'manage_purchase_orders',
                'process_supplier_orders',
                'receive_stock',
                'view_supplier_analytics',
                'view_timesheets',
                'manage_timesheets',
                'approve_timesheets',
            ],
            self::STORE_MANAGER => [
                'manage_store_users',
                'view_store_reports',
                'manage_store_inventory',
                'manage_products',
                'process_orders',
                'manage_customers',
                'manage_purchase_orders',
                'receive_stock',
                'view_timesheets',
                'manage_timesheets',
                'approve_timesheets',
            ],
            self::ASSISTANT_MANAGER => [
                'view_store_reports',
                'manage_store_inventory',
                'process_orders',
                'manage_customers',
                'approve_supplier_connections',
                'manage_purchase_orders',
                'receive_stock',
                'view_timesheets',
                'manage_timesheets',
                'approve_timesheets',
            ],
            self::SALES_REP => [
                'process_orders',
                'view_products',
                'manage_customers',
                'view_inventory',
                'view_timesheets',
                'manage_timesheets',
            ],
            self::CASHIER => [
                'process_sales',
                'view_products',
                'basic_customer_info',
                'view_timesheets',
                'manage_timesheets',
            ],
            self::INVENTORY_CLERK => [
                'manage_store_inventory',
                'view_products',
                'receive_stock',
                'stock_transfers',
                'view_purchase_orders',
                'view_timesheets',
                'manage_timesheets',
            ],
        };
    }

    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions());
    }

    public function canAccessMultipleStores(): bool
    {
        return match ($this) {
            self::SUPER_ADMIN, self::OWNER, self::GENERAL_MANAGER => true,
            default => false,
        };
    }

    /**
     * Check if this role is a super admin role.
     */
    public function isSuperAdmin(): bool
    {
        return $this === self::SUPER_ADMIN;
    }

    /**
     * Check if this role can manage the platform (super admin only).
     */
    public function canManagePlatform(): bool
    {
        return $this === self::SUPER_ADMIN;
    }

    /**
     * Get roles that have management capabilities within a tenant.
     */
    public static function managementRoles(): array
    {
        return [
            self::OWNER,
            self::GENERAL_MANAGER,
            self::STORE_MANAGER,
            self::ASSISTANT_MANAGER,
        ];
    }

    /**
     * Get roles available for tenant user selection (excludes super admin).
     */
    public static function forSelect(): array
    {
        return collect(self::cases())
            ->filter(fn($role) => $role !== self::SUPER_ADMIN)
            ->mapWithKeys(fn($role) => [$role->value => $role->label()])
            ->toArray();
    }

    /**
     * Get all roles including super admin (for platform admin use).
     */
    public static function allForSelect(): array
    {
        return collect(self::cases())
            ->mapWithKeys(fn($role) => [$role->value => $role->label()])
            ->toArray();
    }

    /**
     * Get tenant-scoped roles (all except super admin).
     */
    public static function tenantRoles(): array
    {
        return collect(self::cases())
            ->filter(fn($role) => $role !== self::SUPER_ADMIN)
            ->values()
            ->toArray();
    }
}
