import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
export default function useSmoothNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (to, options) =>
      typeof to === 'number'
        ? navigate(to)
        : navigate(to, {
            ...options,
            viewTransition: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          }),
    [navigate],
  );
}
