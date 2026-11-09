import { governorates, normalizeGovernorate } from '../services/locations';
export default function GovernorateSelect({
  value,
  onChange,
  required = false,
  name = 'location',
  ...props
}) {
  return (
    <select
      aria-label="Governorate"
      {...props}
      name={name}
      value={normalizeGovernorate(value)}
      onChange={onChange}
      required={required}
    >
      <option value="">{required ? 'Choose a governorate' : 'All governorates'}</option>
      {governorates.map((g) => (
        <option key={g} value={g}>
          {g}
        </option>
      ))}
    </select>
  );
}
