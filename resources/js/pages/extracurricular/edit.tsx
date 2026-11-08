import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    Camera,
    Check,
    CheckCheck,
    Clock,
    FileText,
    MapPin,
    Plus,
    Save,
    Search,
    Trash2,
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

interface CurrentAttendeeItem {
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

interface ReportData {
    id: number;
    extracurricular_name: string;
    session_type: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    activity_material: string;
    student_progress: string;
    obstacles_and_followup: string;
    photo_path?: string;
    photo_url?: string;
    photos?: string[];
    photo_urls?: string[];
    status: string;
}

interface UploadedPhoto {
    id: string;
    file: File;
    preview: string;
    name: string;
    sizeKb: number;
}

interface Props {
    report: ReportData;
    currentAttendees: CurrentAttendeeItem[];
    allStudents: StudentOption[];
    sessionTypes: string[];
}

export default function ExtracurricularEdit({
    report,
    currentAttendees,
    allStudents,
    sessionTypes,
}: Props) {
    const [attendees, setAttendees] = useState<CurrentAttendeeItem[]>(currentAttendees);
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');

    // Existing photos from database
    const [existingPhotos, setExistingPhotos] = useState<string[]>(() => {
        if (report.photos && Array.isArray(report.photos) && report.photos.length > 0) {
            return report.photos;
        }
        if (report.photo_path) {
            return [report.photo_path];
        }
        return [];
    });

    // Newly added photos
    const [newPhotos, setNewPhotos] = useState<UploadedPhoto[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, transform } = useForm({
        _method: 'PUT',
        extracurricular_name: report.extracurricular_name,
        session_type: report.session_type,
        date: report.date,
        start_time: report.start_time,
        end_time: report.end_time,
        location: report.location,
        activity_material: report.activity_material,
        student_progress: report.student_progress,
        obstacles_and_followup: report.obstacles_and_followup,
        photos: [] as File[],
        existing_photos: [] as string[],
        attendees: currentAttendees.map((a) => ({
            student_id: a.student_id,
            is_present: a.is_present ? 1 : 0,
            notes: a.notes || '',
        })),
    });

    const presentCount = useMemo(() => attendees.filter((a) => a.is_present).length, [attendees]);

    const availableStudents = useMemo(() => {
        const attendeeIds = new Set(attendees.map((a) => a.student_id));
        return allStudents.filter((s) => !attendeeIds.has(s.id));
    }, [allStudents, attendees]);

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
        toast.success(`${student.name} ditambahkan.`);
    };

    const handleRemoveStudent = (studentId: number) => {
        setAttendees((prev) => prev.filter((a) => a.student_id !== studentId));
    };

    const handleToggleAttendance = (studentId: number) => {
        setAttendees((prev) =>
            prev.map((a) => (a.student_id === studentId ? { ...a, is_present: !a.is_present } : a))
        );
    };

    const handleNoteChange = (studentId: number, note: string) => {
        setAttendees((prev) =>
            prev.map((a) => (a.student_id === studentId ? { ...a, notes: note } : a))
        );
    };

    const handleSetAllPresence = (present: boolean) => {
        setAttendees((prev) => prev.map((a) => ({ ...a, is_present: present })));
    };

