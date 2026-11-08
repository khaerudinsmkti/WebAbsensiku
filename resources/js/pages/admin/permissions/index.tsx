import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRightLeft,
    BookOpenCheck,
    Building2,
    Calendar,
    CalendarDays,
    Check,
    CheckCheck,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ClipboardCheck,
    Clock,
    Database,
    FileSpreadsheet,
    GraduationCap,
    HelpCircle,
    Images,
    Info,
    KeyRound,
    Lock,
    MessageSquareQuote,
    Newspaper,
    PhoneCall,
    RefreshCw,
    RotateCcw,
    Save,
    School,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sliders,
    Sparkles,
    User,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PermissionItem {
    label: string;
    description: string;
}

interface ModuleItem {
    key: string;
    name: string;
    category: string;
    description: string;
    icon: string;
    permissions: Record<string, PermissionItem>;
}

interface RoleItem {
    key: string;
    name: string;
    badge: string;
    description: string;
    color: string;
    is_locked?: boolean;
}

interface CategoryItem {
    key: string;
    name: string;
    description: string;
    icon: string;
}

type MatrixState = Record<string, Record<string, Record<string, boolean>>>;

interface Props {
    roles: Record<string, RoleItem>;
    modules: Record<string, ModuleItem>;
    categories: Record<string, CategoryItem>;
    matrix: MatrixState;
    defaults: MatrixState;
}

// Icon dictionary lookup helper
const ICON_MAP: Record<string, React.ElementType> = {
    UserCheck,
    Clock,
    CalendarDays,
    BookOpenCheck,
    FileSpreadsheet,
    Users,
    Shield,
    GraduationCap,
    Newspaper,
    Images,
    Building2,
    MessageSquareQuote,
    PhoneCall,
    School,
    Calendar,
    ShieldCheck,
    Sliders,
    ClipboardCheck,
    Database,
    KeyRound,
};

const getModuleIcon = (iconName: string) => {
    const IconComp = ICON_MAP[iconName] || ShieldCheck;
    return <IconComp className="size-4 shrink-0" />;
};

