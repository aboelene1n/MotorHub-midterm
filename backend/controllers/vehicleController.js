const Vehicle = require("../models/Vehicle");
const lock = require("../lib/vehicleLock");
const { wrap, fail } = require("../lib/http");
const { input, enums } = require("../lib/vehicleInput");
const literal = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
exports.getVehicles = wrap(async (req, res) => {
  const q = req.query,
    filter = { status: "Available" };
  for (const [key, value] of Object.entries(q))
    if (typeof value !== "string" || value.length > 200)
      throw fail(400, "Invalid " + key);
  for (const key of ["listingType", "transmission", "fuelType"])
    if (q[key]) {
      if (!enums[key].includes(q[key])) throw fail(400, "Invalid " + key);
      filter[key] = q[key];
    }
  if (q.brand) filter.brand = q.brand;
  if (q.search)
    filter.$or = ["title", "brand", "model"].map((key) => ({
      [key]: { $regex: literal(q.search), $options: "i" },
    }));
  if (q.location) {
    const governorate = require("../lib/locations").normalize(q.location);
    if (!governorate) throw fail(400, "Choose a valid governorate.");
    filter.$and = [require("../lib/locations").locationFilter(governorate)];
  }
  for (const [key, op] of [
    ["minPrice", "$gte"],
    ["maxPrice", "$lte"],
  ])
    if (q[key] !== undefined && q[key] !== "") {
      const n = Number(q[key]);
      if (!Number.isFinite(n) || n < 0) throw fail(400, "Invalid " + key);
      filter.price = { ...filter.price, [op]: n };
    }
  if (filter.price?.$gte > filter.price?.$lte)
    throw fail(400, "Minimum price exceeds maximum");
  const vehicles = await Vehicle.find(filter)
    .populate("seller", "name email")
    .sort({ createdAt: -1 });
  res.json({ count: vehicles.length, vehicles });
});
exports.getVehicleById = wrap(async (req, res) => {
  const v = await Vehicle.findById(req.params.id).populate(
    "seller",
    "name email phone",
  );
  if (!v) throw fail(404, "Vehicle not found");
  res.json(v);
});
exports.createVehicle = wrap(async (req, res) => {
  const fields = input(req.body);
  delete fields.status;
  const vehicle = await Vehicle.create({ ...fields, seller: req.user.id });
  res.status(201).json({ vehicle });
});
const own = (v, u) => {
  if (String(v.seller) !== u.id && u.role !== "admin")
    throw fail(403, "You cannot manage this listing");
};
exports.updateVehicle = wrap(async (req, res) => {
  const fields = input(req.body);
  const vehicle = await lock(req.params.id, async (v, session) => {
    own(v, req.user);
    Object.assign(v, fields);
    await v.save({ session });
    return v;
  });
  res.json({ vehicle });
});
exports.deleteVehicle = wrap(async (req, res) => {
  await lock(req.params.id, async (v, session) => {
    own(v, req.user);
    await v.deleteOne({ session });
  });
  res.json({ message: "Listing deleted" });
});
exports.getMyVehicles = wrap(async (req, res) =>
  res.json(await Vehicle.find({ seller: req.user.id }).sort({ createdAt: -1 })),
);
