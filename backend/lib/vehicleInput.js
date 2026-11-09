const { fail } = require("./http");
const enums = {
  listingType: ["Sale", "Rent"],
  transmission: ["Automatic", "Manual"],
  fuelType: ["Petrol", "Diesel", "Electric", "Hybrid"],
  condition: ["New", "Used"],
  status: ["Available", "Sold", "Rented"],
};
const fields = [
  "title",
  "brand",
  "model",
  "year",
  "price",
  "description",
  "mileage",
  "transmission",
  "fuelType",
  "condition",
  "listingType",
  "location",
  "images",
  "bodyType",
  "status",
];
function input(body) {
  const out = {};
  for (const key of fields)
    if (Object.hasOwn(body, key)) {
      const v = body[key];
      if (enums[key]) {
        if (!enums[key].includes(v)) throw fail(400, "Invalid " + key);
      } else if (["year", "price", "mileage"].includes(key)) {
        if (typeof v !== "number" || !Number.isFinite(v) || v < 0)
          throw fail(400, "Invalid " + key);
        if (
          key === "year" &&
          (!Number.isInteger(v) || v < 1900 || v > new Date().getFullYear() + 1)
        )
          throw fail(400, "Invalid year");
      } else if (key === "images") {
        if (
          !Array.isArray(v) ||
          v.length > 8 ||
          v.some(
            (x) =>
              typeof x !== "string" ||
              x.length > 2048 ||
              !/^(https?:\/\/[^\s]+|\/demo-cars\/(?:marketplace\/)?[a-z0-9-]+\.jpg|\/uploads\/[a-f0-9-]+\.(png|jpg|webp))$/.test(
                x,
              ),
          )
        )
          throw fail(400, "Use up to 8 uploaded images or HTTP image URLs");
      } else if (
        typeof v !== "string" ||
        (!v.trim() && key !== "bodyType") ||
        v.length > (key === "description" ? 5000 : 200)
      )
        throw fail(400, "Invalid " + key);
      if (key === "location") {
        const governorate = require("./locations").normalize(v);
        if (!governorate)
          throw fail(400, "Choose a governorate from the list.");
        out.location = governorate;
      } else out[key] = typeof v === "string" ? v.trim() : v;
    }
  return out;
}
module.exports = { input, enums };
