import React from 'react';
import type { NewsItem } from '@/types/news';
import type { GalleryItem } from '@/pages/gallery';

export function WhatsAppIcon({ className = 'size-4' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
    );
}

/**
 * Builds formatted text message for WhatsApp sharing of a news item.
 */
export function buildNewsWhatsAppMessage(news: NewsItem): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const slug = news.slug || news.id;
    const shareUrl = `${origin}/berita?read=${encodeURIComponent(slug)}`;

    // Clean html tags from content for excerpt
    const plainText = (news.content || '')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const excerpt = news.excerpt || (plainText.length > 150 ? plainText.slice(0, 150) + '...' : plainText);

    const categoryText = news.category?.name ? `🏷️ Kategori: ${news.category.name}` : '';
    const dateText = news.formatted_date ? `📅 Tanggal: ${news.formatted_date}` : '';

    const lines = [
        `📢 *${news.title}*`,
        [categoryText, dateText].filter(Boolean).join(' • '),
        '',
        excerpt,
        '',
        `🔗 *Baca selengkapnya di web resmi sekolah:*`,
        shareUrl,
    ];

    return lines.filter((l) => l !== null && l !== undefined).join('\n');
}

/**
 * Builds formatted text message for WhatsApp sharing of a gallery item.
 */
export function buildGalleryWhatsAppMessage(gallery: GalleryItem): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const slug = (gallery as any).slug || (gallery.title ? `${gallery.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${gallery.id}` : gallery.id);
    const shareUrl = `${origin}/galeri?view=${encodeURIComponent(slug)}`;

    const categoryText = gallery.category ? `🏷️ Kategori: ${gallery.category}` : '';
    const dateText = gallery.formatted_date ? `📅 Tanggal: ${gallery.formatted_date}` : '';
    const description = gallery.description ? gallery.description.trim() : '';

    const lines = [
        `📸 *Galeri Kegiatan Sekolah: ${gallery.title}*`,
        [categoryText, dateText].filter(Boolean).join(' • '),
        '',
        description || 'Dokumentasi foto kegiatan sekolah.',
        '',
        `✨ *Lihat album foto selengkapnya:*`,
        shareUrl,
    ];

    return lines.filter((l) => l !== null && l !== undefined).join('\n');
}

/**
 * Directly trigger WhatsApp share for News
 */
export function shareNewsToWhatsApp(news: NewsItem) {
    const message = buildNewsWhatsAppMessage(news);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Directly trigger WhatsApp share for Gallery
 */
export function shareGalleryToWhatsApp(gallery: GalleryItem) {
    const message = buildGalleryWhatsAppMessage(gallery);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}

export interface WhatsAppShareButtonProps {
    type: 'news' | 'gallery';
    item: NewsItem | GalleryItem;
    variant?: 'button' | 'icon' | 'badge';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    label?: string;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export function WhatsAppShareButton({
    type,
    item,
    variant = 'button',
    size = 'sm',
    label,
    className = '',
    onClick,
}: WhatsAppShareButtonProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) onClick(e);

        if (type === 'news') {
            shareNewsToWhatsApp(item as NewsItem);
        } else {
            shareGalleryToWhatsApp(item as GalleryItem);
        }
    };

    if (variant === 'icon') {
        const sizeClasses = {
            xs: 'size-7',
            sm: 'size-8',
            md: 'size-9',
            lg: 'size-10',
        }[size];

        const iconSizes = {
            xs: 'size-3.5',
            sm: 'size-4',
            md: 'size-4.5',
            lg: 'size-5',
        }[size];

        return (
            <button
                type="button"
                onClick={handleClick}
                title="Bagikan ke WhatsApp Group"
                aria-label="Bagikan ke WhatsApp Group"
                className={`group flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/25 active:scale-90 transition-all duration-150 ${sizeClasses} ${className}`}
            >
                <WhatsAppIcon className={`${iconSizes} transition-transform group-hover:scale-110`} />
            </button>
        );
    }

    if (variant === 'badge') {
        return (
            <button
                type="button"
                onClick={handleClick}
                title="Bagikan ke WhatsApp Group"
                className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-950 dark:text-emerald-300 px-3 py-1 text-xs font-bold border border-emerald-200/80 dark:border-emerald-800 transition-colors ${className}`}
            >
                <WhatsAppIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{label || 'Share WA'}</span>
            </button>
        );
    }

    // Default: 'button'
    const sizeClasses = {
        xs: 'px-2.5 py-1 text-[11px] gap-1.5 rounded-lg',
        sm: 'px-3.5 py-1.5 text-xs gap-2 rounded-xl',
        md: 'px-4 py-2 text-xs sm:text-sm gap-2 rounded-xl',
        lg: 'px-5 py-2.5 text-sm gap-2.5 rounded-2xl',
    }[size];

    const iconSizes = {
        xs: 'size-3.5',
        sm: 'size-4',
        md: 'size-4.5',
        lg: 'size-5',
    }[size];

    return (
        <button
            type="button"
            onClick={handleClick}
            title="Bagikan info ini langsung ke grup WhatsApp"
            className={`group inline-flex items-center justify-center font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all duration-150 ${sizeClasses} ${className}`}
        >
            <WhatsAppIcon className={`${iconSizes} transition-transform group-hover:scale-110`} />
            <span>{label || 'Bagikan ke WhatsApp'}</span>
        </button>
    );
}

export default WhatsAppShareButton;
