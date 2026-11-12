import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    BellRing,
    BookOpenCheck,
    Building2,
    CalendarCheck,
    CalendarDays,
    ClipboardCheck,
    Clock,
    Database,
    FileSpreadsheet,
    Globe,
    GraduationCap,
    Images,
    LayoutGrid,
    MessageSquareQuote,
    Newspaper,
    PhoneCall,
    School,
    Settings,
    Shield,
    ShieldCheck,
    TrendingUp,
    UserCheck,
    Users,
    Video,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

function getActiveMasterTab(currentUrl: string): string | null {
    if (!currentUrl.startsWith('/master')) {
        return null;
    }

    const queryIndex = currentUrl.indexOf('?');
    if (queryIndex === -1) {
        return 'students';
    }

    const params = new URLSearchParams(currentUrl.slice(queryIndex));
    const tab = params.get('tab');

    if (
        tab === 'alumni' ||
        params.has('alumni_search') ||
        params.has('alumni_graduation_year') ||
        params.has('alumni_classroom_id')
    ) {
        return 'alumni';
    }

    if (
        tab === 'promotions' ||
        tab === 'teachers' ||
        tab === 'classrooms' ||
        tab === 'duty'
    ) {
        return tab;
    }

    return 'students';
}

export function AppSidebar() {
    const { url, props } = usePage();
    const user = props.auth?.user as { role?: string } | undefined;
    const isPublisher = user?.role === 'publisher';
    const isCoach = user?.role === 'coach';
    const isAdmin = user?.role === 'admin';
    const isPrincipal = user?.role === 'principal';
    const isTeacher = user?.role === 'teacher';
    const canManageSchool = isAdmin || isPrincipal;
    const activeMasterTab = getActiveMasterTab(url);

    const permissions = (props.auth as any)?.permissions;
    const can = (module: string, action: string = 'view'): boolean => {
        if (isAdmin || permissions === '*') return true;
        if (!permissions || typeof permissions !== 'object') return false;
        return Boolean(permissions[module]?.[action]);
    };

    const hasMasterAccess =
        isAdmin ||
        can('master_students', 'view') ||
        can('master_teachers', 'view') ||
        can('master_classes', 'view');

    const hasPublikasiAccess =
        isAdmin ||
        can('news', 'view') ||
        can('galleries', 'view') ||
        can('school_profile', 'view') ||
        can('principal_greeting', 'view') ||
        can('contact_messages', 'view');

    const hasSettingsAccess =
        isAdmin ||
        can('school_settings', 'view') ||
        can('holidays', 'view') ||
        can('pwa_notifications', 'view') ||
        can('permissions', 'view');

    const mainNavItems: NavItem[] = isPublisher
        ? [
              {
                  title: 'Publikasi & Konten',
                  href: '/news-management',
                  icon: Newspaper,
                  defaultOpen: true,
                  items: [
                      {
                          title: 'Kelola Berita',
                          href: '/news-management',
                          icon: Newspaper,
                          isActive: url.startsWith('/news-management'),
                      },
                      {
                          title: 'Galeri Kegiatan',
                          href: '/manage/galleries',
                          icon: Images,
                          isActive: url.startsWith('/manage/galleries'),
                      },
                      {
                          title: 'Profil Sekolah',
                          href: '/manage/school-profile',
                          icon: Building2,
                          isActive: url.startsWith('/manage/school-profile'),
                      },
                      {
                          title: 'Profil Guru',
                          href: '/manage/teacher-profiles',
                          icon: GraduationCap,
                          isActive: url.startsWith('/manage/teacher-profiles'),
                      },
                      {
                          title: 'Sambutan Kepala Sekolah',
                          href: '/publisher/principal-greeting',
                          icon: MessageSquareQuote,
                          isActive: url.startsWith('/publisher/principal-greeting'),
                      },
                      {
                          title: 'Kontak Kami',
                          href: '/manage/contact',
                          icon: PhoneCall,
                          isActive: url.startsWith('/manage/contact'),
                      },
                  ],
              },
              {
                  title: 'Halaman Publik',
                  href: '/',
                  icon: Globe,
                  defaultOpen: true,
                  items: [
                      {
                          title: 'Berita Publik',
                          href: '/berita',
                          icon: Globe,
                          isActive: url.startsWith('/berita'),
                      },
                      {
                          title: 'Galeri Publik',
                          href: '/galeri',
                          icon: Images,
                          isActive: url.startsWith('/galeri'),
                      },
                      {
                          title: 'Beranda Sekolah',
                          href: '/',
                          icon: School,
                          isActive: url === '/',
                      },
                  ],
              },
              {
                  title: 'Video Tutorial',
                  href: '/tutorials',
                  icon: Video,
                  isActive: url.startsWith('/tutorials'),
              },
          ]
        : isCoach
        ? [
              {
                  title: 'Ekstrakurikuler',
                  href: '/extracurricular/reports',
                  icon: Award,
                  defaultOpen: true,
                  items: [
                      {
                          title: 'Buat Laporan Ekskul',
                          href: '/extracurricular/reports/create',
                          icon: Award,
                          isActive: url === '/extracurricular/reports/create',
                      },
                      {
                          title: 'Riwayat Laporan',
                          href: '/extracurricular/reports',
                          icon: FileSpreadsheet,
                          isActive:
                              url.startsWith('/extracurricular/reports') &&
                              url !== '/extracurricular/reports/create',
                      },
                      {
                          title: 'Daftar Anggota Siswa',
                          href: '/extracurricular/roster',
                          icon: Users,
                          isActive: url.startsWith('/extracurricular/roster'),
                      },
                  ],
              },
              {
                  title: 'Video Tutorial',
                  href: '/tutorials',
                  icon: Video,
                  isActive: url.startsWith('/tutorials'),
              },
          ]
        : [
              {
                  title: 'Dashboard',
                  href: '/dashboard',
                  icon: LayoutGrid,
                  isActive: url === '/dashboard',
              },
              ...(isPrincipal
                  ? [
                        {
                            title: 'Jurnal Kepala Sekolah',
                            href: '/principal/journals',
                            icon: BookOpenCheck,
                            isActive: url.startsWith('/principal/journals'),
                        },
                    ]
                  : []),
              {
                  title: 'Presensi & Laporan',
                  href: '/attendances',
                  icon: ClipboardCheck,
                  defaultOpen: true,
                  items: [
                      {
                          title: 'Presensi Harian',
                          href: '/attendances',
                          icon: UserCheck,
                          isActive:
                              url.startsWith('/attendances') &&
                              !url.includes('/lateness') &&
                              !url.includes('/adjustments'),
                      },
                      {
                          title: 'Keterlambatan',
                          href: '/attendances/lateness',
                          icon: Clock,
                          isActive: url.startsWith('/attendances/lateness'),
                      },
                      {
                          title: 'Absen Khusus',
                          href: '/attendances/adjustments',
                          icon: CalendarDays,
                          isActive: url.startsWith('/attendances/adjustments'),
                      },
                      {
                          title: 'Rekap & Laporan',
                          href: '/reports',
                          icon: FileSpreadsheet,
                          isActive: url.startsWith('/reports'),
                      },
                      ...(can('extracurricular', 'view')
                          ? [
                                {
                                    title: 'Laporan Ekskul',
                                    href: '/extracurricular/reports',
                                    icon: Award,
                                    isActive: url.startsWith('/extracurricular'),
                                },
                            ]
                          : []),
                  ],
              },
              ...(hasMasterAccess
                  ? [
                        {
                            title: 'Master Data',
                            href: '/master',
                            icon: Database,
                            defaultOpen: true,
                            items: [
                                ...(can('master_students', 'view')
                                    ? [
                                          {
                                              title: 'Data Siswa',
                                              href: '/master?tab=students',
                                              icon: Users,
                                              isActive: activeMasterTab === 'students',
                                          },
                                      ]
                                    : []),
                                ...(can('master_teachers', 'view')
                                    ? [
                                          {
                                              title: 'Data Guru & Staf',
                                              href: '/master?tab=teachers',
                                              icon: Shield,
                                              isActive: activeMasterTab === 'teachers',
                                          },
                                      ]
                                    : []),
                                ...(can('master_classes', 'view')
                                    ? [
                                          {
                                              title: 'Data Kelas',
                                              href: '/master?tab=classrooms',
                                              icon: GraduationCap,
                                              isActive: activeMasterTab === 'classrooms',
                                          },
                                          {
                                              title: 'Jadwal Guru Piket',
                                              href: '/master?tab=duty',
                                              icon: CalendarCheck,
                                              isActive: activeMasterTab === 'duty',
                                          },
                                      ]
                                    : []),
                                ...(can('master_students', 'alumni')
                                    ? [
                                          {
                                              title: 'Kenaikan Kelas',
                                              href: '/master?tab=promotions',
                                              icon: TrendingUp,
                                              isActive: activeMasterTab === 'promotions',
                                          },
                                          {
                                              title: 'Data Alumni',
                                              href: '/master?tab=alumni',
                                              icon: Award,
                                              isActive: activeMasterTab === 'alumni',
                                          },
                                      ]
                                    : []),
                            ],
                        },
                    ]
                  : []),
              ...(hasPublikasiAccess
                  ? [
                        {
                            title: 'Publikasi & Website',
                            href: '/manage/school-profile',
                            icon: Newspaper,
                            defaultOpen: false,
                            items: [
                                ...(can('news', 'view')
                                    ? [
                                          {
                                              title: 'Kelola Berita',
                                              href: '/news-management',
                                              icon: Newspaper,
                                              isActive: url.startsWith('/news-management'),
                                          },
                                      ]
                                    : []),
                                ...(can('galleries', 'view')
                                    ? [
                                          {
                                              title: 'Galeri Kegiatan',
                                              href: '/manage/galleries',
                                              icon: Images,
                                              isActive: url.startsWith('/manage/galleries'),
                                          },
                                      ]
                                    : []),
                                ...(can('school_profile', 'view')
                                    ? [
                                          {
                                              title: 'Profil Sekolah',
                                              href: '/manage/school-profile',
                                              icon: Building2,
                                              isActive: url.startsWith('/manage/school-profile'),
                                          },
                                      ]
                                    : []),
                                ...(can('school_profile', 'view') || can('master_teachers', 'view')
                                    ? [
                                          {
                                              title: 'Profil Guru',
                                              href: '/manage/teacher-profiles',
                                              icon: GraduationCap,
                                              isActive: url.startsWith('/manage/teacher-profiles'),
                                          },
                                      ]
                                    : []),
                                ...(can('principal_greeting', 'view')
                                    ? [
                                          {
                                              title: 'Sambutan Kepala Sekolah',
                                              href: '/publisher/principal-greeting',
                                              icon: MessageSquareQuote,
                                              isActive: url.startsWith('/publisher/principal-greeting'),
                                          },
                                      ]
                                    : []),
                                ...(can('contact_messages', 'view')
                                    ? [
                                          {
                                              title: 'Kontak Kami',
                                              href: '/manage/contact',
                                              icon: PhoneCall,
                                              isActive: url.startsWith('/manage/contact'),
                                          },
                                      ]
                                    : []),
                                ...(can('news', 'view')
                                    ? [
                                          {
                                              title: 'Berita Publik',
                                              href: '/berita',
                                              icon: Globe,
                                              isActive: url.startsWith('/berita'),
                                          },
                                      ]
                                    : []),
                            ],
                        },
                    ]
                  : []),
              ...(hasSettingsAccess
                  ? [
                        {
                            title: 'Pengaturan Sistem',
                            href: '/admin/school-settings',
                            icon: Settings,
                            defaultOpen: url.startsWith('/admin/'),
                            items: [
                                ...(can('school_settings', 'view')
                                    ? [
                                          {
                                              title: 'Pengaturan Sekolah',
                                              href: '/admin/school-settings',
                                              icon: School,
                                              isActive: url.startsWith('/admin/school-settings'),
                                          },
                                      ]
                                    : []),
                                ...(can('holidays', 'view')
                                    ? [
                                          {
                                              title: 'Kalender Pendidikan',
                                              href: '/admin/holidays',
                                              icon: CalendarDays,
                                              isActive: url.startsWith('/admin/holidays'),
                                          },
                                      ]
                                    : []),
                                ...(can('pwa_notifications', 'view')
                                    ? [
                                          {
                                              title: 'Notifikasi PWA',
                                              href: '/admin/pwa-notifications',
                                              icon: BellRing,
                                              isActive: url.startsWith('/admin/pwa-notifications'),
                                          },
                                      ]
                                    : []),
                                ...(isAdmin
                                    ? [
                                          {
                                              title: 'Kelola Tutorial',
                                              href: '/admin/tutorials',
                                              icon: Video,
                                              isActive: url.startsWith('/admin/tutorials'),
                                          },
                                      ]
                                    : []),
                                ...(isAdmin || can('permissions', 'view')
                                    ? [
                                          {
                                              title: 'Matriks Hak Akses',
                                              href: '/admin/permissions',
                                              icon: ShieldCheck,
                                              isActive: url.startsWith('/admin/permissions'),
                                          },
                                      ]
                                    : []),
                            ],
                        },
                    ]
                  : []),
              {
                  title: 'Video Tutorial',
                  href: '/tutorials',
                  icon: Video,
                  isActive: url === '/tutorials',
              },
          ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="border-r-0">
            <SidebarHeader className="relative p-4 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-xs overflow-hidden">
                {/* Luminous Top Flare in Theme Color */}
                <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 size-48 rounded-full bg-[var(--brand-primary,#FF6B35)]/20 blur-2xl" />
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="relative z-10 hover:bg-white/[0.07] active:bg-white/[0.1] rounded-2xl transition-all">
                            <Link href={isPublisher ? '/news-management' : isCoach ? '/extracurricular/reports' : '/dashboard'} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2.5 py-4">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-white/[0.08] bg-white/[0.02] p-3 backdrop-blur-xs">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

