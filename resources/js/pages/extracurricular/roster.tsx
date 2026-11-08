import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    Check,
    CheckCircle2,
    Filter,
    GraduationCap,
    HelpCircle,
    Info,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageBanner } from '@/components/page-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

interface MemberItem {
    id: number;
    student_id: number;
    name: string;
    nisn: string;
    classroom_name: string;
    notes?: string;
}

interface StudentOption {
    id: number;
    name: string;
    nisn: string;
    classroom_id?: number;
    classroom_name: string;
}

interface ClassroomOption {
    id: number;
    name: string;
}

interface Props {
    members: MemberItem[];
    allStudents: StudentOption[];
    classrooms: ClassroomOption[];
}

export default function ExtracurricularRoster({
    members: initialMembers,
    allStudents,
    classrooms,
}: Props) {
    // Current selected student IDs in roster
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>(() =>
        initialMembers.map((m) => m.student_id)
    );

    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassroomId, setSelectedClassroomId] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'roster' | 'add'>('roster');

    // Dirty state
    const isDirty = useMemo(() => {
        const initialSet = new Set(initialMembers.map((m) => m.student_id));
        const currentSet = new Set(selectedStudentIds);
        if (initialSet.size !== currentSet.size) return true;
        for (const id of currentSet) {
            if (!initialSet.has(id)) return true;
        }
        return false;
    }, [initialMembers, selectedStudentIds]);

    // Active roster student objects
    const currentRosterStudents = useMemo(() => {
        const idSet = new Set(selectedStudentIds);
        return allStudents.filter((s) => idSet.has(s.id));
    }, [allStudents, selectedStudentIds]);

    // Filtered roster students for searching in the active list
    const filteredRoster = useMemo(() => {
        if (!searchQuery.trim()) return currentRosterStudents;
        const q = searchQuery.toLowerCase();
        return currentRosterStudents.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                (s.nisn && s.nisn.toLowerCase().includes(q)) ||
                (s.classroom_name && s.classroom_name.toLowerCase().includes(q))
        );
    }, [currentRosterStudents, searchQuery]);

    // Filtered all students for adding new members
    const filteredAddPool = useMemo(() => {
        return allStudents.filter((student) => {
            const matchesClass =
                selectedClassroomId === 'all' ||
                student.classroom_id === Number(selectedClassroomId);
            if (!matchesClass) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                student.name.toLowerCase().includes(q) ||
                (student.nisn && student.nisn.toLowerCase().includes(q)) ||
                (student.classroom_name && student.classroom_name.toLowerCase().includes(q))
            );
        });
    }, [allStudents, selectedClassroomId, searchQuery]);

    // Toggle student membership in roster
    const handleToggleStudent = (studentId: number) => {
        setSelectedStudentIds((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    // Remove single student from roster
    const handleRemoveMember = (studentId: number) => {
        setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
    };

    // Bulk select all in filtered pool
    const handleSelectAllFiltered = () => {
        const toAdd = filteredAddPool.map((s) => s.id);
        setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...toAdd])));
    };

    // Bulk unselect all in filtered pool
    const handleUnselectAllFiltered = () => {
        const toRemove = new Set(filteredAddPool.map((s) => s.id));
        setSelectedStudentIds((prev) => prev.filter((id) => !toRemove.has(id)));
    };

    // Clear all members
    const handleClearAll = () => {
        setSelectedStudentIds([]);
    };

    // Save roster to server
    const handleSaveRoster = () => {
        setIsSaving(true);
        router.post(
            '/extracurricular/roster',
            { student_ids: selectedStudentIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Daftar anggota ekskul default berhasil disimpan.');
                },
                onError: () => {
                    toast.error('Gagal menyimpan daftar anggota.');
                },
                onFinish: () => {
                    setIsSaving(false);
                },
            }
        );
    };

    return (
        <>
            <Head title="Kelola Anggota Ekskul Default" />

            <div className="w-full min-w-0 max-w-5xl mx-auto space-y-5 px-3 sm:px-6 lg:px-8 py-5">
                {/* Header Banner */}
                <PageBanner
                    badgeText="Manajemen Siswa Ekskul"
                    title="Daftar Anggota Ekskul Default"
                    description="Atur daftar murid tetap ekstrakurikuler Anda. Murid di daftar ini akan otomatis dimuat sebagai daftar hadir bawaan saat Anda membuat form Lapor Ekskul."
                    icon={<Users className="size-6 text-white" />}
                    action={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                asChild
                                variant="outline"
                                className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md text-xs font-semibold h-9"
                            >
                                <Link href="/extracurricular/reports">
                                    <ArrowLeft className="size-3.5 mr-1.5" />
                                    Kembali ke Laporan
                                </Link>
                            </Button>

                            <Button
                                type="button"
                                onClick={handleSaveRoster}
                                disabled={isSaving || !isDirty}
                                className="bg-white text-gray-900 hover:bg-white/90 shadow-md font-bold text-xs sm:text-sm h-9 disabled:opacity-60"
                            >
                                {isSaving ? (
                                    <>
                                        <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="size-3.5 mr-1.5 text-emerald-600" />
                                        Simpan Anggota ({selectedStudentIds.length})
                                    </>
                                )}
                            </Button>
                        </div>
                    }
                />

                {/* Explanatory Info Card */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 flex items-start gap-2.5">
                    <Info className="size-4 shrink-0 text-blue-600 mt-0.5" />
                    <div>
                        <p className="font-bold">Cara Kerja Daftar Anggota Default:</p>
                        <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed">
                            Dengan mendaftarkan siswa di halaman ini, setiap kali Anda membuka menu <strong>Buat Laporan Baru</strong>, seluruh nama siswa di bawah ini akan otomatis muncul dalam checklist presensi tanpa perlu mencari satu per satu. Anda tetap dapat menambahkan atau mencoret siswa pada hari-hari latihan tertentu jika diperlukan.
                        </p>
                    </div>
                </div>

                {/* Tabs & Search Controls */}
                <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 sm:p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-3 w-full min-w-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        {/* Tab Switcher */}
                        <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setActiveTab('roster')}
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                                    activeTab === 'roster'
                                        ? 'bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                                }`}
                            >
                                <UserCheck className="size-3.5" />
                                Anggota Terpilih ({selectedStudentIds.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('add')}
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                                    activeTab === 'add'
                                        ? 'bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                                }`}
                            >
                                <Plus className="size-3.5" />
                                Tambah Siswa Baru ({allStudents.length} tersedia)
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-xs">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder={activeTab === 'roster' ? 'Cari anggota terpilih...' : 'Cari seluruh database siswa...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 text-xs h-8.5"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter by Classroom on Add Tab */}
                    {activeTab === 'add' && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                            <span className="font-semibold text-gray-500 flex items-center gap-1">
                                <Filter className="size-3" /> Filter Kelas:
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedClassroomId('all')}
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    selectedClassroomId === 'all'
                                        ? 'bg-[var(--brand-primary)] text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                }`}
                            >
                                Semua Kelas
                            </button>
                            {classrooms.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setSelectedClassroomId(String(c.id))}
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                        selectedClassroomId === String(c.id)
                                            ? 'bg-[var(--brand-primary)] text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                    }`}
                                >
                                    {c.name}
                                </button>
                            ))}

                            <div className="ml-auto flex gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleSelectAllFiltered}
                                    className="text-[11px] font-semibold text-emerald-600 hover:underline"
                                >
                                    Pilih Semua di Hasil Ini
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    type="button"
                                    onClick={handleUnselectAllFiltered}
                                    className="text-[11px] font-semibold text-red-600 hover:underline"
                                >
                                    Batal Semua
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* TAB 1: Roster View */}
                {activeTab === 'roster' && (
                    <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                        <div className="flex items-center justify-between bg-gray-50/80 px-4 py-2.5 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200 border-b">
                            <span>Daftar Siswa Anggota Tetap ({filteredRoster.length} siswa)</span>
                            {selectedStudentIds.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className="text-[11px] font-semibold text-red-600 hover:underline"
                                >
                                    Kosongkan Seluruh Anggota
                                </button>
                            )}
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredRoster.length === 0 ? (
                                <div className="p-12 text-center text-xs text-gray-400 space-y-2">
                                    <Users className="size-8 mx-auto text-gray-300" />
                                    <p className="font-semibold text-gray-600 dark:text-gray-300">
                                        {selectedStudentIds.length === 0
                                            ? 'Belum ada siswa yang didaftarkan ke anggota ekskul.'
                                            : 'Tidak ada siswa yang cocok dengan pencarian.'}
                                    </p>
                                    <p className="text-[11px]">
                                        Buka tab <strong>Tambah Siswa Baru</strong> untuk memilih siswa dari daftar kelas.
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setActiveTab('add')}
                                        className="mt-2 text-xs"
                                    >
                                        <Plus className="size-3.5 mr-1" />
                                        Pilih Siswa Sekarang
                                    </Button>
                                </div>
                            ) : (
                                filteredRoster.map((student, idx) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center justify-between p-3 text-xs hover:bg-gray-50/60 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-[11px] text-gray-400 w-5 text-right">
                                                {idx + 1}.
                                            </span>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">
                                                    {student.name}
                                                </p>
                                                <p className="text-[11px] text-gray-500">
                                                    Kelas: <strong>{student.classroom_name}</strong> • NISN: {student.nisn || '-'}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRemoveMember(student.id)}
                                            className="h-7 px-2 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700"
                                            title="Hapus dari daftar anggota default"
                                        >
                                            <Trash2 className="size-3.5 mr-1" />
                                            Hapus
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: Add Members Pool */}
                {activeTab === 'add' && (
                    <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                        <div className="bg-gray-50/80 px-4 py-2 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200 border-b flex justify-between items-center">
                            <span>Database Seluruh Siswa ({filteredAddPool.length} tampil)</span>
                            <span className="text-[11px] text-gray-500 font-normal">
                                Centang kotak di samping nama murid untuk mendaftarkannya ke ekskul.
                            </span>
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[500px] overflow-y-auto">
                            {filteredAddPool.length === 0 ? (
                                <div className="p-8 text-center text-xs text-gray-400">
                                    Tidak ada data siswa yang cocok dengan filter yang dipilih.
                                </div>
                            ) : (
                                filteredAddPool.map((student) => {
                                    const isSelected = selectedStudentIds.includes(student.id);

                                    return (
                                        <label
                                            key={student.id}
                                            className={`flex items-center justify-between p-3 text-xs cursor-pointer select-none transition-colors ${
                                                isSelected ? 'bg-purple-50/50 dark:bg-purple-950/20' : 'hover:bg-gray-50/60 dark:hover:bg-gray-800/40'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleToggleStudent(student.id)}
                                                    className="size-4.5 data-[state=checked]:bg-[var(--brand-primary)] data-[state=checked]:border-[var(--brand-primary)]"
                                                />
                                                <div>
                                                    <p className={`font-bold ${isSelected ? 'text-[var(--brand-primary)] font-extrabold' : 'text-gray-900 dark:text-white'}`}>
                                                        {student.name}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">
                                                        Kelas {student.classroom_name} • NISN: {student.nisn || '-'}
                                                    </p>
                                                </div>
                                            </div>

                                            <Badge
                                                variant="outline"
                                                className={
                                                    isSelected
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                        : 'bg-gray-50 text-gray-500 border-gray-200'
                                                }
                                            >
                                                {isSelected ? '✓ Terdaftar Anggota' : 'Belum Ditambahkan'}
                                            </Badge>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* Save Bar */}
                {isDirty && (
                    <div className="sticky bottom-4 z-20 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/95 p-3.5 shadow-lg backdrop-blur-md dark:border-amber-700 dark:bg-amber-950/90">
                        <div className="flex items-center gap-2">
                            <span className="flex size-6 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs">
                                !
                            </span>
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                Perubahan anggota belum disimpan ({selectedStudentIds.length} anggota siap diterapkan).
                            </span>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            disabled={isSaving}
                            onClick={handleSaveRoster}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                        >
                            <Save className="size-3.5 mr-1" />
                            Simpan Perubahan
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}

ExtracurricularRoster.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan Ekskul', href: '/extracurricular/reports' },
        { title: 'Daftar Anggota Siswa', href: '/extracurricular/roster' },
    ],
};
