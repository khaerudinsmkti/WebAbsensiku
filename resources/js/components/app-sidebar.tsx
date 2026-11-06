import { Link, usePage } from '@inertiajs/react';
import {
    Award,
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
    TrendingUp,
    UserCheck,
    Users,
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
    const isAdmin = user?.role === 'admin';
    const canManageSchool = isAdmin || user?.role === 'principal';
    const activeMasterTab = getActiveMasterTab(url);

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
          ]
        : [
              {
                  title: 'Dashboard',
                  href: '/dashboard',
                  icon: LayoutGrid,
                  isActive: url === '/dashboard',
              },
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
                  ],
              },
              ...(canManageSchool
                  ? [
                        {
                            title: 'Master Data',
                            href: '/master',
                            icon: Database,
                            defaultOpen: true,
                            items: [
                                {
                                    title: 'Master Data Siswa',
                                    href: '/master?tab=students',
                                    icon: Users,
                                    isActive: activeMasterTab === 'students',
                                },
                                {
                                    title: 'Master Data Guru & Staf',
                                    href: '/master?tab=teachers',
                                    icon: Shield,
                                    isActive: activeMasterTab === 'teachers',
                                },
                                {
                                    title: 'Master Data Kelas',
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
                            ],
                        },
                        {
                            title: 'Publikasi & Website',
                            href: '/manage/school-profile',
                            icon: Newspaper,
                            defaultOpen: false,
                            items: [
                                ...(isAdmin
                                    ? [
                                          {
                                              title: 'Kelola Berita',
                                              href: '/news-management',
                                              icon: Newspaper,
                                              isActive: url.startsWith('/news-management'),
                                          },
                                      ]
                                    : []),
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
                                ...(isAdmin
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
                        {
                            title: 'Pengaturan Sistem',
                            href: '/admin/school-settings',
                            icon: Settings,
                            defaultOpen: false,
                            items: [
                                {
                                    title: 'Pengaturan Sekolah',
                                    href: '/admin/school-settings',
                                    icon: School,
                                    isActive: url.startsWith('/admin/school-settings'),
                                },
                                {
                                    title: 'Kalender Pendidikan',
                                    href: '/admin/holidays',
                                    icon: CalendarDays,
                                    isActive: url.startsWith('/admin/holidays'),
                                },
                            ],
                        },
                    ]
                  : []),
          ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="bg-sidebar-gradient border-r-0">
            <SidebarHeader className="p-4 border-b border-white/10">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-white/10 active:bg-white/15">
                            <Link href={isPublisher ? '/news-management' : '/dashboard'} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-white/10 p-3">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

