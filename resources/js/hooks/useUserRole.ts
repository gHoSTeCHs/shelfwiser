import { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { UserRole, UserRoleValue } from '@/types/user-role';

export function useUserRole(currentUserRole: UserRoleValue) {
    const page = usePage();

    const userRoles = useMemo<UserRole[]>(() => {
        return (page.props.userRoles as UserRole[]) || [];
    }, [page.props.userRoles]);

    const role = useMemo<UserRole | undefined>(() => {
        return userRoles.find(r => r.value === currentUserRole);
    }, [userRoles, currentUserRole]);

    const hasPermission = (permission: string): boolean => {
        return role?.permissions.includes(permission) ?? false;
    };

    const canAccessMultipleStores = useMemo(() => {
        return ['owner', 'general_manager'].includes(currentUserRole);
    }, [currentUserRole]);

    const isManagement = useMemo(() => {
        return ['owner', 'general_manager', 'store_manager', 'assistant_manager']
            .includes(currentUserRole);
    }, [currentUserRole]);

    return {
        role,
        hasPermission,
        canAccessMultipleStores,
        isManagement,
        level: role?.level ?? 0,
        allRoles: userRoles,
    };
}
