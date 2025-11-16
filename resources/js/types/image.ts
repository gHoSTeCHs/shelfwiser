export interface Image {
    id: number;
    tenant_id: number;
    imageable_type: string;
    imageable_id: number;
    filename: string;
    path: string;
    disk: string;
    mime_type: string | null;
    size: number | null;
    width: number | null;
    height: number | null;
    alt_text: string | null;
    title: string | null;
    caption: string | null;
    is_primary: boolean;
    sort_order: number;
    metadata: Record<string, any> | null;
    created_at: string;
    updated_at: string;
    url?: string;
}
