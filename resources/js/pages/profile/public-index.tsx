import { Head, Link, usePage } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    Building2,
    CalendarDays,
    CheckCircle2,
    Compass,
    GraduationCap,
    HeartHandshake,
    Layers,
    MapPin,
    PhoneCall,
    Quote,
    School,
    ShieldCheck,
    Sparkles,
    Target,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicHeader } from '@/components/public-header';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';

interface ProfileData {
    name?: string;
    school_motto?: string | null;
    accreditation?: string | null;
    profile_description?: string | null;
    vision?: string | null;
    mission?: string | null;
    profile_image_url?: string | null;
    principal_name?: string | null;
    principal_nip?: string | null;
    principal_photo_url?: string | null;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    whatsapp?: string | null;
}

interface PublicProfileProps {
    profile: ProfileData;
}

export default function PublicProfileIndex({ profile }: PublicProfileProps) {
    const { auth, school } = usePage<{ auth: any; school?: { name?: string } }>().props;
    const schoolName = profile.name || school?.name || 'AbsensiKu SD';
    const canManageProfile = auth?.user?.role === 'publisher' || auth?.user?.role === 'admin' || auth?.user?.role === 'principal';

    // Parse missions into numbered items
    const missionList = profile.mission
        ? profile.mission
              .split('\n')
              .map((line) => line.replace(/^[\d+.-]\s*/, '').trim())
              .filter((line) => line.length > 0)
        : [];

    return (
        <>
            <Head title="Profil & Visi Misi" />

            <div className="flex min-h-screen flex-col bg-page-gradient text-[#1F2937] dark:text-neutral-100">
                <PublicHeader />

                <main className="flex-1 px-4 py-8 sm:px-6 lg:px-12 pb-24 md:pb-12">
                    <div className="mx-auto max-w-6xl space-y-12">
                        {/* Section 1: Hero Header Profil */}
                        <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-white via-orange-50/40 to-amber-50/30 p-6 sm:p-10 shadow-sm dark:border-gray-800 dark:from-[#18122B]/90 dark:via-[#1e1738]/80 dark:to-[#18122B]/90">
                            {/* Decorative background blurs */}
                            <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-gradient-to-br from-orange-400/10 to-amber-400/20 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-16 -left-16 size-72 rounded-full bg-gradient-to-tr from-amber-400/10 to-orange-400/20 blur-3xl" />

                            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-4 max-w-3xl">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-xs font-bold text-[#FF6B35] dark:border-orange-900/60 dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                            <Building2 className="size-3.5" />
                                            Profil Institusi Pendidikan
                                        </div>
                                        {profile.accreditation && (
                                            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                <Award className="size-3.5" />
                                                <span>{profile.accreditation}</span>
                                            </div>
                                        )}
                                    </div>

                                    <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-white leading-tight">
                                        {schoolName}
                                    </h1>

                                    {profile.school_motto && (
                                        <p className="text-base sm:text-lg font-semibold text-[#FF6B35] dark:text-[#FFA07A] italic">
                                            "{profile.school_motto}"
                                        </p>
                                    )}

                                    {profile.address && (
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                            <MapPin className="size-4 shrink-0 text-gray-400" />
                                            <span>
                                                {profile.address}
                                                {profile.city && `, ${profile.city}`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {canManageProfile && (
                                    <div className="shrink-0">
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl border-dashed border-[#FF6B35]/50 bg-white/80 text-xs font-bold text-[#FF6B35] hover:bg-orange-50 hover:border-[#FF6B35] dark:bg-gray-800/80 shadow-xs"
                                        >
                                            <Link href="/manage/school-profile">
                                                <Building2 className="mr-1.5 size-3.5" />
                                                Kelola Profil & Visi Misi
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Optional Featured Image */}
                            {profile.profile_image_url && (
                                <div className="mt-8 overflow-hidden rounded-2xl border border-orange-100 shadow-md dark:border-gray-800">
                                    <img
                                        src={profile.profile_image_url}
                                        alt={schoolName}
                                        className="h-64 sm:h-80 w-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Section 2: Profil Singkat Sekolah */}
                        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm dark:border-gray-800 dark:bg-[#18122B]">
                            <div className="flex items-center gap-3 pb-5 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B35] shadow-xs dark:bg-orange-950 dark:text-[#FFA07A]">
                                    <BookOpen className="size-5.5" />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                                        Profil Singkat Sekolah
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Mengenal lebih dekat sejarah, dedikasi, dan komitmen kami dalam dunia pendidikan.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-200">
                                {profile.profile_description ? (
                                    profile.profile_description.split('\n\n').map((paragraph, idx) => (
                                        <p key={idx}>{paragraph}</p>
                                    ))
                                ) : (
                                    <p>
                                        {schoolName} adalah institusi pendidikan dasar terkemuka yang berdedikasi menghadirkan pembelajaran modern berbasis teknologi serta penanaman budi pekerti luhur. Kami senantiasa berkomitmen untuk memberikan ruang bertumbuh kembang yang optimal, inklusif, dan berorientasi masa depan bagi seluruh peserta didik.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Visi & Misi Sekolah */}
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                            {/* Card Visi (40% width on desktop) */}
                            <div className="lg:col-span-5 flex flex-col">
                                <div className="flex-1 rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50/60 to-white p-6 sm:p-8 shadow-sm dark:border-orange-900/60 dark:from-[#2A1810] dark:via-[#1E1738] dark:to-[#18122B] flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-[#FFA07A] text-white shadow-md shadow-orange-500/25">
                                                <Target className="size-6" />
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF6B35] dark:text-[#FFA07A]">
                                                    Arah Strategis
                                                </span>
                                                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                                    Visi Sekolah
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="relative rounded-2xl bg-white/90 p-6 shadow-2xs dark:bg-gray-900/80 border border-orange-100 dark:border-gray-800">
                                            <Quote className="size-8 text-orange-300/60 dark:text-orange-900/60 absolute -top-3 -left-2" />
                                            <p className="relative z-10 text-sm sm:text-base font-bold italic text-gray-800 dark:text-gray-100 leading-relaxed text-center py-2">
                                                "{profile.vision || 'Terwujudnya peserta didik yang beriman, bertakwa, berakhlak mulia, cerdas, terampil, dan berwawasan global dalam era digital.'}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-5 border-t border-orange-200/60 dark:border-gray-800 flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                        <Sparkles className="size-4 text-[#FF6B35]" />
                                        <span>Menyongsong Generasi Emas Indonesia</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Misi (60% width on desktop) */}
                            <div className="lg:col-span-7 flex flex-col">
                                <div className="flex-1 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm dark:border-gray-800 dark:bg-[#18122B]">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                                        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-xs dark:bg-emerald-950 dark:text-emerald-300">
                                            <Layers className="size-6" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                                Langkah Nyata
                                            </span>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                                Misi Sekolah
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="space-y-3.5">
                                        {missionList.length > 0 ? (
                                            missionList.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="group flex items-start gap-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 sm:p-4 hover:border-orange-200 hover:bg-orange-50/30 transition-all dark:border-gray-800/80 dark:bg-gray-800/40 dark:hover:border-orange-900/50"
                                                >
                                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FFA07A] text-xs font-black text-white shadow-xs">
                                                        {index + 1}
                                                    </span>
                                                    <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed pt-0.5">
                                                        {item}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">Misi sekolah sedang disiapkan.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: 4 Pilar Budaya & Nilai Keunggulan */}
                        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm dark:border-gray-800 dark:bg-[#18122B] space-y-6">
                            <div className="text-center max-w-xl mx-auto space-y-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#FF6B35] dark:bg-orange-950 dark:text-orange-300">
                                    <ShieldCheck className="size-3.5" />
                                    Karakter & Budaya Sekolah
                                </span>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                                    Nilai-Nilai Utama
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    Nilai dasar yang kami tanamkan kepada seluruh peserta didik setiap hari.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-5 dark:border-gray-800 dark:bg-gray-800/40 space-y-2">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950 dark:text-orange-300">
                                        <HeartHandshake className="size-5" />
                                    </div>
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                                        Budi Pekerti Luhur
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                        Membiasakan 5S (Senyum, Salam, Sapa, Sopan, Santun) serta integritas dalam bersikap.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 dark:border-gray-800 dark:bg-gray-800/40 space-y-2">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                                        <GraduationCap className="size-5" />
                                    </div>
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                                        Cerdas & Terampil
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                        Mengasah literasi, numerasi, dan keterampilan berpikir kritis menghadapi tantangan era modern.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 dark:border-gray-800 dark:bg-gray-800/40 space-y-2">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                                        <Users className="size-5" />
                                    </div>
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                                        Gotong Royong
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                        Membangun semangat empati, kerja sama kelompok, serta kepedulian terhadap sesama dan lingkungan.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-5 dark:border-gray-800 dark:bg-gray-800/40 space-y-2">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                                        <Compass className="size-5" />
                                    </div>
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                                        Melek Digital
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                        Pemanfaatan teknologi edukasi yang ramah anak, bijak, dan aman untuk memperluas wawasan dunia.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section 5: Pimpinan & Pintasan Kontak */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Card Kepala Sekolah */}
                            {profile.principal_name && (
                                <div className="flex items-center gap-4 rounded-3xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/30 p-6 shadow-sm dark:border-gray-800 dark:from-[#18122B] dark:to-[#1e1738]">
                                    {profile.principal_photo_url ? (
                                        <img
                                            src={profile.principal_photo_url}
                                            alt={profile.principal_name}
                                            className="size-16 sm:size-20 shrink-0 rounded-2xl object-cover border-2 border-orange-200 dark:border-orange-800 shadow-xs"
                                        />
                                    ) : (
                                        <div className="flex size-16 sm:size-20 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B35] font-black text-xl dark:bg-orange-950 dark:text-orange-300">
                                            {profile.principal_name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                                            Kepala Sekolah
                                        </span>
                                        <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                                            {profile.principal_name}
                                        </h4>
                                        {profile.principal_nip && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                NIP. {profile.principal_nip}
                                            </p>
                                        )}
                                        <Link
                                            href="/"
                                            className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#FF6B35] hover:underline"
                                        >
                                            Baca Sambutan Lengkap &rarr;
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Card Pintasan Kontak & Berita */}
                            <div className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#18122B]">
                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                                        Informasi Lanjutan
                                    </span>
                                    <h4 className="text-base font-black text-gray-900 dark:text-white mt-1">
                                        Tertarik Berkunjung atau Mendaftar?
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Ketahui lebih banyak agenda kegiatan kami atau hubungi kami secara langsung.
                                    </p>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <Button asChild size="sm" className="rounded-xl bg-[#FF6B35] hover:bg-[#E85D26] text-xs font-bold text-white">
                                        <Link href="/kontak">
                                            <PhoneCall className="mr-1.5 size-3.5" />
                                            Hubungi Kami
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm" className="rounded-xl border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200">
                                        <Link href="/berita">
                                            Kabar & Berita Sekolah
                                        </Link>
                                    </Button>
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
