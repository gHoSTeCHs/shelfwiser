import DashboardController from '@/actions/App/Http/Controllers/DashboardController';
import { router } from '@inertiajs/react';

const useGoBack = () => {
    return () => {
        if (window.history.state && window.history.length > 1) {
            router.visit(
                window.history.state.url || DashboardController.index.url(),
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
            window.history.back();
        } else {
            router.visit(DashboardController.index.url());
        }
    };
};

export default useGoBack;
