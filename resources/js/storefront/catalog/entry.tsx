import { createRoot } from 'react-dom/client';
import { CatalogApp } from './CatalogApp';

const rootEl = document.getElementById('catalog-root');
if (rootEl) {
    createRoot(rootEl).render(<CatalogApp />);
}
