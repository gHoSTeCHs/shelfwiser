import { useUserRole } from '@/hooks/useUserRole';
import { UserRoleValue } from '@/types/user-role';
import { createContext, ReactNode, useContext } from 'react';

const UserRoleContext = createContext<ReturnType<typeof useUserRole> | null>(
    null,
);

export function UserRoleProvider({
    children,
    userRole,
}: {
    children: ReactNode;
    userRole: UserRoleValue;
}) {
    const roleData = useUserRole(userRole);

    return (
        <UserRoleContext.Provider value={roleData}>
            {children}
        </UserRoleContext.Provider>
    );
}

export function useUserRoleContext() {
    const context = useContext(UserRoleContext);
    if (!context) {
        throw new Error(
            'useUserRoleContext must be used within UserRoleProvider',
        );
    }
    return context;
}
