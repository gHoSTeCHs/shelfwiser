import AppLayout from '@/layouts/AppLayout';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import UserAddressCard from '../components/UserProfile/UserAddressCard';
import UserInfoCard from '../components/UserProfile/UserInfoCard';
import UserMetaCard from '../components/UserProfile/UserMetaCard';

export default function UserProfiles() {
    return (
        <>
            <PageBreadcrumb pageTitle="Profile" />
            <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="mb-5 text-lg font-semibold text-gray-800 lg:mb-7 dark:text-white/90">
                    Profile
                </h3>
                <div className="space-y-6">
                    <UserMetaCard />
                    <UserInfoCard />
                    <UserAddressCard />
                </div>
            </div>
        </>
    );
}
UserProfiles.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
