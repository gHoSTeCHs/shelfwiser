import '../../../resources/css/app.css';

declare global {
    interface Window {
        __STOREFRONT_PAGE__: Record<string, unknown>;
    }
}

const root = document.getElementById('storefront-root');

if (root) {
    const pageData = window.__STOREFRONT_PAGE__ ?? {};
    console.log('Storefront loaded', pageData);
}
