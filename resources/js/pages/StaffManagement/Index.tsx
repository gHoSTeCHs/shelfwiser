import AppLayout from '@/layouts/AppLayout.tsx';
import { Head } from '@inertiajs/react';
import React from 'react';
import { useUserRoleContext } from '@/context/UserRoleContext.tsx';

const StaffManagement = () => {
    const { role } = useUserRoleContext();

    return (
        <div className="h-screen">
            <Head title="User Management" />

            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                    <div className="p-6 text-gray-900 dark:text-gray-100">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                User Management
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Manage team members and their roles
                            </p>
                        </div>

                        <h3>{role?.label}</h3>
                        <p>{role?.description}</p>
                        {/*<UserList*/}
                        {/*    users={users}*/}
                        {/*    roles={roles}*/}
                        {/*    shops={shops}*/}
                        {/*    onToggleStatus={handleToggleStatus}*/}
                        {/*    onUpdateUser={handleUpdateUser}*/}
                        {/*    onAssignRole={handleAssignRole}*/}
                        {/*    createUserForm={createUserForm}*/}
                        {/*/>*/}
                    </div>
                </div>
            </div>
        </div>
    );
};

StaffManagement.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);

export default StaffManagement;
