import { createRoot } from 'react-dom/client';
import { StorefrontRenderer } from './StorefrontRenderer';
import { initCsrfToken } from './lib/fetch-client';
import type { StorefrontPageData } from './types/storefront';

declare global {
    interface Window {
        __STOREFRONT_PAGE__: StorefrontPageData;
    }
}

const rootEl = document.getElementById('storefront-root');
if (rootEl) {
    const pageData: StorefrontPageData = window.__STOREFRONT_PAGE__;
    initCsrfToken(pageData.csrfToken);
    createRoot(rootEl).render(<StorefrontRenderer {...pageData} />);
}
