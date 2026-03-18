export interface ApiResult<T = unknown> {
    ok: boolean;
    status: number;
    data: T;
    errors?: Record<string, string[]>;
}

function getCsrfToken(): string {
    for (const part of document.cookie.split(';')) {
        const trimmed = part.trim();
        if (trimmed.startsWith('XSRF-TOKEN=')) {
            return decodeURIComponent(trimmed.substring('XSRF-TOKEN='.length));
        }
    }
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? ''
    );
}

export async function callApi<T = unknown>(
    routeDef: { url: string; method: string },
    body?: unknown,
): Promise<ApiResult<T>> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': getCsrfToken(),
    };

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    let response: Response;

    try {
        response = await fetch(routeDef.url, {
            method: routeDef.method.toUpperCase(),
            headers,
            credentials: 'same-origin',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        return { ok: false, status: 0, data: {} as T };
    }

    if (response.status === 419) {
        window.location.reload();
        return { ok: false, status: 419, data: {} as T };
    }

    const data = await response.json().catch(() => ({}));

    return {
        ok: response.ok,
        status: response.status,
        data: data as T,
        errors: response.status === 422 ? data.errors : undefined,
    };
}
