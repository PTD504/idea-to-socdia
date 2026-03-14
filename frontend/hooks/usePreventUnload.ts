import { useEffect } from 'react';

export function usePreventUnload(shouldPrevent: boolean) {
    useEffect(() => {
        if (!shouldPrevent) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload, { capture: true });
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload, { capture: true });
        };
    }, [shouldPrevent]);
}