    const handleNewPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newItems: UploadedPhoto[] = [];
        Array.from(files).forEach((file) => {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`File "${file.name}" melebihi 10MB.`);
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

        setNewPhotos((prev) => [...prev, ...newItems]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveNewPhoto = (id: string) => {
        setNewPhotos((prev) => {
            const target = prev.find((p) => p.id === id);
            if (target) {
                URL.revokeObjectURL(target.preview);
            }
            return prev.filter((p) => p.id !== id);
        });
    };

    const handleRemoveExistingPhoto = (path: string) => {
        setExistingPhotos((prev) => prev.filter((p) => p !== path));
        toast.info('Foto ditandai untuk dihapus saat disimpan.');
    };

    const getPhotoDisplayUrl = (path: string) => {
        if (path.startsWith('http') || path.startsWith('/storage/')) return path;
        return `/storage/${path.replace(/^\/+/, '')}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (attendees.length === 0) {
            toast.error('Daftar siswa hadir tidak boleh kosong.');
            return;
        }

        const formattedAttendees = attendees.map((a) => ({
            student_id: a.student_id,
            is_present: a.is_present ? 1 : 0,
            notes: a.notes || '',
        }));

        transform((currentData) => ({
            ...currentData,
            attendees: formattedAttendees,
            existing_photos: existingPhotos,
            photos: newPhotos.map((p) => p.file),
        }));

        post(`/extracurricular/reports/${report.id}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Laporan ekskul berhasil diperbarui.');
            },
            onError: () => {
                toast.error('Gagal memperbarui laporan.');
            },
        });
    };

    return (
        <>
            <Head title={`Sunting Laporan Ekskul ${report.extracurricular_name}`} />

            <div className="w-full min-w-0 max-w-5xl mx-auto space-y-5 px-3 sm:px-6 lg:px-8 py-5">
                <PageBanner
                    badgeText="Sunting Laporan Sesi"
                    title={`Edit: ${report.extracurricular_name}`}
                    description="Perbarui informasi kegiatan latihan, materi, hasil perkembangan, dan presensi murid ekskul."
                    icon={<Award className="size-6 text-white" />}
                    action={
                        <Button
                            asChild
                            variant="outline"
                            className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md text-xs font-semibold h-9"
                        >
                            <Link href={`/extracurricular/reports/${report.id}`}>
                                <ArrowLeft className="size-3.5 mr-1.5" />
                                Kembali
                            </Link>
                        </Button>
                    }
                />

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* SECTION 1 */}
                    <div className="rounded-xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2">
                            1. Informasi Sesi Latihan
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Nama Ekstrakurikuler <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    required
                                    value={data.extracurricular_name}
                                    onChange={(e) => setData('extracurricular_name', e.target.value)}
                                    className="text-xs sm:text-sm h-9"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Jenis Sesi Latihan <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.session_type}
                                    onChange={(e) => setData('session_type', e.target.value)}
                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 h-9"
                                >
                                    {sessionTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Tanggal Pelaksanaan <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="date"
                                    required
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    className="text-xs sm:text-sm h-9"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">
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
                                    <label className="text-xs font-bold text-gray-700 block mb-1">
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

                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Tempat / Lokasi <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    required
                                    value={data.location}
                                    onChange={(e) => setData('location', e.target.value)}
                                    className="text-xs sm:text-sm h-9"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Presensi Siswa */}
                    <div className="rounded-xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                2. Presensi Murid yang Hadir ({presentCount} / {attendees.length} Hadir)
                            </h3>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSetAllPresence(true)}
                                    className="h-7.5 text-xs text-emerald-600"
                                >
                                    Semua Hadir
                                </Button>

                                <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" size="sm" className="h-7.5 text-xs font-bold">
                                            + Tambah Murid
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
                                        <DialogHeader>
                                            <DialogTitle className="text-base font-bold">Tambah Murid ke Sesi</DialogTitle>
                                        </DialogHeader>
                                        <div className="relative my-2">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                type="text"
                                                placeholder="Cari murid..."
                                                value={studentSearch}
                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                className="pl-8 text-xs h-9"
                                            />
                                        </div>
                                        <div className="overflow-y-auto flex-1 max-h-72 divide-y border rounded-lg">
                                            {filteredAvailable.map((s) => (
                                                <div key={s.id} className="flex items-center justify-between p-2.5 text-xs hover:bg-gray-50">
                                                    <div>
                                                        <p className="font-bold">{s.name}</p>
                                                        <p className="text-[11px] text-gray-500">Kelas {s.classroom_name}</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleAddStudent(s)}
                                                        className="h-7 text-xs"
                                                    >
                                                        + Tambah
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto border rounded-lg">
                            {attendees.map((att, idx) => (
                                <div key={att.student_id} className="flex items-center justify-between p-2 text-xs">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <Checkbox
                                            checked={att.is_present}
                                            onCheckedChange={() => handleToggleAttendance(att.student_id)}
                                            className="size-4 data-[state=checked]:bg-emerald-600"
                                        />
                                        <span className={att.is_present ? 'font-bold text-gray-900' : 'text-gray-400 line-through'}>
                                            {att.name} ({att.classroom_name})
                                        </span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="text"
                                            value={att.notes}
                                            onChange={(e) => handleNoteChange(att.student_id, e.target.value)}
                                            placeholder="Catatan..."
                                            className="text-xs h-7 w-36"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveStudent(att.student_id)}
                                            className="p-1 text-gray-400 hover:text-red-500"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 3: Materi & Kendala */}
                    <div className="rounded-xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2">
                            3. Uraian Kegiatan & Dokumentasi
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Kegiatan / Materi Hari Ini <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={data.activity_material}
                                    onChange={(e) => setData('activity_material', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Hasil / Perkembangan Murid <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={data.student_progress}
                                    onChange={(e) => setData('student_progress', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Kendala & Tindak Lanjut <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={data.obstacles_and_followup}
                                    onChange={(e) => setData('obstacles_and_followup', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 p-2.5 text-xs"
                                />
                            </div>

                            {/* Foto Dokumentasi Kegiatan (Bisa Lebih Dari 1 Foto) */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                        Foto Dokumentasi Kegiatan (Bisa Lebih Dari 1 Foto)
                                    </label>
                                    <span className="text-[11px] text-gray-400 font-medium">
                                        Total: {existingPhotos.length + newPhotos.length} foto
                                    </span>
                                </div>

                                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/40 space-y-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                multiple
                                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                                onChange={handleNewPhotosChange}
                                                className="hidden"
                                                id="photos-upload-edit"
                                            />
                                            <label
                                                htmlFor="photos-upload-edit"
                                                className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 cursor-pointer transition-all"
                                            >
                                                <Camera className="size-4" />
                                                Tambah Foto Baru
                                            </label>
                                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                                Bisa pilih beberapa foto sekaligus (JPG, PNG, WEBP).
                                            </div>
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                                            <Check className="size-3.5 text-emerald-600" />
                                            Otomatis dikompres & tanpa crop (proporsi asli terjaga)
                                        </div>
                                    </div>

                                    {/* Existing photos */}
                                    {existingPhotos.length > 0 && (
                                        <div>
                                            <span className="text-[11px] font-semibold text-gray-500 block mb-2">
                                                Foto Tersimpan Saat Ini ({existingPhotos.length}):
                                            </span>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                {existingPhotos.map((path, idx) => (
                                                    <div
                                                        key={path}
                                                        className="group relative rounded-lg border border-gray-200 bg-white p-1.5 shadow-2xs dark:border-gray-700 dark:bg-gray-800 overflow-hidden"
                                                    >
                                                        <div className="relative aspect-4/3 w-full overflow-hidden rounded bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                                                            <img
                                                                src={getPhotoDisplayUrl(path)}
                                                                alt={`Foto dokumentasi ${idx + 1}`}
                                                                className="h-full w-full object-contain"
                                                            />
                                                            <div className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                                #{idx + 1}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveExistingPhoto(path)}
                                                                className="absolute top-1 right-1 rounded-full bg-red-600 text-white p-1 shadow-sm hover:bg-red-700 transition-colors"
                                                                title="Hapus foto ini"
                                                            >
                                                                <X className="size-3" />
                                                            </button>
                                                        </div>
                                                        <p className="mt-1 text-[10px] text-gray-500 text-center font-medium">
                                                            Foto {idx + 1}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Newly added photos */}
                                    {newPhotos.length > 0 && (
                                        <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                                            <span className="text-[11px] font-semibold text-emerald-600 block mb-2">
                                                Foto Baru yang Akan Ditambahkan ({newPhotos.length}):
                                            </span>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                {newPhotos.map((photo, idx) => (
                                                    <div
                                                        key={photo.id}
                                                        className="group relative rounded-lg border border-emerald-200 bg-emerald-50/30 p-1.5 shadow-2xs dark:border-emerald-800 overflow-hidden flex flex-col"
                                                    >
                                                        <div className="relative aspect-4/3 w-full overflow-hidden rounded bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                                                            <img
                                                                src={photo.preview}
                                                                alt={photo.name}
                                                                className="h-full w-full object-contain"
                                                            />
                                                            <div className="absolute top-1 left-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                                +Baru
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveNewPhoto(photo.id)}
                                                                className="absolute top-1 right-1 rounded-full bg-red-600 text-white p-1 shadow-sm hover:bg-red-700 transition-colors"
                                                                title="Hapus foto ini"
                                                            >
                                                                <X className="size-3" />
                                                            </button>
                                                        </div>
                                                        <div className="mt-1 px-1">
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
                                        </div>
                                    )}
                                </div>
                                {errors.photos && <p className="text-red-500 text-[11px] mt-1">{errors.photos}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-xs">
                        <Button asChild type="button" variant="outline" size="sm">
                            <Link href={`/extracurricular/reports/${report.id}`}>Batal</Link>
                        </Button>
                        <Button type="submit" size="sm" disabled={processing} className="font-bold">
                            <Save className="size-3.5 mr-1" />
                            {processing ? 'Menyimpan...' : 'Perbarui Laporan'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ExtracurricularEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan Ekskul', href: '/extracurricular/reports' },
        { title: 'Sunting Laporan', href: '#' },
    ],
};
