import locations from '../../../shared/locations.json';
export const governorates = locations.governorates;
export function normalizeGovernorate(value) {
  if (typeof value !== 'string') return '';
  const text = value.trim().toLowerCase();
  return (
    governorates.find((g) => g.toLowerCase() === text) ||
    Object.entries(locations.aliases).find(([a]) => a.toLowerCase() === text)?.[1] ||
    ''
  );
}
