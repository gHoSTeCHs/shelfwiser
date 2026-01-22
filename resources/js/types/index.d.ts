import { UserRoleValue } from '@/types/user-role.ts';
import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    first_name: string;
    last_name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    avatar?: string;
    role: UserRoleValue;
    is_tenant_owner: boolean;
    is_super_admin: boolean;
    is_active: boolean;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export type SchemaPropertyType =
    | 'string'
    | 'integer'
    | 'number'
    | 'boolean'
    | 'array'
    | 'object';
export type SchemaPropertyValue =
    | string
    | number
    | boolean
    | null
    | string[]
    | number[];

export interface SchemaProperty {
    type: SchemaPropertyType;
    title?: string;
    default?: SchemaPropertyValue;
    enum?: SchemaPropertyValue[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    items?: {
        type?: string;
        enum?: SchemaPropertyValue[];
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}
