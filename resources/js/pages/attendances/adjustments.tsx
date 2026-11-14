import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle,
    FileText,
    HeartPulse,
    Paperclip,
    Pencil,
    PlusCircle,
    Search,
    Trash2,
    Upload,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageBanner } from '@/components/page-banner';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface AdjustmentRecord {
    id: number;
    attendance_id: number;
    student_id?: number;
    student_name: string;
    nisn: string;
    classroom: string;
    type: string;
    type_name: string;
    departure_time: string;
    reason: string;
    pickup_person: string | null;
    attachment_url: string | null;
    has_attachment?: boolean;
    approved_by: string;
    created_at: string;
    can_manage?: boolean;
}

interface EligibleStudent {
    attendance_id: number;
    student_id: number;
    name: string;
    nisn: string;
    classroom_id?: number;
    classroom: string;
}

interface ClassroomItem {
    id: number;
    name: string;
}

interface HolidayInfo {
    name: string;
    type: string;
    type_name: string;
    description?: string;
}

interface AdjustmentsProps {
    selectedDate: string;
    isFutureDate?: boolean;
    holiday?: HolidayInfo | null;
    adjustments: AdjustmentRecord[];
    eligibleStudents: EligibleStudent[];
    classrooms?: ClassroomItem[];
    defaultDepartureTime: string;
}

