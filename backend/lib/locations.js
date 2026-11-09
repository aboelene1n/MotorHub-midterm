const { governorates, aliases } = require('../../shared/locations.json'),
  literal = require('./literal');
const normalize = (value) =>
  typeof value === 'string'
    ? governorates.find((g) => g.toLowerCase() === value.trim().toLowerCase()) ||
      Object.entries(aliases).find(([a]) => a.toLowerCase() === value.trim().toLowerCase())?.[1] ||
      ''
    : '';
function locationFilter(governorate) {
  const values = [
    governorate,
    ...Object.entries(aliases)
      .filter(([, g]) => g === governorate)
      .map(([a]) => a),
  ];
  return {
    $or: [
      { governorate },
      { location: { $regex: '^(?:' + values.map(literal).join('|') + ')$', $options: 'i' } },
    ],
  };
}
module.exports = { governorates, normalize, locationFilter };
