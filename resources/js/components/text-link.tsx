import { Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type Props = ComponentProps<typeof Link>;

export default function TextLink({
    className = '',
    children,
    ...props
}: Props) {
    return (
        <Link
            className={cn(
                'text-[var(--brand-primary,#FF6B35)] font-semibold underline decoration-[var(--brand-primary,#FF6B35)]/40 underline-offset-4 transition-colors duration-200 hover:text-[var(--brand-primary-dark,#E55A25)] hover:decoration-current dark:text-[var(--brand-primary,#FF8C5A)]',
                className,
            )}
            {...props}
        >
            {children}
        </Link>
    );
}
