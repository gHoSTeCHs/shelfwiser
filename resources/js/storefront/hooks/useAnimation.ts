import { useContext } from 'react';
import { AnimationContext } from '../AnimationProvider';
import type { AnimationContextValue } from '../AnimationProvider';

export function useAnimation(): AnimationContextValue {
    const ctx = useContext(AnimationContext);
    if (!ctx) throw new Error('useAnimation must be used within AnimationProvider');
    return ctx;
}
