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
                        isActive={hasActiveChild && !isOpen}
                        onClick={() => {
                            if (state === 'collapsed') {
                                setOpen(true);
                                setIsOpen(true);
                            }
                        }}
                        className={`rounded-xl h-10 px-3 transition-all ${
                            hasActiveChild
                                ? 'bg-white/10 text-white font-bold hover:bg-white/15 hover:text-white'
                                : 'text-white/80 hover:text-white hover:bg-white/10 active:bg-white/15'
                        } data-[active=true]:bg-gradient-to-r data-[active=true]:from-[var(--brand-primary,#FF6B35)] data-[active=true]:to-[var(--brand-primary-dark,#FF8C5A)] data-[active=true]:text-white data-[active=true]:font-bold data-[active=true]:shadow-brand`}
                    >
                        {item.icon && <item.icon className="size-5" />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto size-4 text-white/60 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub className="border-white/15 ml-4 pl-2.5 mt-1 gap-1 py-1">
                        {item.items?.map((subItem) => {
                            const subActive =
                                subItem.isActive ?? isCurrentUrl(subItem.href);

                            return (
                                <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={subActive}
                                        className="text-white/75 hover:text-white hover:bg-white/10 active:bg-white/15 data-[active=true]:bg-gradient-to-r data-[active=true]:from-[var(--brand-primary,#FF6B35)] data-[active=true]:to-[var(--brand-primary-dark,#FF8C5A)] data-[active=true]:text-white data-[active=true]:font-bold data-[active=true]:shadow-brand rounded-lg h-9 px-2.5 transition-all [&>svg]:text-current"
                                    >
                                        <Link href={subItem.href} prefetch>
                                            {subItem.icon && (
                                                <subItem.icon className="size-4 shrink-0" />
                                            )}
                                            <span>{subItem.title}</span>
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
            <SidebarGroupLabel className="text-white/50 text-[11px] font-bold tracking-wider uppercase">
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
                                className="text-white/80 hover:text-white hover:bg-white/10 active:bg-white/15 data-[active=true]:bg-gradient-to-r data-[active=true]:from-[var(--brand-primary,#FF6B35)] data-[active=true]:to-[var(--brand-primary-dark,#FF8C5A)] data-[active=true]:text-white data-[active=true]:font-bold data-[active=true]:shadow-brand rounded-xl h-10 px-3 transition-all"
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon className="size-5" />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