const getRoleBadgeVariant = (roleKey: string) => {
    switch (roleKey) {
        case 'admin':
            return 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50 dark:bg-red-500/20 dark:text-red-400';
        case 'principal':
            return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/50 dark:bg-blue-500/20 dark:text-blue-400';
        case 'teacher':
            return 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/50 dark:bg-emerald-500/20 dark:text-emerald-400';
        case 'publisher':
            return 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50 dark:bg-amber-500/20 dark:text-amber-400';
        case 'student':
            return 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800 dark:bg-slate-500/20 dark:text-slate-400';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export default function PermissionMatrixPage({
    roles,
    modules,
    categories,
    matrix: initialMatrix,
    defaults,
}: Props) {
    const [matrix, setMatrix] = useState<MatrixState>(() => JSON.parse(JSON.stringify(initialMatrix)));
    const [isSaving, setIsSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

    const roleKeys = useMemo(() => Object.keys(roles), [roles]);
    const moduleList = useMemo(() => Object.values(modules), [modules]);
    const categoryList = useMemo(() => Object.values(categories), [categories]);

    // Track dirty state (changes count)
    const dirtyCount = useMemo(() => {
        let count = 0;
        for (const roleKey of roleKeys) {
            if (roles[roleKey]?.is_locked) continue;
            for (const mod of moduleList) {
                for (const permKey of Object.keys(mod.permissions)) {
                    const currentVal = !!matrix[roleKey]?.[mod.key]?.[permKey];
                    const initialVal = !!initialMatrix[roleKey]?.[mod.key]?.[permKey];
                    if (currentVal !== initialVal) {
                        count++;
                    }
                }
            }
        }
        return count;
    }, [matrix, initialMatrix, roleKeys, moduleList, roles]);

    // Count active permissions per role
    const activePermStats = useMemo(() => {
        const stats: Record<string, { granted: number; total: number }> = {};
        for (const roleKey of roleKeys) {
            let granted = 0;
            let total = 0;
            for (const mod of moduleList) {
                for (const permKey of Object.keys(mod.permissions)) {
                    total++;
                    if (roles[roleKey]?.is_locked || matrix[roleKey]?.[mod.key]?.[permKey]) {
                        granted++;
                    }
                }
            }
            stats[roleKey] = { granted, total };
        }
        return stats;
    }, [matrix, roleKeys, moduleList, roles]);

    // Filter modules based on search and selected category
    const filteredModules = useMemo(() => {
        return moduleList.filter((mod) => {
            const matchesCategory = selectedCategory === 'all' || mod.category === selectedCategory;
            if (!matchesCategory) return false;

            if (!searchQuery.trim()) return true;

            const q = searchQuery.toLowerCase();
            const matchesName = mod.name.toLowerCase().includes(q);
            const matchesDesc = mod.description.toLowerCase().includes(q);
            const matchesPerm = Object.entries(mod.permissions).some(
                ([k, v]) => k.toLowerCase().includes(q) || v.label.toLowerCase().includes(q) || v.description.toLowerCase().includes(q)
            );

            return matchesName || matchesDesc || matchesPerm;
        });
    }, [moduleList, selectedCategory, searchQuery]);

    // Toggle single permission for role
    const handleTogglePermission = (roleKey: string, moduleKey: string, permissionKey: string) => {
        if (roles[roleKey]?.is_locked) return;

        setMatrix((prev) => {
            const next = { ...prev };
            if (!next[roleKey]) next[roleKey] = {};
            if (!next[roleKey][moduleKey]) next[roleKey][moduleKey] = {};

            next[roleKey][moduleKey] = {
                ...next[roleKey][moduleKey],
                [permissionKey]: !next[roleKey][moduleKey][permissionKey],
            };
            return next;
        });
    };

    // Bulk toggle all permissions for a module for a specific role
    const handleToggleModuleForRole = (roleKey: string, moduleKey: string) => {
        if (roles[roleKey]?.is_locked) return;

        const mod = modules[moduleKey];
        if (!mod) return;

        const permKeys = Object.keys(mod.permissions);
        const allChecked = permKeys.every((pk) => !!matrix[roleKey]?.[moduleKey]?.[pk]);
        const targetValue = !allChecked;

        setMatrix((prev) => {
            const next = { ...prev };
            if (!next[roleKey]) next[roleKey] = {};
            next[roleKey][moduleKey] = { ...(next[roleKey][moduleKey] || {}) };

            permKeys.forEach((pk) => {
                next[roleKey][moduleKey][pk] = targetValue;
            });

            return next;
        });
    };

    // Bulk toggle an entire role across filtered modules
    const handleBulkRoleFiltered = (roleKey: string, grantAll: boolean) => {
        if (roles[roleKey]?.is_locked) return;

        setMatrix((prev) => {
            const next = { ...prev };
            if (!next[roleKey]) next[roleKey] = {};

            filteredModules.forEach((mod) => {
                if (!next[roleKey][mod.key]) next[roleKey][mod.key] = {};
                Object.keys(mod.permissions).forEach((permKey) => {
                    next[roleKey][mod.key][permKey] = grantAll;
                });
            });

            return next;
        });
    };

    // Toggle collapse for a module
    const toggleCollapse = (modKey: string) => {
        setCollapsedModules((prev) => ({
            ...prev,
            [modKey]: !prev[modKey],
        }));
    };

    // Collapse or expand all
    const handleExpandAll = () => setCollapsedModules({});
    const handleCollapseAll = () => {
        const allCollapsed: Record<string, boolean> = {};
        moduleList.forEach((m) => {
            allCollapsed[m.key] = true;
        });
        setCollapsedModules(allCollapsed);
    };

    // Save changes
    const handleSave = () => {
        setIsSaving(true);
        router.post(
            '/admin/permissions',
            { matrix },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Pengaturan hak akses berhasil disimpan dan diperbarui.');
                },
                onError: () => {
                    toast.error('Gagal menyimpan perubahan hak akses. Silakan periksa kembali formulir.');
                },
                onFinish: () => {
                    setIsSaving(false);
                },
            }
        );
    };

    // Reset to defaults
    const handleReset = () => {
        setIsResetting(true);
        router.post(
            '/admin/permissions/reset',
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsResetDialogOpen(false);
                    setMatrix(JSON.parse(JSON.stringify(defaults)));
                    toast.success('Pengaturan hak akses berhasil dikembalikan ke standar awal sistem.');
                },
                onError: () => {
                    toast.error('Gagal mengembalikan pengaturan standar.');
                },
                onFinish: () => {
                    setIsResetting(false);
                },
            }
        );
    };

    // Revert local changes
    const handleRevertLocal = () => {
        setMatrix(JSON.parse(JSON.stringify(initialMatrix)));
        toast.info('Perubahan lokal yang belum disimpan telah dibatalkan.');
    };

    return (
        <>
            <Head title="Matriks Pengaturan Hak Akses" />

            {/* Top Container strictly bounded with w-full min-w-0 */}
            <div className="w-full min-w-0 max-w-7xl mx-auto space-y-5 px-3 sm:px-6 lg:px-8 py-5">
                {/* Header Banner */}
                <PageBanner
                    badgeText="Keamanan & Autorisasi Sistem"
                    title="Matriks Pengaturan Hak Akses"
                    description="Kelola wewenang dan batasan operasional setiap peran pengguna secara granular dan terintegrasi untuk seluruh fitur aplikasi."
                    icon={<ShieldCheck className="size-6 text-white" />}
                    action={
                        <div className="flex flex-wrap items-center gap-2">
                            {dirtyCount > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleRevertLocal}
                                    className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md text-xs font-medium h-9"
                                >
                                    <RotateCcw className="size-3.5 mr-1.5" />
                                    Batal Perubahan
                                </Button>
                            )}
                            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md text-xs font-medium h-9"
                                    >
                                        <RefreshCw className="size-3.5 mr-1.5" />
                                        Reset Standar
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 mb-2">
                                            <ShieldAlert className="size-6" />
                                        </div>
                                        <DialogTitle className="text-center text-lg font-bold">
                                            Kembalikan ke Standar Bawaan?
                                        </DialogTitle>
                                        <DialogDescription className="text-center text-sm text-gray-500 dark:text-gray-400">
                                            Tindakan ini akan mengembalikan seluruh matriks hak akses peran (Kepala Sekolah, Guru, Humas, Siswa) ke konfigurasi default yang direkomendasikan sistem.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
                                        <DialogClose asChild>
                                            <Button type="button" variant="outline">
                                                Batal
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            disabled={isResetting}
                                            onClick={handleReset}
                                            className="font-medium"
                                        >
                                            {isResetting ? (
                                                <>
                                                    <RefreshCw className="size-4 mr-1.5 animate-spin" />
                                                    Mengembalikan...
                                                </>
                                            ) : (
                                                'Ya, Kembalikan ke Standar'
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving || dirtyCount === 0}
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
                                        Simpan Perubahan
                                        {dirtyCount > 0 && (
                                            <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                                                {dirtyCount}
                                            </span>
                                        )}
                                    </>
                                )}
                            </Button>
                        </div>
                    }
                />

                {/* Floating Unsaved Changes Notification Bar */}
                {dirtyCount > 0 && (
                    <div className="sticky top-3 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/95 px-4 py-2.5 shadow-lg backdrop-blur-md dark:border-amber-700/60 dark:bg-amber-950/90 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs shadow-xs">
                                !
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 truncate">
                                    Ada {dirtyCount} perubahan wewenang belum disimpan
                                </p>
                                <p className="text-[11px] text-amber-700 dark:text-amber-400 hidden sm:block">
                                    Tekan tombol Simpan Perubahan agar wewenang baru segera diterapkan.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={handleRevertLocal}
                                className="h-8 text-xs text-amber-900 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40"
                            >
                                Urungkan
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-8 bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold shadow-xs"
                            >
                                <Save className="size-3 mr-1" />
                                Simpan Sekarang
                            </Button>
                        </div>
                    </div>
                )}

                {/* Role Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 w-full min-w-0">
                    {roleKeys.map((rKey) => {
                        const role = roles[rKey];
                        const stats = activePermStats[rKey] || { granted: 0, total: 1 };
                        const percent = Math.round((stats.granted / stats.total) * 100);

                        return (
                            <div
                                key={rKey}
                                className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200/80 bg-white p-3 shadow-xs transition-all hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 min-w-0"
                            >
                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 truncate ${getRoleBadgeVariant(rKey)}`}>
                                            {role.badge}
                                        </Badge>
                                        {role.is_locked ? (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="flex size-4.5 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 shrink-0">
                                                            <Lock className="size-2.5" />
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <p className="text-xs">Akses Administrator Terkunci Penuh (Superuser)</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 shrink-0">
                                                {percent}%
                                            </span>
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {role.name}
                                        </h3>
                                        <p className="mt-0.5 line-clamp-2 text-[10px] text-gray-500 leading-snug dark:text-gray-400">
                                            {role.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800/80">
                                    <div className="flex items-center justify-between text-[10px] mb-1 font-medium text-gray-600 dark:text-gray-400">
                                        <span>Aktif</span>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {stats.granted}/{stats.total}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                        <div
                                            className={`h-full transition-all duration-300 ${
                                                rKey === 'admin'
                                                    ? 'bg-red-500'
                                                    : rKey === 'principal'
                                                    ? 'bg-blue-500'
                                                    : rKey === 'teacher'
                                                    ? 'bg-emerald-500'
                                                    : rKey === 'publisher'
                                                    ? 'bg-amber-500'
                                                    : 'bg-slate-500'
                                            }`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Controls & Filter Bar */}
                <div className="rounded-xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-3 w-full min-w-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md min-w-0">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Cari modul atau wewenang izin..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 text-xs h-8.5 bg-gray-50/50 dark:bg-gray-800/40"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Expand / Collapse All buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleExpandAll}
                                className="h-7.5 px-2.5 text-xs font-medium text-gray-600 dark:text-gray-300"
                            >
                                Buka Semua
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCollapseAll}
                                className="h-7.5 px-2.5 text-xs font-medium text-gray-600 dark:text-gray-300"
                            >
                                Tutup Semua
                            </Button>
                        </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1 flex items-center gap-1">
                            <Sliders className="size-3.5" /> Kategori:
                        </span>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                                selectedCategory === 'all'
                                    ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            Semua ({moduleList.length})
                        </button>
                        {categoryList.map((cat) => {
                            const count = moduleList.filter((m) => m.category === cat.key).length;
                            return (
                                <button
                                    key={cat.key}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.key)}
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                                        selectedCategory === cat.key
                                            ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {cat.name} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Matrix Table View Card */}
                <div className="w-full min-w-0 max-w-full rounded-xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                    {/* Horizontal Scroll Hint on smaller viewports */}
                    <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-gray-100 bg-gray-50/80 text-[11px] text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 xl:hidden">
                        <span className="flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-300">
                            <ArrowRightLeft className="size-3 text-[var(--brand-primary)] shrink-0" />
                            Tampilan dapat digeser ke samping (scroll horizontal)
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Geser untuk melihat semua peran →</span>
                    </div>

                    {/* Scrollable Container with overflow-x-auto */}
                    <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
                        <table className="w-full min-w-[760px] sm:min-w-[820px] text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/90 dark:border-gray-800 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200">
                                    {/* Sticky First Column Header */}
                                    <th className="sticky left-0 z-20 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-xs py-3 px-3 sm:px-4 font-bold text-xs uppercase tracking-wider min-w-[240px] sm:min-w-[280px] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                                        Modul & Tindakan Wewenang
                                    </th>

                                    {/* Role Column Headers */}
                                    {roleKeys.map((rKey) => {
                                        const role = roles[rKey];
                                        return (
                                            <th
                                                key={rKey}
                                                className="py-3 px-2 text-center font-bold text-xs uppercase tracking-wider w-[100px] sm:w-[115px] min-w-[95px] sm:min-w-[110px]"
                                            >
                                                <div className="flex flex-col items-center justify-center gap-0.5 min-w-0">
                                                    <span className="font-extrabold text-gray-900 dark:text-white text-xs truncate max-w-[100px]">
                                                        {role.name}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[9px] font-bold px-1.5 py-0 ${getRoleBadgeVariant(rKey)}`}
                                                    >
                                                        {role.badge}
                                                    </Badge>
                                                    {!role.is_locked && (
                                                        <div className="mt-0.5 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleBulkRoleFiltered(rKey, true)}
                                                                title="Beri semua hak akses pada kategori ini"
                                                                className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                                            >
                                                                Semua
                                                            </button>
                                                            <span className="text-[9px] text-gray-300 dark:text-gray-600">|</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleBulkRoleFiltered(rKey, false)}
                                                                title="Hapus semua hak akses pada kategori ini"
                                                                className="text-[9px] font-semibold text-red-600 dark:text-red-400 hover:underline"
                                                            >
                                                                Cabut
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                                {filteredModules.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={roleKeys.length + 1}
                                            className="py-12 text-center text-gray-500 dark:text-gray-400"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <AlertCircle className="size-8 text-gray-300 dark:text-gray-600" />
                                                <p className="font-semibold text-sm">Tidak ada modul yang cocok dengan pencarian.</p>
                                                <p className="text-xs text-gray-400">Silakan ubah filter kategori atau kata kunci Anda.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredModules.map((mod) => {
                                        const isCollapsed = collapsedModules[mod.key];
                                        const permEntries = Object.entries(mod.permissions);

                                        return (
                                            <React.Fragment key={mod.key}>
                                                {/* Module Section Header Row */}
                                                <tr className="bg-gray-50/70 hover:bg-gray-100/70 dark:bg-gray-800/40 dark:hover:bg-gray-800/60 transition-colors">
                                                    {/* Sticky Module Info Column */}
                                                    <td className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-850 py-2.5 px-3 sm:px-4 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[240px] sm:min-w-[280px]">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleCollapse(mod.key)}
                                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-transform p-0.5 shrink-0"
                                                            >
                                                                {isCollapsed ? (
                                                                    <ChevronRight className="size-4" />
                                                                ) : (
                                                                    <ChevronDown className="size-4" />
                                                                )}
                                                            </button>
                                                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] dark:bg-[var(--brand-primary)]/20">
                                                                {getModuleIcon(mod.icon)}
                                                            </div>
                                                            <div className="cursor-pointer select-none min-w-0 flex-1" onClick={() => toggleCollapse(mod.key)}>
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                                                                        {mod.name}
                                                                    </h4>
                                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                                        ({permEntries.length})
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                                                                    {mod.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Quick Module-level bulk toggle for each role */}
                                                    {roleKeys.map((rKey) => {
                                                        const isRoleLocked = roles[rKey]?.is_locked;
                                                        const allChecked = permEntries.every(
                                                            ([pk]) => isRoleLocked || !!matrix[rKey]?.[mod.key]?.[pk]
                                                        );
                                                        const someChecked = permEntries.some(
                                                            ([pk]) => isRoleLocked || !!matrix[rKey]?.[mod.key]?.[pk]
                                                        );

                                                        return (
                                                            <td key={rKey} className="py-2.5 px-2 text-center align-middle w-[100px] sm:w-[115px] min-w-[95px] sm:min-w-[110px]">
                                                                {isRoleLocked ? (
                                                                    <div className="flex items-center justify-center">
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <div className="flex size-5.5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 cursor-not-allowed">
                                                                                        <Check className="size-3.5 stroke-[3]" />
                                                                                    </div>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent side="top">
                                                                                    <p className="text-xs">Administrator selalu memiliki hak akses penuh.</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    </div>
                                                                ) : (
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleToggleModuleForRole(rKey, mod.key)}
                                                                                    className={`inline-flex items-center justify-center size-5.5 rounded-md border text-xs transition-colors ${
                                                                                        allChecked
                                                                                            ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                                                                                            : someChecked
                                                                                            ? 'bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] border-[var(--brand-primary)]/40 font-bold'
                                                                                            : 'border-gray-300 bg-white text-gray-400 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800'
                                                                                    }`}
                                                                                >
                                                                                    {allChecked ? (
                                                                                        <Check className="size-3 stroke-[2.5]" />
                                                                                    ) : someChecked ? (
                                                                                        <span className="size-1.5 rounded-xs bg-[var(--brand-primary)]" />
                                                                                    ) : null}
                                                                                </button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent side="top">
                                                                                <p className="text-xs">
                                                                                    {allChecked
                                                                                        ? 'Cabut semua izin modul ini'
                                                                                        : 'Beri semua izin modul ini'}
                                                                                </p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>

                                                {/* Detailed Permission Rows */}
                                                {!isCollapsed &&
                                                    permEntries.map(([permKey, perm]) => {
                                                        return (
                                                            <tr
                                                                key={`${mod.key}-${permKey}`}
                                                                className="group hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors"
                                                            >
                                                                {/* Sticky Permission Name & Description */}
                                                                <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 dark:bg-gray-900 dark:group-hover:bg-gray-850 py-2 px-3 sm:px-4 pl-8 sm:pl-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] min-w-[240px] sm:min-w-[280px]">
                                                                    <div className="flex flex-col min-w-0">
                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                            <span className="size-1.5 rounded-full bg-gray-400 dark:bg-gray-600 shrink-0" />
                                                                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">
                                                                                {perm.label}
                                                                            </span>
                                                                            <code className="text-[9px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.2 rounded font-mono">
                                                                                {permKey}
                                                                            </code>
                                                                        </div>
                                                                        <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 pl-3 mt-0.5 line-clamp-1">
                                                                            {perm.description}
                                                                        </span>
                                                                    </div>
                                                                </td>

                                                                {/* Checkboxes per role */}
                                                                {roleKeys.map((rKey) => {
                                                                    const isLocked = roles[rKey]?.is_locked;
                                                                    const isChecked = isLocked || !!matrix[rKey]?.[mod.key]?.[permKey];

                                                                    return (
                                                                        <td
                                                                            key={rKey}
                                                                            className="py-2 px-2 text-center align-middle w-[100px] sm:w-[115px] min-w-[95px] sm:min-w-[110px]"
                                                                        >
                                                                            <div className="flex items-center justify-center">
                                                                                {isLocked ? (
                                                                                    <TooltipProvider>
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger asChild>
                                                                                                <div className="flex size-4.5 items-center justify-center rounded-sm bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed">
                                                                                                    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                                                                                                </div>
                                                                                            </TooltipTrigger>
                                                                                            <TooltipContent side="top">
                                                                                                <p className="text-xs">
                                                                                                    Terkunci permanen untuk Administrator.
                                                                                                </p>
                                                                                            </TooltipContent>
                                                                                        </Tooltip>
                                                                                    </TooltipProvider>
                                                                                ) : (
                                                                                    <label className="cursor-pointer p-1">
                                                                                        <Checkbox
                                                                                            checked={isChecked}
                                                                                            onCheckedChange={() =>
                                                                                                handleTogglePermission(
                                                                                                    rKey,
                                                                                                    mod.key,
                                                                                                    permKey
                                                                                                )
                                                                                            }
                                                                                            className="size-4 rounded-sm border-gray-300 data-[state=checked]:bg-[var(--brand-primary)] data-[state=checked]:border-[var(--brand-primary)]"
                                                                                        />
                                                                                    </label>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        );
                                                    })}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Notes & Legend */}
                <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-3 sm:p-4 dark:border-gray-800 dark:bg-gray-900/60 w-full min-w-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2 min-w-0">
                            <Info className="size-4 text-[var(--brand-primary)] shrink-0" />
                            <span className="text-[11px] sm:text-xs">
                                <strong>Catatan:</strong> Perubahan hak akses berlaku seketika bagi seluruh akun pengguna pada navigasi berikutnya.
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] shrink-0">
                            <span className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-emerald-500 inline-block" /> Diizinkan
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-gray-300 dark:bg-gray-700 inline-block" /> Tidak Diizinkan
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Lock className="size-2.5 text-red-500 inline-block" /> Terkunci
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

PermissionMatrixPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pengaturan Sekolah', href: '/admin/school-settings' },
        { title: 'Matriks Hak Akses', href: '/admin/permissions' },
    ],
};
