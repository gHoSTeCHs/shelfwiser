import { UserRoleProvider } from '@/context/UserRoleContext.tsx';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import React from 'react';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import Backdrop from './Backdrop';

interface LayoutContentProps {
    children: React.ReactNode;
}

const LayoutContent: React.FC<LayoutContentProps> = ({ children }) => {
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();
    const { auth } = usePage<SharedData>().props;

    return (
        <div className="min-h-screen xl:flex dark:bg-gray-900 dark:text-white">
            <div>
                <AppSidebar />
                <Backdrop />
            </div>
            <div
                className={`flex-1 transition-all duration-300 ease-in-out ${
                    isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]'
                } ${isMobileOpen ? 'ml-0' : ''}`}
            >
                <AppHeader />
                <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6 ">
                    <UserRoleProvider userRole={auth.user.role}>
                        {children}
                    </UserRoleProvider>
                </div>
            </div>
        </div>
    );
};

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    return (
        <SidebarProvider>
            <LayoutContent>{children}</LayoutContent>
        </SidebarProvider>
    );
};

export default AppLayout;
