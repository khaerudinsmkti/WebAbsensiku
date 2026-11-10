import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

function NavCollapsibleItem({ item }: { item: NavItem }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { state, setOpen } = useSidebar();

    const hasActiveChild = Boolean(
        item.items?.some((sub) => sub.isActive ?? isCurrentUrl(sub.href)),
    );

    const [isOpen, setIsOpen] = useState<boolean>(
        () => hasActiveChild || Boolean(item.defaultOpen),
    );

    useEffect(() => {
        if (hasActiveChild) {
            setIsOpen(true);
        }
    }, [hasActiveChild]);

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        tooltip={{ children: item.title }}
                        title={item.title}
                        isActive={hasActiveChild && !isOpen}
                        onClick={() => {
                            if (state === 'collapsed') {
                                setOpen(true);
                                setIsOpen(true);
                            }
                        }}
                        className={`rounded-xl h-10 px-3 transition-all duration-200 ${
                            hasActiveChild
                                ? 'bg-white/[0.08] text-white font-bold hover:bg-white/[0.12] hover:text-white border border-white/[0.06]'
                                : 'text-white/75 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1]'
                        } data-[active=true]:bg-gradient-to-r data-[active=true]:from-[var(--brand-primary,#FF6B35)] data-[active=true]:to-[var(--brand-primary-dark,#FF8C5A)] data-[active=true]:text-white data-[active=true]:font-bold data-[active=true]:shadow-brand`}
                    >
                        {item.icon && <item.icon className="size-5 shrink-0" />}
                        <span className="truncate">{item.title}</span>
                        <ChevronRight className="ml-auto size-4 shrink-0 text-white/60 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub className="border-white/[0.12] ml-4 pl-2.5 mt-1 gap-1 py-1">
                        {item.items?.map((subItem) => {
                            const subActive =
                                subItem.isActive ?? isCurrentUrl(subItem.href);

                            return (
                                <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={subActive}
                                        tooltip={{ children: subItem.title }}
                                        className="text-white/70 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1] data-[active=true]:bg-gradient-to-r data-[active=true]:from-[var(--brand-primary,#FF6B35)] data-[active=true]:to-[var(--brand-primary-dark,#FF8C5A)] data-[active=true]:text-white data-[active=true]:font-bold data-[active=true]:shadow-brand rounded-lg h-9 px-2.5 transition-all duration-200 [&>svg]:text-current"
                                    >
                                        <Link href={subItem.href} prefetch title={subItem.title}>
                                            {subItem.icon && (
                                                <subItem.icon className="size-4 shrink-0" />
                                            )}
                                            <span className="truncate">{subItem.title}</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            );
                        })}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

export function NavMain({ items }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="text-white/45 text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 px-3 py-2">
                <span className="size-1.5 rounded-full bg-[var(--brand-primary,#FF6B35)] shadow-xs shadow-[var(--brand-primary,#FF6B35)]/60 shrink-0"></span>
                Menu Utama
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1.5 mt-1">
                {items.map((item) => {
                    if (item.items && item.items.length > 0) {
                        return <NavCollapsibleItem key={item.title} item={item} />;
                    }

                    const active = item.isActive ?? isCurrentUrl(item.href);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={{ children: item.title }}
                                className="text-white/75 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1] data-[active=true]:bg-gradient-to-r data-[active=true]:from-[var(--brand-primary,#FF6B35)] data-[active=true]:to-[var(--brand-primary-dark,#FF8C5A)] data-[active=true]:text-white data-[active=true]:font-bold data-[active=true]:shadow-brand rounded-xl h-10 px-3 transition-all duration-200"
                            >
                                <Link href={item.href} prefetch title={item.title}>
                                    {item.icon && <item.icon className="size-5 shrink-0" />}
                                    <span className="truncate">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

