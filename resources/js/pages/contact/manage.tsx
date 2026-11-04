import { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    Clock,
    Eye,
    Globe,
    Instagram,
    Mail,
    MailCheck,
    MailOpen,
    MapPin,
    MessageSquare,
    MessageSquareText,
    Phone,
    PhoneCall,
    Save,
    Search,
    Send,
    Sparkles,
    Trash2,
    Video,
    Youtube,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

interface ContactSettingsData {
    name: string;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    postal_code?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    youtube?: string | null;
    tiktok?: string | null;
    operating_hours?: string | null;
    maps_embed_url?: string | null;
    contact_description?: string | null;
    contact_active: boolean;
}

interface ContactMessageItem {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    subject?: string | null;
    message: string;
    is_read: boolean;
    read_at?: string | null;
    created_at: string;
}

interface PaginatedMessages {
    data: ContactMessageItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url?: string | null;
    next_page_url?: string | null;
}

interface ContactManageProps {
    settings: ContactSettingsData;
    messages: PaginatedMessages;
    unreadCount: number;
    totalCount: number;
    filters: {
        search: string;
        status: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kontak Kami',
        href: '/manage/contact',
    },
];

export default function ContactManage({ settings, messages, unreadCount, totalCount, filters }: ContactManageProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [activeTab, setActiveTab] = useState<'settings' | 'messages'>('messages');
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    // Form Pengaturan Kontak
    const settingsForm = useForm({
        phone: settings.phone || '',
        whatsapp: settings.whatsapp || '',
        email: settings.email || '',
        address: settings.address || '',
        city: settings.city || '',
        postal_code: settings.postal_code || '',
        instagram: settings.instagram || '',
        facebook: settings.facebook || '',
        youtube: settings.youtube || '',
        tiktok: settings.tiktok || '',
        operating_hours: settings.operating_hours || '',
        maps_embed_url: settings.maps_embed_url || '',
        contact_description: settings.contact_description || '',
        contact_active: settings.contact_active ?? true,
    });

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        settingsForm.post('/manage/contact/settings', {
            preserveScroll: true,
        });
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/manage/contact',
            {
                search: search || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleStatusTab = (newStatus: string) => {
        setStatusFilter(newStatus);
        router.get(
            '/manage/contact',
            {
                search: search || undefined,
                status: newStatus !== 'all' ? newStatus : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const toggleMarkAsRead = (messageId: number) => {
        router.patch(`/manage/contact/messages/${messageId}/read`, {}, {
            preserveScroll: true,
        });
    };

    const handleDeleteMessage = (messageId: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus pesan ini?')) {
            router.delete(`/manage/contact/messages/${messageId}`, {
                preserveScroll: true,
            });
        }
    };

    // Format WA link
    const formatWaUrl = (rawPhone?: string | null, name?: string) => {
        if (!rawPhone) return '#';
        let clean = rawPhone.replace(/\D/g, '');
        if (clean.startsWith('0')) {
            clean = '62' + clean.slice(1);
        }
        const text = encodeURIComponent(`Halo ${name || ''}, terima kasih telah menghubungi pihak sekolah.`);
        return `https://wa.me/${clean}?text=${text}`;
    };

    return (
        <>
            <Head title="Kelola Kontak Kami & Pesan Masuk" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200">
                        <CheckCircle2 className="size-5 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200">
                        <AlertCircle className="size-5 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B35] shadow-xs dark:bg-orange-950 dark:text-[#FFA07A]">
                            <PhoneCall className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                                Kontak Kami & Pesan Pengunjung
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Kelola kontak informasi resmi sekolah serta kotak masuk pesan dari masyarakat dan orang tua.
                            </p>
                        </div>
                    </div>

                    <a
                        href="/#kontak"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-[#FF6B35] transition-colors shadow-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                        <Eye className="size-4" />
                        <span>Lihat di Halaman Publik</span>
                    </a>
                </div>

                {/* Tab Switcher */}
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('messages')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                            activeTab === 'messages'
                                ? 'bg-[#FF6B35] text-white shadow-md shadow-orange-500/20'
                                : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                        <MessageSquareText className="size-4" />
                        <span>Kotak Masuk Pesan</span>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-black text-[#FF6B35]">
                                {unreadCount} baru
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('settings')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                            activeTab === 'settings'
                                ? 'bg-[#FF6B35] text-white shadow-md shadow-orange-500/20'
                                : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                        <Building2 className="size-4" />
                        <span>Pengaturan Info Kontak Sekolah</span>
                    </button>
                </div>

                {/* TAB 1: KOTAK MASUK PESAN */}
                {activeTab === 'messages' && (
                    <div className="space-y-4">
                        {/* Filter Bar */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-[#18122B]">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handleStatusTab('all')}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                        statusFilter === 'all'
                                            ? 'bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]'
                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    Semua ({totalCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusTab('unread')}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                        statusFilter === 'unread'
                                            ? 'bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]'
                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    Belum Dibaca ({unreadCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusTab('read')}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                        statusFilter === 'read'
                                            ? 'bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]'
                                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    Sudah Dibaca ({totalCount - unreadCount})
                                </button>
                            </div>

                            <form onSubmit={handleFilterSubmit} className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari pengirim / subjek..."
                                        className="h-8.5 w-48 sm:w-64 rounded-xl border border-gray-200 bg-gray-50 pl-8.5 pr-3 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                                <Button type="submit" size="sm" variant="outline" className="h-8.5 text-xs font-bold rounded-xl">
                                    Cari
                                </Button>
                            </form>
                        </div>

                        {/* List Messages */}
                        {messages.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-[#18122B]">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B35] dark:bg-orange-950/60">
                                    <MessageSquare className="size-7" />
                                </div>
                                <h3 className="mt-4 text-sm font-black text-gray-900 dark:text-white">
                                    Belum ada pesan masuk
                                </h3>
                                <p className="mt-1 text-xs text-gray-500 max-w-sm dark:text-gray-400">
                                    Pesan atau pertanyaan yang dikirimkan oleh pengunjung melalui formulir "Kontak Kami" di website publik akan otomatis tampil di sini.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {messages.data.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`rounded-2xl border p-5 transition-all ${
                                            !msg.is_read
                                                ? 'border-orange-300 bg-orange-50/30 shadow-xs dark:border-orange-900/60 dark:bg-orange-950/20'
                                                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-[#18122B]'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    {!msg.is_read ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6B35] px-2 py-0.5 text-[10px] font-black text-white">
                                                            <Sparkles className="size-3" />
                                                            Pesan Baru
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                            <MailOpen className="size-3" />
                                                            Sudah Dibaca
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] text-gray-400">
                                                        {new Date(msg.created_at).toLocaleString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>

                                                <h3 className="mt-2 text-base font-black text-gray-900 dark:text-white">
                                                    {msg.name}
                                                </h3>

                                                {msg.subject && (
                                                    <p className="text-xs font-bold text-[#FF6B35] mt-0.5">
                                                        Subjek: {msg.subject}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                {msg.phone && (
                                                    <a
                                                        href={formatWaUrl(msg.phone, msg.name)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                    >
                                                        <Phone className="size-3.5" />
                                                        <span>Balas WA ({msg.phone})</span>
                                                    </a>
                                                )}

                                                {msg.email && (
                                                    <a
                                                        href={`mailto:${msg.email}?subject=Balasan: ${encodeURIComponent(msg.subject || 'Pesan dari Kontak Sekolah')}`}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                                                    >
                                                        <Mail className="size-3.5" />
                                                        <span>Email ({msg.email})</span>
                                                    </a>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => toggleMarkAsRead(msg.id)}
                                                    title={msg.is_read ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}
                                                    className="inline-flex size-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-[#FF6B35] transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                >
                                                    {msg.is_read ? <Mail className="size-4" /> : <MailCheck className="size-4" />}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    title="Hapus pesan"
                                                    className="inline-flex size-8 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition-colors dark:border-rose-900 dark:bg-gray-800 dark:text-rose-400"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-3 rounded-xl bg-gray-50/70 p-3.5 dark:bg-gray-800/40">
                                            <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed dark:text-gray-200">
                                                {msg.message}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Pagination */}
                                {messages.last_page > 1 && (
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                                        <span className="text-xs text-gray-500">
                                            Halaman {messages.current_page} dari {messages.last_page} ({messages.total} total pesan)
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {messages.prev_page_url && (
                                                <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold">
                                                    <Link href={messages.prev_page_url}>&larr; Sebelumnya</Link>
                                                </Button>
                                            )}
                                            {messages.next_page_url && (
                                                <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold">
                                                    <Link href={messages.next_page_url}>Selanjutnya &rarr;</Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: PENGATURAN INFORMASI KONTAK */}
                {activeTab === 'settings' && (
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                        {/* Toggle Status Aktif */}
                        <div className="flex items-center justify-between rounded-3xl border border-orange-100 bg-orange-50/60 p-5 dark:border-orange-900/40 dark:bg-orange-950/20">
                            <div>
                                <span className="text-sm font-extrabold text-gray-900 dark:text-white block">
                                    Tampilkan Section Kontak Kami di Halaman Publik
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                                    Jika diaktifkan, informasi kontak dan formulir pertanyaan akan tampil di bagian bawah halaman beranda utama.
                                </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settingsForm.data.contact_active}
                                    onChange={(e) => settingsForm.setData('contact_active', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B35] dark:bg-gray-700"></div>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Card: Saluran Kontak Utama */}
                            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-[#18122B] space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                                    <Phone className="size-4 text-[#FF6B35]" />
                                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                                        Saluran Komunikasi Utama
                                    </h3>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        Nomor WhatsApp Resmi
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.data.whatsapp}
                                        onChange={(e) => settingsForm.setData('whatsapp', e.target.value)}
                                        placeholder="Contoh: 081234567890"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <span className="text-[11px] text-gray-400 mt-1 block">
                                        Pengunjung dapat langsung mengklik tombol chat WA dari halaman publik.
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        Nomor Telepon Kantor
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.data.phone}
                                        onChange={(e) => settingsForm.setData('phone', e.target.value)}
                                        placeholder="Contoh: (021) 7890123"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        Alamat Email Resmi
                                    </label>
                                    <input
                                        type="email"
                                        value={settingsForm.data.email}
                                        onChange={(e) => settingsForm.setData('email', e.target.value)}
                                        placeholder="Contoh: info@sekolah.sch.id"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        Jam Operasional Layanan
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.data.operating_hours}
                                        onChange={(e) => settingsForm.setData('operating_hours', e.target.value)}
                                        placeholder="Contoh: Senin - Jumat, 07:00 - 15:00 WIB"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        Teks Pengantar Kontak Kami
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={settingsForm.data.contact_description}
                                        onChange={(e) => settingsForm.setData('contact_description', e.target.value)}
                                        placeholder="Pesan ramah yang menyapa pengunjung..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Card: Alamat & Media Sosial */}
                            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-[#18122B] space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                                    <MapPin className="size-4 text-[#FF6B35]" />
                                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                                        Lokasi & Media Sosial
                                    </h3>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        Alamat Lengkap Sekolah
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.data.address}
                                        onChange={(e) => settingsForm.setData('address', e.target.value)}
                                        placeholder="Nama jalan, nomor gedung, dsb."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                            Kota / Kabupaten
                                        </label>
                                        <input
                                            type="text"
                                            value={settingsForm.data.city}
                                            onChange={(e) => settingsForm.setData('city', e.target.value)}
                                            placeholder="Contoh: Jakarta Selatan"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                            Kode Pos
                                        </label>
                                        <input
                                            type="text"
                                            value={settingsForm.data.postal_code}
                                            onChange={(e) => settingsForm.setData('postal_code', e.target.value)}
                                            placeholder="Contoh: 12150"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        URL Embed Google Maps (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={settingsForm.data.maps_embed_url}
                                        onChange={(e) => settingsForm.setData('maps_embed_url', e.target.value)}
                                        placeholder="https://www.google.com/maps/embed?..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <span className="text-[11px] text-gray-400 mt-1 block">
                                        Bisa diisi link src embed dari menu Bagikan &rarr; Sematkan Peta pada Google Maps.
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                            Instagram
                                        </label>
                                        <input
                                            type="text"
                                            value={settingsForm.data.instagram}
                                            onChange={(e) => settingsForm.setData('instagram', e.target.value)}
                                            placeholder="@username_sekolah"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                            Facebook
                                        </label>
                                        <input
                                            type="text"
                                            value={settingsForm.data.facebook}
                                            onChange={(e) => settingsForm.setData('facebook', e.target.value)}
                                            placeholder="Nama Fanpage / Akun"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                            YouTube
                                        </label>
                                        <input
                                            type="text"
                                            value={settingsForm.data.youtube}
                                            onChange={(e) => settingsForm.setData('youtube', e.target.value)}
                                            placeholder="Nama Channel"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                            TikTok
                                        </label>
                                        <input
                                            type="text"
                                            value={settingsForm.data.tiktok}
                                            onChange={(e) => settingsForm.setData('tiktok', e.target.value)}
                                            placeholder="@akun_tiktok"
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                size="lg"
                                disabled={settingsForm.processing}
                                className="rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#E85D26] px-8 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/25 hover:from-[#E85D26] hover:to-[#D94F1A]"
                            >
                                <Save className="mr-2 size-4" />
                                {settingsForm.processing ? 'Menyimpan...' : 'Simpan Informasi Kontak'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
}

ContactManage.layout = {
    breadcrumbs,
};

