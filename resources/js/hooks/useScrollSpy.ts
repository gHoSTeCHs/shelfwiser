import { useEffect, useState } from 'react';

export function useScrollSpy(sectionIds: string[], offset = 100) {
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY + offset;

            for (let i = sectionIds.length - 1; i >= 0; i--) {
                const section = document.getElementById(sectionIds[i]);
                if (section && section.offsetTop <= scrollY) {
                    setActiveId(sectionIds[i]);
                    return;
                }
            }

            setActiveId('');
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [sectionIds, offset]);

    return activeId;
}
