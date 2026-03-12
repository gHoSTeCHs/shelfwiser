import '../../../resources/css/app.css';

const root = document.getElementById('storefront-root');

if (root) {
    const pageData = JSON.parse(root.dataset.page || '{}');
    console.log('Storefront loaded', pageData);
}
