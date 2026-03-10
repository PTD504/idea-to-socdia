import { useEffect } from 'react';

export function usePreventUnload(shouldPrevent: boolean) {
    useEffect(() => {
        if (!shouldPrevent) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [shouldPrevent]);
}
