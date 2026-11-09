const prefix = 'motorhub:browse:';
const memory = new Map();
export function saveBrowsePosition(key, url, top = window.scrollY) {
  const entry = { url, top: Math.max(0, top) };
  memory.set(key, entry);
  if (memory.size > 80) memory.delete(memory.keys().next().value);
  try {
    const saved = JSON.parse(sessionStorage.getItem(prefix + 'positions') || '{}');
    saved[key] = entry;
    const keys = Object.keys(saved);
    while (keys.length > 80) delete saved[keys.shift()];
    sessionStorage.setItem(prefix + 'positions', JSON.stringify(saved));
  } catch {
    /* Private browsing may disable storage. */
  }
}
export function getBrowsePosition(key) {
  if (memory.has(key)) return memory.get(key);
  try {
    const value = JSON.parse(sessionStorage.getItem(prefix + 'positions') || '{}')[key];
    if (value && typeof value.url === 'string' && Number.isFinite(value.top) && value.top >= 0)
      return value;
  } catch {
    /* Ignore corrupt saved state. */
  }
  return null;
}
export function browseOrigin(location) {
  return /^\/(cars|rentals)$/.test(location.pathname)
    ? { url: location.pathname + location.search, key: location.key }
    : null;
}
