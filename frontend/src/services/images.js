import api from './api';
export function imageUrl(src) {
  if (!src) return '/vehicle-placeholder.svg';
  return src.startsWith('/uploads/')
    ? new URL(api.defaults.baseURL, window.location.origin).origin + src
    : src;
}
