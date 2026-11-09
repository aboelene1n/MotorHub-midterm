import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { saveBrowsePosition, getBrowsePosition } from '../services/browsePosition';
export default function ScrollToTop() {
  const location = useLocation(),
    type = useNavigationType(),
    lastPath = useRef(location.pathname);
  useLayoutEffect(() => {
    const prior = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => {
      history.scrollRestoration = prior;
    };
  }, []);
  useLayoutEffect(() => {
    const url = location.pathname + location.search,
      samePath = lastPath.current === location.pathname;
    lastPath.current = location.pathname;
    const explicit = location.state?.restoreScroll;
    const target =
      explicit?.url === url && Number.isFinite(explicit.top)
        ? explicit.top
        : type === 'POP'
          ? getBrowsePosition(location.key)?.top || 0
          : samePath
            ? window.scrollY
            : 0;
    let restoring = true,
      timer,
      observer;
    const finish = () => {
      restoring = false;
      observer?.disconnect();
      clearTimeout(timer);
    };
    const restore = () => {
      if (!restoring) return;
      window.scrollTo({ top: target, left: 0, behavior: 'instant' });
      if (document.documentElement.scrollHeight - window.innerHeight >= target) finish();
    };
    const interrupt = () => finish();
    const keyInterrupt = (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key))
        finish();
    };
    observer = new ResizeObserver(restore);
    observer.observe(document.body);
    restore();
    timer = setTimeout(finish, 10000);
    const save = () => {
      if (!restoring) saveBrowsePosition(location.key, url);
    };
    window.addEventListener('scroll', save, { passive: true });
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    window.addEventListener('keydown', keyInterrupt);
    window.addEventListener('pagehide', save);
    return () => {
      finish();
      window.removeEventListener('scroll', save);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('keydown', keyInterrupt);
      window.removeEventListener('pagehide', save);
    };
  }, [location.key, location.pathname, type]);
  return null;
}
