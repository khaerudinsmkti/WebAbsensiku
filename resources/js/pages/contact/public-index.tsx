import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    CheckCircle2,
    Clock,
    Facebook,
    Instagram,
    Mail,
    MapPin,
    PartyPopper,
    Phone,
    PhoneCall,
    RotateCcw,
    Send,
    Sparkles,
    Youtube,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/public-header';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';

interface ContactInfoProp {
    name?: string;
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
    is_active?: boolean;
}

interface PublicContactProps {
    contactInfo: ContactInfoProp;
}

export default function PublicContactIndex({ contactInfo }: PublicContactProps) {
    const { auth, school, flash } = usePage<{ auth: any; school?: { name?: string }; flash?: { contact_success?: string; success?: string } }>().props;
    const schoolName = school?.name || 'AbsensiKu SD';
    const canManageContact = auth?.user?.role === 'publisher' || auth?.user?.role === 'admin' || auth?.user?.role === 'principal';

    const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
    const successMsg = flash?.contact_success || flash?.success || (isSubmittedSuccess ? 'Terima kasih! Pesan Anda telah berhasil dikirim. Tim sekolah akan segera menghubungi Anda.' : null);

    const contactForm = useForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const handleSendContact = (e: React.FormEvent) => {
        e.preventDefault();
        contactForm.post('/kontak/kirim', {
            preserveScroll: true,
            onSuccess: () => {
                contactForm.reset();
                setIsSubmittedSuccess(true);
                toast.success('Pesan Anda berhasil dikirim!', {
                    description: 'Terima kasih telah menghubungi kami. Tim sekolah kami akan segera merespons.',
                    duration: 5000,
                });
            },
        });
    };

    return (
        <>
            <Head title="Kontak Kami" />

            <div className="flex min-h-screen flex-col bg-page-gradient text-[#1F2937] dark:text-neutral-100">
                <PublicHeader />

                <main className="flex-1 px-4 py-8 sm:px-6 lg:px-12">
                    <div className="mx-auto max-w-6xl space-y-8">
                        {/* Title Header */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B35] dark:border-orange-900 dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                    <PhoneCall className="size-3.5" />
                                    Saluran Komunikasi Resmi
                                </div>
                                <h1 className="mt-2 text-2xl font-black text-[#111827] sm:text-3xl dark:text-white">
                                    Hubungi Kami
                                </h1>
                                <p className="mt-1 text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                                    {contactInfo.contact_description || 'Punya pertanyaan seputar proses pendaftaran, kegiatan belajar mengajar, atau kunjungan sekolah? Kami siap melayani Anda dengan hangat.'}
                                </p>
                            </div>

                            {canManageContact && (
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl border-dashed border-[#FF6B35]/50 bg-white/70 text-xs font-bold text-[#FF6B35] hover:bg-orange-50 hover:border-[#FF6B35] dark:bg-gray-800/80"
                                >
                                    <Link href="/manage/contact">
                                        <PhoneCall className="mr-1.5 size-3.5" />
                                        Kelola Kontak & Kotak Masuk
                                    </Link>
                                </Button>
                            )}
                        </div>

                        {/* Content Grid: Info Kontak (Kiri) & Form Pesan (Kanan) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left: Info Kontak */}
                            <div className="lg:col-span-5 space-y-5">
                                <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-white via-orange-50/30 to-amber-50/20 p-6 sm:p-7 shadow-md dark:border-gray-800 dark:from-[#18122B]/90 dark:via-[#1e1738]/80 dark:to-[#18122B]/90 space-y-4">
                                    <h2 className="text-base font-black text-gray-900 dark:text-white border-b border-orange-100/80 pb-3 dark:border-gray-800">
                                        Informasi Layanan & Lokasi
                                    </h2>

                                    {contactInfo.address && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                                <MapPin className="size-4.5" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-gray-900 dark:text-white">
                                                    Alamat Sekolah
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                                                    {contactInfo.address}
                                                    {contactInfo.city && `, ${contactInfo.city}`}
                                                    {contactInfo.postal_code && ` ${contactInfo.postal_code}`}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {contactInfo.whatsapp && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                                                <Phone className="size-4.5" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-gray-900 dark:text-white">
                                                    WhatsApp Layanan
                                                </div>
                                                <a
                                                    href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '').startsWith('0') ? '62' + contactInfo.whatsapp.replace(/\D/g, '').slice(1) : contactInfo.whatsapp.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs font-extrabold text-emerald-600 hover:underline dark:text-emerald-400 mt-0.5 block"
                                                >
                                                    {contactInfo.whatsapp} &rarr; Chat Langsung via WA
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {contactInfo.phone && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                                                <PhoneCall className="size-4.5" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-gray-900 dark:text-white">
                                                    Telepon Kantor
                                                </div>
                                                <a
                                                    href={`tel:${contactInfo.phone}`}
                                                    className="text-xs font-semibold text-gray-700 hover:text-[#FF6B35] dark:text-gray-300 mt-0.5 block"
                                                >
                                                    {contactInfo.phone}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {contactInfo.email && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                                                <Mail className="size-4.5" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-gray-900 dark:text-white">
                                                    Email Resmi
                                                </div>
                                                <a
                                                    href={`mailto:${contactInfo.email}`}
                                                    className="text-xs font-semibold text-gray-700 hover:text-[#FF6B35] dark:text-gray-300 mt-0.5 block"
                                                >
                                                    {contactInfo.email}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {contactInfo.operating_hours && (
                                        <div className="flex items-start gap-3">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                                                <Clock className="size-4.5" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-gray-900 dark:text-white">
                                                    Jam Operasional
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                                    {contactInfo.operating_hours}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Social Media Links */}
                                    {(contactInfo.instagram || contactInfo.facebook || contactInfo.youtube || contactInfo.tiktok) && (
                                        <div className="pt-3 border-t border-orange-100 dark:border-gray-800">
                                            <span className="text-[11px] font-bold text-gray-400 block mb-2 uppercase">
                                                Media Sosial Resmi
                                            </span>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {contactInfo.instagram && (
                                                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-pink-50 px-2.5 py-1 text-xs font-bold text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
                                                        <Instagram className="size-3.5" />
                                                        <span>{contactInfo.instagram}</span>
                                                    </div>
                                                )}
                                                {contactInfo.facebook && (
                                                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                                        <Facebook className="size-3.5" />
                                                        <span>{contactInfo.facebook}</span>
                                                    </div>
                                                )}
                                                {contactInfo.youtube && (
                                                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                                                        <Youtube className="size-3.5" />
                                                        <span>{contactInfo.youtube}</span>
                                                    </div>
                                                )}
                                                {contactInfo.tiktok && (
                                                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                                        <span>TikTok: {contactInfo.tiktok}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Google Maps Embed */}
                                {contactInfo.maps_embed_url && (
                                    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                        <iframe
                                            src={contactInfo.maps_embed_url}
                                            title="Lokasi Sekolah"
                                            className="w-full h-56 rounded-2xl border-0"
                                            loading="lazy"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Right: Formulir Kirim Pesan */}
                            <div className="lg:col-span-7">
                                <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm dark:border-gray-800 dark:bg-[#18122B]">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-[#FFA07A]">
                                            <Send className="size-4.5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-black text-gray-900 dark:text-white">
                                                Formulir Pesan & Aspirasi
                                            </h2>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Silakan isi formulir berikut. Tim sekolah kami akan segera merespons pertanyaan Anda.
                                            </p>
                                        </div>
                                    </div>

                                    {successMsg && (
                                        <div className="mb-6 overflow-hidden rounded-2xl border-2 border-emerald-300 bg-emerald-50/90 p-5 shadow-lg shadow-emerald-500/10 dark:border-emerald-700/80 dark:bg-emerald-950/60 animate-in fade-in zoom-in-95 duration-300">
                                            <div className="flex items-start gap-3.5">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                                                    <CheckCircle2 className="size-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-100">
                                                            Pesan Anda Berhasil Terkirim!
                                                        </h3>
                                                        <Sparkles className="size-4 text-emerald-500 animate-pulse" />
                                                    </div>
                                                    <p className="mt-1 text-xs font-medium text-emerald-800 dark:text-emerald-200/90 leading-relaxed">
                                                        {successMsg}
                                                    </p>
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsSubmittedSuccess(false)}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 px-3 py-1 text-[11px] font-bold text-emerald-800 transition dark:bg-emerald-500/20 dark:text-emerald-200"
                                                        >
                                                            <RotateCcw className="size-3" />
                                                            Kirim Pesan Lain
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={handleSendContact} className="space-y-4.5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                                Nama Lengkap <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={contactForm.data.name}
                                                onChange={(e) => contactForm.setData('name', e.target.value)}
                                                placeholder="Contoh: Budi Santoso"
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            />
                                            {contactForm.errors.name && (
                                                <p className="mt-1 text-xs text-rose-500">{contactForm.errors.name}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                                    Nomor WhatsApp / HP
                                                </label>
                                                <input
                                                    type="text"
                                                    value={contactForm.data.phone}
                                                    onChange={(e) => contactForm.setData('phone', e.target.value)}
                                                    placeholder="Contoh: 081234567890"
                                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                                />
                                                {contactForm.errors.phone && (
                                                    <p className="mt-1 text-xs text-rose-500">{contactForm.errors.phone}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                                    Alamat Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={contactForm.data.email}
                                                    onChange={(e) => contactForm.setData('email', e.target.value)}
                                                    placeholder="nama@email.com"
                                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                                />
                                                {contactForm.errors.email && (
                                                    <p className="mt-1 text-xs text-rose-500">{contactForm.errors.email}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                                Subjek / Topik
                                            </label>
                                            <input
                                                type="text"
                                                value={contactForm.data.subject}
                                                onChange={(e) => contactForm.setData('subject', e.target.value)}
                                                placeholder="Contoh: Informasi Pendaftaran Siswa Baru / Jam Sekolah"
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                                Isi Pesan / Pertanyaan <span className="text-rose-500">*</span>
                                            </label>
                                            <textarea
                                                rows={5}
                                                required
                                                value={contactForm.data.message}
                                                onChange={(e) => contactForm.setData('message', e.target.value)}
                                                placeholder="Tuliskan pertanyaan atau pesan Anda secara jelas di sini..."
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            />
                                            {contactForm.errors.message && (
                                                <p className="mt-1 text-xs text-rose-500">{contactForm.errors.message}</p>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={contactForm.processing}
                                            className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E85D26] px-8 py-3 text-xs font-black text-white shadow-md shadow-orange-500/20 hover:from-[#E85D26] hover:to-[#D94F1A]"
                                        >
                                            <Send className="mr-1.5 size-3.5" />
                                            {contactForm.processing ? 'Mengirim...' : 'Kirim Pesan Sekarang'}
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-[#E8E8E8] bg-white/70 py-6 mb-16 md:mb-0 text-center text-xs text-[#6B7280] backdrop-blur-md dark:border-[#2D234A] dark:bg-[#18122B]/70 dark:text-[#9CA3AF]">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
                        <div>
                            &copy; {new Date().getFullYear()} {schoolName}. All rights reserved.
                        </div>
                    </div>
                </footer>

                <PwaInstallPrompt />
            </div>
        </>
    );
}

