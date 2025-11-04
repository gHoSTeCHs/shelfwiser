import { router } from '@inertiajs/react';

const useGoBack = () => {
    return () => {
        if (window.history.state && window.history.length > 1) {
            router.visit(window.history.state.url || '/', {
                preserveState: true,
                preserveScroll: true,
            });
            window.history.back();
        } else {
            router.visit('/');
        }
    };
};

export default useGoBack;
