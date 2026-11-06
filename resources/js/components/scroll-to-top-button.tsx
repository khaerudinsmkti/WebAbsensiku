import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleScroll = () => {
            setIsVisible(window.scrollY > 250);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    if (!isVisible) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={scrollToTop}
            aria-label="Kembali ke atas"
            title="Kembali ke atas"
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white shadow-lg shadow-[#FF6B35]/30 ring-2 ring-white/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF6B35]/40 active:scale-95 dark:ring-[#18122B]"
        >
            <ArrowUp className="size-5 stroke-[2.5]" />
        </button>
    );
}

