import { useEffect } from 'react';

/**
 * iOS Safari: sobreposições `position: fixed` NÃO impedem o body de rolar
 * por trás (bug clássico de rubber-band). Trava o scroll do <html> enquanto
 * o modal está montado, preservando o scroll interno do próprio modal.
 */
export function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previous;
    };
  }, [locked]);
}
