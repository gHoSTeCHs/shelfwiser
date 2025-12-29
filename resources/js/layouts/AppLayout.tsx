import { UserRoleProvider } from '@/context/UserRoleContext.tsx';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import React from 'react';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import Backdrop from './Backdrop';
import FlashMessage from '@/components/FlashMessage.tsx';
import { ErrorBoundary, ErrorFallbackMinimal } from '@/components/error';

interface LayoutContentProps {
    children: React.ReactNode;
}

/**
 * Page-level error fallback that fits within the layout
 */
const PageErrorFallback: React.FC<{
    error: Error;
    errorInfo: import('@/types/error').ErrorInfo;
    resetError: () => void;
    isResetting?: boolean;
}> = ({ error, errorInfo, resetError, isResetting }) => {
    return (
        <div className="flex items-center justify-center min-h-[50vh] p-4">
            <div className="w-full max-w-lg">
                <ErrorFallbackMinimal
                    error={error}
                    errorInfo={errorInfo}
                    resetError={resetError}
                    isResetting={isResetting}
                    className="shadow-theme-md"
                />
            </div>
        </div>
    );
};

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
                <FlashMessage />
                <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6 ">
                    <UserRoleProvider userRole={auth.user.role}>
                        <ErrorBoundary
                            fallback={PageErrorFallback}
                            onError={(error, errorInfo) => {
                                // Log page-level errors
                                if (import.meta.env.DEV) {
                                    console.error('[AppLayout] Page error:', error);
                                }
                            }}
                            onReset={() => {
                                // Optionally refresh data on reset
                                if (import.meta.env.DEV) {
                                    console.info('[AppLayout] Error boundary reset');
                                }
                            }}
                        >
                            {children}
                        </ErrorBoundary>
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
