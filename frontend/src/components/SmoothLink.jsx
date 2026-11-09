import { useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
const subscribe = (notify) => {
  preference.addEventListener('change', notify);
  return () => preference.removeEventListener('change', notify);
};
const snapshot = () => preference.matches;
export default function SmoothLink(props) {
  const reduced = useSyncExternalStore(subscribe, snapshot, () => true);
  return <Link {...props} viewTransition={!reduced} />;
}
