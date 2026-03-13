let csrfToken = '';

export function initCsrfToken(token: string) {
    csrfToken = token;
}

interface FetchOptions extends RequestInit {
    json?: Record<string, unknown>;
}

interface FetchResult<T = unknown> {
    ok: boolean;
    status: number;
    data: T;
    errors?: Record<string, string[]>;
}

export async function storefrontFetch<T = unknown>(
    url: string,
    options: FetchOptions = {},
): Promise<FetchResult<T>> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-CSRF-TOKEN': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
        ...((options.headers as Record<string, string>) || {}),
    };

    if (options.json) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.json);
        delete options.json;
    }

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin',
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 419) {
        window.location.reload();
        return { ok: false, status: 419, data: data as T };
    }

    return {
        ok: response.ok,
        status: response.status,
        data: data as T,
        errors: response.status === 422 ? data.errors : undefined,
    };
}
