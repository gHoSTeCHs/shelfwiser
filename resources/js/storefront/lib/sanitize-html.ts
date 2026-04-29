import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
    'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'cite', 'code',
    'col', 'colgroup', 'dd', 'del', 'details', 'div', 'dl', 'dt',
    'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'hr', 'i', 'img', 'ins', 'kbd', 'li', 'mark', 'ol', 'p', 'picture',
    'pre', 'q', 's', 'samp', 'small', 'source', 'span', 'strong', 'sub',
    'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead',
    'time', 'tr', 'u', 'ul', 'var', 'wbr',
];

const ALLOWED_ATTR = [
    'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
    'width', 'height', 'colspan', 'rowspan', 'start', 'reversed',
    'type', 'loading', 'decoding', 'srcset', 'sizes',
];

const DANGEROUS_URL_PATTERN = /^\s*(javascript|data|vbscript):/i;

export function sanitizeUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (DANGEROUS_URL_PATTERN.test(url)) return '';
    return url;
}

export function sanitizeHtml(html: string): string {
    if (typeof window === 'undefined' || !html) {
        return '';
    }

    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        FORBID_ATTR: ['style'],
        ADD_ATTR: ['target'],
        FORCE_BODY: false,
    });
}
