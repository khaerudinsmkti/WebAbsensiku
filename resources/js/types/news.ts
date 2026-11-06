export interface NewsCategory {
    id: number;
    name: string;
    slug: string;
    color: string;
    description?: string | null;
    news_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface NewsAttachment {
    path: string;
    name: string;
    size: number;
    url?: string;
    formatted_size?: string | null;
}

export interface NewsItem {
    id: number;
    title: string;
    slug: string;
    category_id?: number | null;
    user_id?: number | null;
    excerpt?: string | null;
    content: string;
    image_path?: string | null;
    image_url?: string | null;
    images?: string[] | null;
    images_urls?: string[];
    attachment_path?: string | null;
    attachment_name?: string | null;
    attachment_size?: number | null;
    attachment_url?: string | null;
    attachments?: NewsAttachment[] | null;
    attachments_data?: NewsAttachment[];
    formatted_attachment_size?: string | null;
    instagram_url?: string | null;
    instagram_embed_url?: string | null;
    is_published: boolean;
    published_at?: string | null;
    formatted_date?: string;
    views_count?: number;
    created_at?: string;
    updated_at?: string;
    category?: NewsCategory | null;
    author?: {
        id: number;
        name: string;
        role?: string;
    } | null;
}