export default function AdjustmentsPage({
    selectedDate,
    isFutureDate = false,
    holiday = null,
    adjustments = [],
    eligibleStudents = [],
    classrooms = [],
    defaultDepartureTime,
}: AdjustmentsProps) {
    const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
    const isFuture = isFutureDate || selectedDate > todayStr;
    const isBlocked = !!holiday || isFuture;

    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [editingRecord, setEditingRecord] = useState<AdjustmentRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<AdjustmentRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        attendance_id: '' as string | number,
        type: 'early_leave_sick',
        departure_time: defaultDepartureTime || '10:30',
        reason: '',
        pickup_person: '',
        proof: null as File | null,
    });

    const editForm = useForm({
        type: 'early_leave_sick',
        departure_time: '10:30',
        reason: '',
        pickup_person: '',
        proof: null as File | null,
        delete_proof: false,
    });

    const handleOpenEdit = (record: AdjustmentRecord) => {
        setEditingRecord(record);
        editForm.setData({
            type: record.type,
            departure_time: record.departure_time,
            reason: record.reason,
            pickup_person: record.pickup_person || '',
            proof: null,
            delete_proof: false,
        });
        editForm.clearErrors();
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRecord) return;

        editForm.transform((data) => ({
            ...data,
            _method: 'PUT',
        }));

        editForm.post(`/attendances/adjustments/${editingRecord.id}`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setEditingRecord(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = () => {
        if (!deletingRecord) return;
        setIsDeleting(true);
        router.delete(`/attendances/adjustments/${deletingRecord.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingRecord(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const handleDateChange = (newDate: string) => {
        router.get(
            '/attendances/adjustments',
            { date: newDate },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Available classrooms for filter
    const availableClassrooms = useMemo(() => {
        if (classrooms && classrooms.length > 0) {
            return classrooms;
        }
        const seen = new Set<string>();
        const list: ClassroomItem[] = [];
        eligibleStudents.forEach((s) => {
            if (s.classroom && !seen.has(s.classroom)) {
                seen.add(s.classroom);
                list.push({ id: s.classroom_id || list.length + 1, name: s.classroom });
            }
        });
        return list;
    }, [classrooms, eligibleStudents]);

    // Filter eligible students by classroom and search term
    const filteredEligibleStudents = useMemo(() => {
        let list = eligibleStudents;

        if (selectedClassId) {
            list = list.filter(
                (s) =>
                    String(s.classroom_id) === String(selectedClassId) ||
                    s.classroom.toLowerCase() === selectedClassId.toLowerCase(),
            );
        }

        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(
                (s) =>
                    s.name.toLowerCase().includes(lower) ||
                    s.nisn.includes(lower) ||
                    s.classroom.toLowerCase().includes(lower),
            );
        }

        return list;
    }, [eligibleStudents, selectedClassId, searchTerm]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/attendances/adjustments', {
            forceFormData: true,
            onSuccess: () => {
                reset('attendance_id', 'reason', 'pickup_person', 'proof');
                setSearchTerm('');
            },
        });
    };

    const sickCount = adjustments.filter((a) => a.type === 'early_leave_sick').length;
    const urgentCount = adjustments.filter((a) => a.type === 'early_leave_urgent').length;

    return (
        <>
            <Head title="Absen Khusus" />
            <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8 bg-page-gradient min-h-screen">
                <PageBanner
                    badgeText="Modul Guru Piket • Mid-Day Status"
                    title="Presensi Khusus & Izin Pulang Lebih Awal 🏥"
                    description="Kelola siswa yang telah hadir pagi hari namun izin pulang mendadak karena sakit di sekolah atau ada keperluan darurat. Terverifikasi langsung dengan jejak audit rapi."
                    action={
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                                {adjustments.length} Kasus Tercatat Hari Ini
                            </span>
                        </div>
                    }
                />

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        title="Total Izin Pulang Awal"
                        value={adjustments.length}
                        subtitle="Siswa meninggalkan sekolah"
                        icon={CalendarDays}
                        variant="secondary"
                    />
                    <StatCard
                        title="Sakit di Sekolah"
                        value={sickCount}
                        subtitle="Dirujuk ke UKS / Dijemput"
                        icon={HeartPulse}
                        variant="info"
                    />
                    <StatCard
                        title="Keperluan Penting"
                        value={urgentCount}
                        subtitle="Urusan keluarga / mendesak"
                        icon={AlertCircle}
                        variant="warning"
                    />
                </div>

                {/* Holiday / Future Date Warning Banner */}
                {holiday && (
                    <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="size-5 text-red-600 dark:text-red-400 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-red-800 dark:text-red-200">
                                    Hari Libur: {holiday.name} ({holiday.type_name})
                                </h4>
                                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                                    {holiday.description || 'Tanggal yang dipilih merupakan hari libur. Pencatatan izin pulang awal / absen khusus dinonaktifkan.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {!holiday && isFuture && (
                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">
                                    Tanggal Melebihi Hari Ini (Tanggal Maju)
                                </h4>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                                    Pencatatan izin pulang awal tidak dapat dilakukan untuk tanggal di masa mendatang. Silakan pilih tanggal hari ini atau sebelumnya.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Form: Input Absen Khusus */}
                    <div className="lg:col-span-1 rounded-[18px] border-2 border-[#E8E8E8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                        <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2 mb-4">
                            <PlusCircle className="size-5 text-[#FF6B35]" />
                            Formulir Izin Pulang Awal
                        </h2>

                        {isBlocked && (
                            <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
                                ⚠️ Penginputan dinonaktifkan karena tanggal yang dipilih adalah hari libur atau melebihi hari ini.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Pilih Siswa dengan Filter Kelas & Fitur Pencarian Nama (mirip Form Entri Keterlambatan) */}
                            <div className="flex flex-col gap-2.5">
                                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block">
                                    Pilih Siswa (Yang Hadir Hari Ini):
                                </label>

                                {/* 1. Filter Kelas */}
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-500 block mb-1 dark:text-gray-400">
                                        Filter Kelas:
                                    </label>
                                    <select
                                        value={selectedClassId}
                                        onChange={(e) => {
                                            setSelectedClassId(e.target.value);
                                            setData('attendance_id', '');
                                        }}
                                        disabled={isBlocked}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-medium text-gray-800 focus:border-[#FF6B35] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white dark:disabled:bg-gray-800 cursor-pointer"
                                    >
                                        <option value="">-- Semua Kelas --</option>
                                        {availableClassrooms.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 2. Fitur Pencarian Nama */}
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-500 block mb-1 dark:text-gray-400">
                                        Cari Nama / NISN Siswa:
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 size-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder={eligibleStudents.length === 0 ? "Tidak ada siswa hadir..." : "Ketik NISN atau nama siswa..."}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            disabled={isBlocked || eligibleStudents.length === 0}
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] pl-8 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white dark:disabled:bg-gray-800"
                                        />
                                    </div>
                                </div>

                                {/* 3. Select Siswa Hadir */}
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-500 block mb-1 dark:text-gray-400">
                                        Daftar Siswa:
                                    </label>
                                    <select
                                        value={data.attendance_id}
                                        onChange={(e) => setData('attendance_id', e.target.value)}
                                        disabled={isBlocked || filteredEligibleStudents.length === 0}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] bg-white px-3.5 py-2 text-xs font-medium text-gray-800 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/15 disabled:bg-gray-100 disabled:text-gray-400 dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white dark:disabled:bg-gray-800 cursor-pointer"
                                        required
                                    >
                                        <option value="">
                                            {eligibleStudents.length === 0
                                                ? '-- Belum ada siswa berstatus hadir --'
                                                : filteredEligibleStudents.length === 0
                                                  ? '-- Tidak ada siswa yang cocok dengan filter --'
                                                  : '-- Pilih Siswa Izin Pulang --'}
                                        </option>
                                        {filteredEligibleStudents.map((s) => (
                                            <option key={s.attendance_id} value={s.attendance_id}>
                                                {s.name} ({s.classroom} - {s.nisn})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {eligibleStudents.length === 0 && (
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                                        *Belum ada siswa yang berstatus hadir pada tanggal ini.
                                    </p>
                                )}
                                {errors.attendance_id && (
                                    <p className="text-red-500 text-[11px] mt-0.5">{errors.attendance_id}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                        Kategori:
                                    </label>
                                    <select
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value)}
                                        disabled={isBlocked}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#FF6B35] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800"
                                    >
                                        <option value="early_leave_sick">Sakit di Sekolah</option>
                                        <option value="early_leave_urgent">Keperluan Mendesak</option>
                                        <option value="other">Lainnya</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                        Jam Keluar:
                                    </label>
                                    <input
                                        type="time"
                                        value={data.departure_time}
                                        onChange={(e) => setData('departure_time', e.target.value)}
                                        disabled={isBlocked}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-bold text-gray-800 focus:border-[#FF6B35] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                    Alasan Kepulangan:
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Contoh: Mengeluh demam tinggi dan mual saat jam istirahat..."
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    disabled={isBlocked}
                                    className="w-full rounded-xl border-2 border-[#E8E8E8] p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800"
                                    required
                                />
                                {errors.reason && (
                                    <p className="text-red-500 text-[11px] mt-1">{errors.reason}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                    Nama Penjemput / Wali:
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Ibu Kandung (Ibu Dewi)"
                                    value={data.pickup_person}
                                    onChange={(e) => setData('pickup_person', e.target.value)}
                                    disabled={isBlocked}
                                    className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                    Bukti / Surat Jalan (Opsional):
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) =>
                                            setData('proof', e.target.files ? e.target.files[0] : null)
                                        }
                                        disabled={isBlocked}
                                        className="text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FFF0EB] file:text-[#FF6B35] hover:file:bg-[#FFE66D] disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isBlocked || processing || !data.attendance_id}
                                className="w-full mt-2 font-bold text-xs text-white shadow-brand hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Memproses...' : 'Verifikasi & Catat Izin Pulang'}
                            </Button>
                        </form>
                    </div>

                    {/* Right Table: List of Adjustments */}
                    <div className="lg:col-span-2 overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E8E8E8] px-6 py-4 gap-3 dark:border-[#2D234A]">
                            <div>
                                <h2 className="text-base font-bold text-[#111827] dark:text-white">
                                    Daftar Siswa Izin Pulang Lebih Awal
                                </h2>
                                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                    Status komposit tetap mencatat kehadiran pagi disertai rekaman kepulangan tengah hari.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#6B7280]">Tanggal:</span>
                                <input
                                    type="date"
                                    max={todayStr}
                                    value={selectedDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="rounded-xl border border-[#E8E8E8] px-2.5 py-1 text-xs font-semibold text-gray-800 focus:border-[#FF6B35] outline-none"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-table-header border-b-2 border-[#FFD4C2] dark:border-[#3D2520]">
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            No
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            Nama Siswa
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            Kelas
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            Kategori & Waktu
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            Alasan / Penjemput
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            Diverifikasi
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35] text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F5F5F5]">
                                    {adjustments.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-gray-500 font-medium">
                                                Belum ada permohonan absen khusus / pulang awal pada tanggal ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        adjustments.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="px-5 py-3.5 font-bold text-gray-500">{idx + 1}</td>
                                                <td className="px-5 py-3.5 font-bold text-gray-900">
                                                    <div>{item.student_name}</div>
                                                    <div className="text-[11px] text-gray-400 font-normal">NISN: {item.nisn}</div>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">
                                                    <span className="rounded-md bg-gray-100 px-2 py-0.5">{item.classroom}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex rounded-lg bg-[#CCFBF1] px-2.5 py-0.5 text-xs font-bold text-[#0F766E]">
                                                        {item.type_name}
                                                    </span>
                                                    <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                                                        Pukul {item.departure_time} WIB
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-gray-700 max-w-xs">
                                                    <div className="font-medium">{item.reason}</div>
                                                    {item.pickup_person && (
                                                        <div className="text-[11px] text-gray-500 mt-0.5">
                                                            Penjemput: <span className="font-semibold">{item.pickup_person}</span>
                                                        </div>
                                                    )}
                                                    {item.attachment_url && (
                                                        <a
                                                            href={item.attachment_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-[11px] text-[#FF6B35] font-bold mt-1 hover:underline"
                                                        >
                                                            <Paperclip className="size-3" />
                                                            Lihat Lampiran
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-gray-500">
                                                    <div>{item.approved_by}</div>
                                                    <div className="text-[10px] text-gray-400">{item.created_at}</div>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    {item.can_manage !== false ? (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEdit(item)}
                                                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors dark:text-blue-400 dark:hover:bg-blue-950/40"
                                                                title="Edit Absen Khusus"
                                                            >
                                                                <Pencil className="size-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeletingRecord(item)}
                                                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-950/40"
                                                                title="Hapus Absen Khusus"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal Edit Absen Khusus */}
                <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-gray-900 dark:text-white">
                                <Pencil className="size-5 text-[#FF6B35]" />
                                Edit Izin Khusus Pulang Awal
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                Perbarui data alasan, jam kepulangan, penjemput, atau surat izin siswa.
                            </DialogDescription>
                        </DialogHeader>

                        {editingRecord && (
                            <form onSubmit={handleUpdate} className="flex flex-col gap-4 mt-2">
                                {/* Info Siswa */}
                                <div className="rounded-xl bg-orange-50/70 border border-orange-200/80 p-3 text-xs dark:bg-orange-950/30 dark:border-orange-900/40">
                                    <div className="font-extrabold text-gray-900 dark:text-white text-sm">
                                        {editingRecord.student_name}
                                    </div>
                                    <div className="text-gray-500 flex items-center gap-2 mt-0.5">
                                        <span>NISN: {editingRecord.nisn}</span>
                                        <span>•</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                                            Kelas {editingRecord.classroom}
                                        </span>
                                    </div>
                                </div>

                                {/* Kategori & Jam Keluar */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                            Kategori:
                                        </label>
                                        <select
                                            value={editForm.data.type}
                                            onChange={(e) => editForm.setData('type', e.target.value)}
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] bg-white px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white"
                                        >
                                            <option value="early_leave_sick">Sakit di Sekolah</option>
                                            <option value="early_leave_urgent">Keperluan Mendesak</option>
                                            <option value="other">Lainnya</option>
                                        </select>
                                        {editForm.errors.type && (
                                            <p className="text-red-500 text-[11px] mt-1">{editForm.errors.type}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                            Jam Keluar:
                                        </label>
                                        <input
                                            type="time"
                                            value={editForm.data.departure_time}
                                            onChange={(e) => editForm.setData('departure_time', e.target.value)}
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-bold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white"
                                            required
                                        />
                                        {editForm.errors.departure_time && (
                                            <p className="text-red-500 text-[11px] mt-1">{editForm.errors.departure_time}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Alasan Kepulangan */}
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                        Alasan Kepulangan:
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={editForm.data.reason}
                                        onChange={(e) => editForm.setData('reason', e.target.value)}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white"
                                        required
                                    />
                                    {editForm.errors.reason && (
                                        <p className="text-red-500 text-[11px] mt-1">{editForm.errors.reason}</p>
                                    )}
                                </div>

                                {/* Nama Penjemput / Wali */}
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                        Nama Penjemput / Wali:
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Ibu Kandung (Ibu Dewi)"
                                        value={editForm.data.pickup_person}
                                        onChange={(e) => editForm.setData('pickup_person', e.target.value)}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white"
                                    />
                                    {editForm.errors.pickup_person && (
                                        <p className="text-red-500 text-[11px] mt-1">{editForm.errors.pickup_person}</p>
                                    )}
                                </div>

                                {/* Bukti / Surat Jalan */}
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                        Bukti / Surat Jalan:
                                    </label>
                                    {editingRecord.attachment_url && !editForm.data.delete_proof && (
                                        <div className="mb-2 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800">
                                            <a
                                                href={editingRecord.attachment_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-[#FF6B35] font-bold hover:underline"
                                            >
                                                <Paperclip className="size-3.5" />
                                                Lihat Lampiran Tersimpan
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => editForm.setData('delete_proof', true)}
                                                className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                                            >
                                                Hapus Lampiran
                                            </button>
                                        </div>
                                    )}
                                    {editForm.data.delete_proof && (
                                        <div className="mb-2 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                                            <span>Lampiran akan dihapus saat disimpan.</span>
                                            <button
                                                type="button"
                                                onClick={() => editForm.setData('delete_proof', false)}
                                                className="text-xs font-bold underline cursor-pointer"
                                            >
                                                Batal Hapus
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) =>
                                            editForm.setData('proof', e.target.files ? e.target.files[0] : null)
                                        }
                                        className="text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FFF0EB] file:text-[#FF6B35] hover:file:bg-[#FFE66D]"
                                    />
                                    <span className="text-[11px] text-gray-400 block mt-1">
                                        Unggah berkas baru (JPG, PNG, atau PDF maks 2MB) untuk mengganti lampiran sebelumnya.
                                    </span>
                                    {editForm.errors.proof && (
                                        <p className="text-red-500 text-[11px] mt-1">{editForm.errors.proof}</p>
                                    )}
                                </div>

                                <DialogFooter className="mt-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingRecord(null)}
                                        disabled={editForm.processing}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={editForm.processing}
                                        className="text-white"
                                    >
                                        {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Modal Konfirmasi Hapus */}
                <Dialog open={!!deletingRecord} onOpenChange={(open) => !open && setDeletingRecord(null)}>
                    <DialogContent className="sm:max-w-[420px]">
                        <DialogHeader>
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-2">
                                <Trash2 className="size-5" />
                            </div>
                            <DialogTitle className="text-base font-extrabold text-gray-900 dark:text-white">
                                Hapus Data Absen Khusus?
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                Data izin pulang awal untuk{' '}
                                <strong className="text-gray-900 dark:text-white">{deletingRecord?.student_name}</strong> ({deletingRecord?.classroom})
                                pada tanggal {selectedDate} akan dihapus dari sistem.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                            <div>Alasan: <strong>{deletingRecord?.reason}</strong></div>
                            <div className="text-[11px] text-gray-400 mt-1">
                                Catatan pulang awal pada presensi harian siswa juga akan dibersihkan secara otomatis.
                            </div>
                        </div>

                        <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingRecord(null)}
                                disabled={isDeleting}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="text-white bg-red-600 hover:bg-red-700"
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdjustmentsPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Absen Khusus', href: '/attendances/adjustments' },
    ],
};

