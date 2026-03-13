const ALLOWED_TAGS = new Set([
    'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'cite', 'code',
    'col', 'colgroup', 'dd', 'del', 'details', 'div', 'dl', 'dt',
    'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'hr', 'i', 'img', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'picture',
    'pre', 'q', 's', 'samp', 'small', 'source', 'span', 'strong', 'sub',
    'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead',
    'time', 'tr', 'u', 'ul', 'var', 'wbr',
]);

const ALLOWED_ATTRIBUTES = new Set([
    'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
    'width', 'height', 'colspan', 'rowspan', 'start', 'reversed',
    'type', 'loading', 'decoding', 'srcset', 'sizes',
]);

const DANGEROUS_URL_PATTERN = /^\s*(javascript|data|vbscript):/i;

export function sanitizeHtml(html: string): string {
    if (typeof window === 'undefined' || !html) {
        return '';
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    sanitizeNode(doc.body);

    return doc.body.innerHTML;
}

function sanitizeNode(node: Node): void {
    const children = Array.from(node.childNodes);

    for (const child of children) {
        if (child.nodeType === Node.TEXT_NODE) {
            continue;
        }

        if (child.nodeType === Node.COMMENT_NODE) {
            node.removeChild(child);
            continue;
        }

        if (child.nodeType !== Node.ELEMENT_NODE) {
            node.removeChild(child);
            continue;
        }

        const el = child as Element;
        const tagName = el.tagName.toLowerCase();

        if (!ALLOWED_TAGS.has(tagName)) {
            const fragment = document.createDocumentFragment();
            while (el.firstChild) {
                fragment.appendChild(el.firstChild);
            }
            node.replaceChild(fragment, el);
            sanitizeNode(node);
            return;
        }

        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
            const name = attr.name.toLowerCase();
            if (!ALLOWED_ATTRIBUTES.has(name) || name.startsWith('on')) {
                el.removeAttribute(attr.name);
                continue;
            }
            if ((name === 'href' || name === 'src') && DANGEROUS_URL_PATTERN.test(attr.value)) {
                el.removeAttribute(attr.name);
            }
        }

        if (tagName === 'a') {
            el.setAttribute('rel', 'noopener noreferrer');
        }

        sanitizeNode(el);
    }
}
