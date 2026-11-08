import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    Calendar,
    Camera,
    Check,
    CheckCheck,
    Clock,
    FileText,
    HelpCircle,
    Image as ImageIcon,
    Info,
    MapPin,
    Plus,
    Save,
    Search,
    Trash2,
    Upload,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PageBanner } from '@/components/page-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface DefaultRosterItem {
    student_id: number;
    name: string;
    nisn: string;
    classroom_name: string;
    is_present: boolean;
    notes: string;
}

interface StudentOption {
    id: number;
    name: string;
    nisn: string;
    classroom_id?: number;
    classroom_name: string;
}

interface UploadedPhoto {
    id: string;
    file: File;
    preview: string;
    name: string;
    sizeKb: number;
}

interface Props {
    defaultRoster: DefaultRosterItem[];
    allStudents: StudentOption[];
    lastEkskulName: string;
    sessionTypes: string[];
}

export default function ExtracurricularCreate({
    defaultRoster,
    allStudents,
    lastEkskulName,
    sessionTypes,
}: Props) {
    // Current attendees state initialized from default roster
    const [attendees, setAttendees] = useState<DefaultRosterItem[]>(() =>
        defaultRoster.map((r) => ({ ...r, is_present: true, notes: '' }))
    );

    // Manual student picker state
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedPhotos, setSelectedPhotos] = useState<UploadedPhoto[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const todayDate = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors, transform } = useForm({
        extracurricular_name: lastEkskulName || '',
        session_type: sessionTypes[0] || 'Latihan terjadwal (sesuai ketetapan Sudin)',
        date: todayDate,
        start_time: '14:00',
        end_time: '16:00',
        location: 'Halaman sekolah',
        activity_material: '',
        student_progress: '',
        obstacles_and_followup: '',
        photos: [] as File[],
        attendees: defaultRoster.map((r) => ({
            student_id: r.student_id,
            is_present: true,
            notes: '',
        })),
    });

    // Attendee counts
    const presentCount = useMemo(() => attendees.filter((a) => a.is_present).length, [attendees]);

    // Available students to add (not yet in attendees)
    const availableStudents = useMemo(() => {
        const attendeeIds = new Set(attendees.map((a) => a.student_id));
        return allStudents.filter((s) => !attendeeIds.has(s.id));
    }, [allStudents, attendees]);

    // Filtered available students for search dialog
    const filteredAvailable = useMemo(() => {
        if (!studentSearch.trim()) return availableStudents.slice(0, 30);
        const q = studentSearch.toLowerCase();
        return availableStudents.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                (s.nisn && s.nisn.toLowerCase().includes(q)) ||
                (s.classroom_name && s.classroom_name.toLowerCase().includes(q))
        );
    }, [availableStudents, studentSearch]);

    // Handle add student to attendee list
    const handleAddStudent = (student: StudentOption) => {
        setAttendees((prev) => [
            ...prev,
            {
                student_id: student.id,
                name: student.name,
                nisn: student.nisn || '-',
                classroom_name: student.classroom_name,
                is_present: true,
                notes: '',
            },
        ]);
        toast.success(`${student.name} ditambahkan ke daftar hadir.`);
    };

    // Remove student from attendee list
    const handleRemoveStudent = (studentId: number) => {
        setAttendees((prev) => prev.filter((a) => a.student_id !== studentId));
    };

    // Toggle single attendance
    const handleToggleAttendance = (studentId: number) => {
        setAttendees((prev) =>
            prev.map((a) => (a.student_id === studentId ? { ...a, is_present: !a.is_present } : a))
        );
    };

    // Update attendance notes
    const handleNoteChange = (studentId: number, note: string) => {
        setAttendees((prev) =>
            prev.map((a) => (a.student_id === studentId ? { ...a, notes: note } : a))
        );
    };

    // Bulk toggle
    const handleSetAllPresence = (present: boolean) => {
        setAttendees((prev) => prev.map((a) => ({ ...a, is_present: present })));
    };

    // Handle multi-photos selection
    const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newItems: UploadedPhoto[] = [];
        Array.from(files).forEach((file) => {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`File "${file.name}" melebihi batas 10MB.`);
                return;
            }
            newItems.push({
                id: Math.random().toString(36).substring(2, 9),
                file,
                preview: URL.createObjectURL(file),
                name: file.name,
                sizeKb: Math.round(file.size / 1024),
            });
        });

        setSelectedPhotos((prev) => [...prev, ...newItems]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemovePhoto = (id: string) => {
        setSelectedPhotos((prev) => {
            const target = prev.find((p) => p.id === id);
            if (target) {
                URL.revokeObjectURL(target.preview);
            }
            return prev.filter((p) => p.id !== id);
        });
    };

    // Submit form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (attendees.length === 0) {
            toast.error('Daftar siswa yang hadir tidak boleh kosong. Tambahkan minimal 1 siswa.');
            return;
        }

        // Format attendees for submission
        const formattedAttendees = attendees.map((a) => ({
            student_id: a.student_id,
            is_present: a.is_present ? 1 : 0,
            notes: a.notes || '',
        }));

        transform((currentData) => ({
            ...currentData,
            attendees: formattedAttendees,
            photos: selectedPhotos.map((p) => p.file),
        }));

        post('/extracurricular/reports', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Laporan ekskul berhasil diajukan untuk persetujuan.');
            },
            onError: (err) => {
                const firstError = Object.values(err)[0];
                toast.error(typeof firstError === 'string' ? firstError : 'Mohon periksa kembali kelengkapan form.');
            },
        });
    };

    return (
        <>
            <Head title="Buat Laporan Sesi Kegiatan Ekskul" />

            <div className="w-full min-w-0 max-w-5xl mx-auto space-y-5 px-3 sm:px-6 lg:px-8 py-5">
                {/* Header Banner */}
                <PageBanner
                    badgeText="Input Laporan Sesi"
                    title="Form Lapor Kegiatan Ekstrakurikuler"
                    description="Laporkan sesi latihan, checklist kehadiran murid, catat hasil perkembangan & kendala. Laporan akan otomatis diteruskan ke Kepala Sekolah untuk persetujuan."
                    icon={<Award className="size-6 text-white" />}
                    action={
                        <Button
                            asChild
                            variant="outline"
                            className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md text-xs font-semibold h-9"
                        >
                            <Link href="/extracurricular/reports">
                                <ArrowLeft className="size-3.5 mr-1.5" />
                                Kembali ke Riwayat
                            </Link>
                        </Button>
                    }
                />

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* SECTION 1: Informasi Sesi Latihan */}
                    <div className="rounded-xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                            <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-bold text-xs">
                                1
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                    Informasi Sesi Latihan & Waktu
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Tentukan jenis sesi latihan, nama ekskul, jadwal, dan lokasi pelaksanaan.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Nama Ekskul */}
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                    Nama Ekstrakurikuler <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    required
                                    value={data.extracurricular_name}
                                    onChange={(e) => setData('extracurricular_name', e.target.value)}
                                    placeholder="Contoh: Pramuka, Futsal, Seni Tari, Pencak Silat..."
                                    className="text-xs sm:text-sm h-9"
                                />
                                {errors.extracurricular_name && (
                                    <p className="text-red-500 text-[11px] mt-1">{errors.extracurricular_name}</p>
                                )}
                            </div>

                            {/* Jenis Sesi */}
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                    Jenis Sesi Latihan <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.session_type}
                                    onChange={(e) => setData('session_type', e.target.value)}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 h-9"
                                >
                                    {sessionTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                {errors.session_type && (
                                    <p className="text-red-500 text-[11px] mt-1">{errors.session_type}</p>
                                )}
                            </div>

                            {/* Tanggal */}
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                    Tanggal Pelaksanaan <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="date"
                                    required
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    className="text-xs sm:text-sm h-9"
                                />
                                {errors.date && <p className="text-red-500 text-[11px] mt-1">{errors.date}</p>}
                            </div>

                            {/* Jam Mulai & Jam Selesai */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                        Jam Mulai <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="time"
                                        required
                                        value={data.start_time}
                                        onChange={(e) => setData('start_time', e.target.value)}
                                        className="text-xs sm:text-sm h-9"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                        Jam Selesai <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="time"
                                        required
                                        value={data.end_time}
                                        onChange={(e) => setData('end_time', e.target.value)}
                                        className="text-xs sm:text-sm h-9"
                                    />
                                </div>
                            </div>

                            {/* Tempat */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                    Tempat / Lokasi Latihan <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        type="text"
                                        required
                                        value={data.location}
                                        onChange={(e) => setData('location', e.target.value)}
                                        placeholder="Default: Halaman sekolah (atau Aula, Lapangan Olahraga, Lab Komputer)"
                                        className="pl-9 text-xs sm:text-sm h-9"
                                    />
                                </div>
                                {errors.location && <p className="text-red-500 text-[11px] mt-1">{errors.location}</p>}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Presensi Kehadiran Siswa */}
                    <div className="rounded-xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-bold text-xs">
                                    2
                                </span>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                        Presensi Murid yang Hadir
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {defaultRoster.length > 0
                                            ? `Daftar anggota ekskul default Anda otomatis dimuat (${defaultRoster.length} siswa). Centang yang hadir atau tambahkan siswa lain.`
                                            : 'Daftar anggota ekskul belum diatur. Anda dapat mencari dan memilih siswa langsung dari database di bawah ini.'}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons: Quick All & Add Student */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSetAllPresence(true)}
                                    className="h-8 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                                >
                                    <CheckCheck className="size-3.5 mr-1" />
                                    Semua Hadir
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSetAllPresence(false)}
                                    className="h-8 text-xs font-semibold text-gray-600 hover:text-gray-700"
                                >
                                    Kosongkan
                                </Button>

                                {/* Manual Student Search Modal */}
                                <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-8 text-xs font-bold bg-[var(--brand-primary)] text-white hover:opacity-90"
                                        >
                                            <Plus className="size-3.5 mr-1" />
                                            Cari Murid Lain
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
                                        <DialogHeader>
                                            <DialogTitle className="text-base font-bold">
                                                Cari & Tambahkan Siswa ke Sesi Ini
                                            </DialogTitle>
                                            <DialogDescription className="text-xs text-gray-500">
                                                Pilih dari database siswa aktif seluruh kelas untuk dimasukkan ke laporan sesi latihan ini.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="relative my-2">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                type="text"
                                                placeholder="Ketik nama murid, NISN, atau kelas..."
                                                value={studentSearch}
                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                className="pl-8 text-xs h-9"
                                                autoFocus
                                            />
                                        </div>

                                        <div className="overflow-y-auto flex-1 max-h-72 divide-y divide-gray-100 border rounded-lg dark:border-gray-800">
                                            {filteredAvailable.length === 0 ? (
                                                <div className="p-6 text-center text-xs text-gray-400">
                                                    Tidak ada siswa yang cocok atau semua siswa sudah ada di daftar.
                                                </div>
                                            ) : (
                                                filteredAvailable.map((student) => (
                                                    <div
                                                        key={student.id}
                                                        className="flex items-center justify-between p-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs"
                                                    >
                                                        <div>
                                                            <p className="font-bold text-gray-900 dark:text-white">
                                                                {student.name}
                                                            </p>
                                                            <p className="text-[11px] text-gray-500">
                                                                Kelas {student.classroom_name} • NISN: {student.nisn || '-'}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleAddStudent(student)}
                                                            className="h-7 text-xs px-2.5 font-semibold text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                                        >
                                                            + Tambah
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <DialogFooter className="mt-2">
                                            <DialogClose asChild>
                                                <Button type="button" variant="outline" size="sm">
                                                    Selesai
                                                </Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Roster Setup Hint */}
                        {defaultRoster.length === 0 && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 flex items-start gap-2">
                                <Info className="size-4 shrink-0 mt-0.5 text-amber-600" />
                                <div>
                                    <p className="font-bold">Tips Menghemat Waktu:</p>
                                    <p className="text-[11px] mt-0.5">
                                        Anda dapat mengatur <strong>Daftar Anggota Siswa Default</strong> di menu{' '}
                                        <Link href="/extracurricular/roster" className="underline font-bold">
                                            Atur Anggota Ekskul
                                        </Link>
                                        , sehingga form ini akan langsung terisi otomatis pada setiap pelaporan latihan berikutnya.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Attendance Table */}
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-b">
                                <span>Daftar Siswa Peserta ({attendees.length} terdaftar)</span>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold">
                                    {presentCount} Hadir ({attendees.length - presentCount} Tidak Hadir)
                                </Badge>
                            </div>

                            <div className="divide-y divide-gray-100 dark:divide-gray-800/80 max-h-96 overflow-y-auto">
                                {attendees.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-xs">
                                        Belum ada murid di dalam daftar. Klik tombol <strong>+ Cari Murid Lain</strong> di atas untuk memasukkan siswa.
                                    </div>
                                ) : (
                                    attendees.map((att, idx) => (
                                        <div
                                            key={att.student_id}
                                            className={`flex items-center justify-between p-2.5 text-xs transition-colors ${
                                                att.is_present ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/60 dark:bg-gray-800/40 opacity-75'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-[11px] font-mono text-gray-400 w-5 text-right">
                                                    {idx + 1}.
                                                </span>
                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                    <Checkbox
                                                        checked={att.is_present}
                                                        onCheckedChange={() => handleToggleAttendance(att.student_id)}
                                                        className="size-4.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                                    />
                                                    <span
                                                        className={`font-semibold ${
                                                            att.is_present
                                                                ? 'text-gray-900 dark:text-white'
                                                                : 'text-gray-400 line-through'
                                                        }`}
                                                    >
                                                        {att.name}
                                                    </span>
                                                </label>
                                                <span className="text-[11px] text-gray-500 hidden sm:inline">
                                                    (Kelas {att.classroom_name})
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="text"
                                                    value={att.notes}
                                                    onChange={(e) => handleNoteChange(att.student_id, e.target.value)}
                                                    placeholder={att.is_present ? 'Catatan (opsional)' : 'Alasan tidak hadir (izin/sakit)'}
                                                    className="text-[11px] h-7 w-36 sm:w-48 bg-transparent"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveStudent(att.student_id)}
                                                    className="p-1 text-gray-400 hover:text-red-500"
                                                    title="Hapus dari daftar sesi ini"
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Uraian Kegiatan, Hasil & Kendala */}
                    <div className="rounded-xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                            <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-bold text-xs">
                                3
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                    Materi, Perkembangan Murid & Dokumentasi
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Isi deskripsi kegiatan secara transparan untuk laporan ke Kepala Sekolah dan arsip sekolah.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Kegiatan / Materi Hari Ini */}
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                    Kegiatan / Materi Latihan Hari Ini <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={data.activity_material}
                                    onChange={(e) => setData('activity_material', e.target.value)}
                                    placeholder="Uraikan agenda kegiatan, materi teknik yang dilatihkan, atau simulasi pertandingan..."
                                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-[var(--brand-primary)] dark:border-gray-700 dark:bg-gray-800"
                                />
                                {errors.activity_material && (
                                    <p className="text-red-500 text-[11px] mt-1">{errors.activity_material}</p>
                                )}
                            </div>

                            {/* Hasil / Perkembangan Murid */}
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                    Hasil / Perkembangan Murid <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={data.student_progress}
                                    onChange={(e) => setData('student_progress', e.target.value)}
                                    placeholder="Jelaskan kemajuan fisik, keterampilan, kekompakan tim, atau pencapaian teknik siswa..."
                                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-[var(--brand-primary)] dark:border-gray-700 dark:bg-gray-800"
                                />
                                {errors.student_progress && (
                                    <p className="text-red-500 text-[11px] mt-1">{errors.student_progress}</p>
                                )}
                            </div>

                            {/* Kendala dan Tindak Lanjut */}
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                                    Kendala & Rencana Tindak Lanjut <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={data.obstacles_and_followup}
                                    onChange={(e) => setData('obstacles_and_followup', e.target.value)}
                                    placeholder="Tulis kendala yang dihadapi (sarana/lapangan/cuaca/kedisiplinan) dan langkah tindak lanjut untuk sesi berikutnya..."
                                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-[var(--brand-primary)] dark:border-gray-700 dark:bg-gray-800"
                                />
                                {errors.obstacles_and_followup && (
                                    <p className="text-red-500 text-[11px] mt-1">{errors.obstacles_and_followup}</p>
                                )}
                            </div>

                            {/* Foto Dokumentasi Kegiatan (Bisa Lebih Dari 1 Foto) */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                        Foto Dokumentasi Kegiatan (Bisa Lebih Dari 1 Foto)
                                    </label>
                                    <span className="text-[11px] text-gray-400 font-medium">
                                        {selectedPhotos.length} foto dipilih
                                    </span>
                                </div>

                                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                multiple
                                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                                onChange={handlePhotosChange}
                                                className="hidden"
                                                id="photos-upload"
                                            />
                                            <label
                                                htmlFor="photos-upload"
                                                className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer transition-all"
                                            >
                                                <Camera className="size-4" />
                                                Pilih / Tambah Foto
                                            </label>
                                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                                Dapat memilih beberapa foto sekaligus (JPG, PNG, WEBP).
                                            </div>
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                            <Check className="size-3.5 text-emerald-600" />
                                            Otomatis dikompres & tanpa crop (proporsi asli terjaga)
                                        </div>
                                    </div>

                                    {selectedPhotos.length > 0 && (
                                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {selectedPhotos.map((photo, idx) => (
                                                <div
                                                    key={photo.id}
                                                    className="group relative rounded-lg border border-gray-200 bg-white p-1.5 shadow-2xs dark:border-gray-700 dark:bg-gray-800 overflow-hidden flex flex-col"
                                                >
                                                    <div className="relative aspect-4/3 w-full overflow-hidden rounded bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                                                        <img
                                                            src={photo.preview}
                                                            alt={photo.name}
                                                            className="h-full w-full object-contain"
                                                        />
                                                        <div className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                            #{idx + 1}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePhoto(photo.id)}
                                                            className="absolute top-1 right-1 rounded-full bg-red-600 text-white p-1 shadow-sm hover:bg-red-700 transition-colors"
                                                            title="Hapus foto ini"
                                                        >
                                                            <X className="size-3" />
                                                        </button>
                                                    </div>
                                                    <div className="mt-1.5 px-1 pb-0.5">
                                                        <p className="truncate text-[10px] font-semibold text-gray-700 dark:text-gray-300" title={photo.name}>
                                                            {photo.name}
                                                        </p>
                                                        <p className="text-[9px] text-gray-400">
                                                            {photo.sizeKb} KB
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {errors.photos && <p className="text-red-500 text-[11px] mt-1">{errors.photos}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                        <span className="text-xs text-gray-500">
                            Status awal: <strong className="text-amber-600">Menunggu Persetujuan Kepala Sekolah</strong>
                        </span>
                        <div className="flex gap-2">
                            <Button asChild type="button" variant="outline" size="sm">
                                <Link href="/extracurricular/reports">Batal</Link>
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={processing}
                                className="bg-[var(--brand-primary)] text-white hover:opacity-90 font-bold px-4"
                            >
                                <Save className="size-3.5 mr-1.5" />
                                {processing ? 'Menyimpan...' : 'Simpan & Ajukan Laporan'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

ExtracurricularCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan Ekskul', href: '/extracurricular/reports' },
        { title: 'Buat Laporan', href: '/extracurricular/reports/create' },
    ],
};
