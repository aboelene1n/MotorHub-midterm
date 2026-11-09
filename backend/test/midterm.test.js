process.env.MONGOMS_DOWNLOAD_DIR ||= require("path").resolve(
  __dirname,
  "../node_modules/.cache/mongodb-binaries",
);
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { MongoMemoryReplSet } = require("mongodb-memory-server-core");
const mongoose = require("mongoose");
let db, server, base;
before(async () => {
  db = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGO_URI = db.getUri("midterm");
  process.env.JWT_SECRET = require("crypto").randomBytes(48).toString("hex");
  const app = require("../app");
  await require("../config/db")();
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = "http://127.0.0.1:" + server.address().port + "/api";
});
after(async () => {
  if (server) await new Promise((r) => server.close(r));
  await mongoose.disconnect();
  if (db) await db.stop();
});
async function req(p, method = "GET", body, token) {
  const r = await fetch(base + p, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json() };
}
test("midterm registration, listing CRUD, filters and ownership with a real database", async () => {
  const user = (
    await req("/auth/register", "POST", {
      name: "Owner",
      email: "owner@midterm.test",
      password: "midterm-owner-123",
    })
  ).data;
  const other = (
    await req("/auth/register", "POST", {
      name: "Other",
      email: "other@midterm.test",
      password: "midterm-other-123",
    })
  ).data;
  assert.equal(
    (
      await req("/auth/login", "POST", {
        email: "owner@midterm.test",
        password: "midterm-owner-123",
      })
    ).status,
    200,
  );
  assert.equal(
    (await req("/auth/profile", "GET", undefined, user.token)).data.id,
    user.user.id,
  );
  const body = {
    title: "Midterm car",
    brand: "BMW",
    model: "320i",
    year: 2024,
    price: 2000000,
    description: "Test vehicle",
    transmission: "Automatic",
    fuelType: "Petrol",
    listingType: "Sale",
    location: "Cairo",
  };
  assert.equal((await req("/vehicles", "POST", body)).status, 401);
  const v = await req("/vehicles", "POST", body, user.token);
  assert.equal(v.status, 201);
  const id = v.data.vehicle._id;
  assert.equal(
    (await req("/vehicles?search=Midterm&listingType=Sale")).data.count,
    1,
  );
  assert.equal((await req("/vehicles?minPrice=abc")).status, 400);
  assert.equal(
    (await req("/vehicles/" + id, "PUT", { price: 1 }, other.token)).status,
    403,
  );
  assert.equal(
    (
      await req(
        "/vehicles/" + id,
        "PUT",
        { price: 1800000, seller: other.user.id },
        user.token,
      )
    ).data.vehicle.seller,
    user.user.id,
  );
  assert.equal(
    (await req("/vehicles/" + id, "DELETE", undefined, other.token)).status,
    403,
  );
  assert.equal(
    (await req("/vehicles/" + id, "DELETE", undefined, user.token)).status,
    200,
  );
  assert.equal((await req("/vehicles/" + id)).status, 404);
  assert.equal(
    (await req("/bookings/my-bookings", "GET", undefined, user.token)).status,
    404,
  );
  assert.equal(
    (await req("/favorites", "GET", undefined, user.token)).status,
    404,
  );
});

test("prepared marketplace requires a configured password without changing existing data", async () => {
  const { seedDemo } = require("../scripts/seedDemo");
  const User = require("../models/User"),
    Vehicle = require("../models/Vehicle");
  const before = [await User.countDocuments(), await Vehicle.countDocuments()];
  const previous = process.env.DEMO_PASSWORD;
  delete process.env.DEMO_PASSWORD;
  try {
    await assert.rejects(seedDemo(), /DEMO_PASSWORD is missing/);
    assert.deepEqual(
      [await User.countDocuments(), await Vehicle.countDocuments()],
      before,
    );
  } finally {
    if (previous === undefined) delete process.env.DEMO_PASSWORD;
    else process.env.DEMO_PASSWORD = previous;
  }
});

test("twelve reused listings seed repeatedly, preserve existing accounts and support photo-preserving edits", async () => {
  const { seedDemo, idFor } = require("../scripts/seedDemo");
  const User = require("../models/User"),
    Vehicle = require("../models/Vehicle");
  const fs = require("fs/promises"),
    path = require("path");
  process.env.DEMO_PASSWORD = require("crypto")
    .randomBytes(24)
    .toString("base64url");
  const existing = JSON.stringify(
    await User.findOne({ email: "owner@midterm.test" }).lean(),
  );
  const first = await seedDemo();
  assert.equal(first.users, 2);
  assert.equal(first.vehicles, 12);
  const owned = { demoKey: /^motorhub-midterm-v1\// };
  const vehicles = await Vehicle.collection.find(owned).toArray();
  assert.equal(vehicles.filter((v) => v.listingType === "Sale").length, 6);
  assert.equal(vehicles.filter((v) => v.listingType === "Rent").length, 6);
  assert.equal(
    vehicles.filter((v) => v.condition === "New" && v.mileage === 0).length,
    4,
  );
  for (const listingType of ["Sale", "Rent"]) {
    assert.equal(
      vehicles.filter(
        (v) =>
          v.listingType === listingType &&
          v.condition === "New" &&
          v.mileage === 0,
      ).length,
      2,
    );
  }
  for (const v of vehicles) {
    assert.equal(v.images.length, 3);
    for (const image of v.images)
      assert.ok(
        (await fs.stat(path.join(__dirname, "../../frontend/public", image)))
          .size > 1000,
      );
  }
  const owner = (
    await req("/auth/login", "POST", {
      email: "ahmed.hassan@motorhub.example",
      password: process.env.DEMO_PASSWORD,
    })
  ).data;
  assert.ok(owner.token);
  const vehicle = await Vehicle.findById(
    idFor("Vehicle", "sale-gallery"),
  ).lean();
  const edited = await req(
    "/vehicles/" + vehicle._id,
    "PUT",
    { price: 1234567, images: vehicle.images },
    owner.token,
  );
  assert.equal(edited.status, 200);
  assert.deepEqual(edited.data.vehicle.images, vehicle.images);
  await seedDemo();
  assert.equal(await Vehicle.collection.countDocuments(owned), 12);
  assert.equal(await User.collection.countDocuments(owned), 2);
  assert.equal((await Vehicle.findById(vehicle._id)).price, 1234567);
  assert.equal(
    JSON.stringify(await User.findOne({ email: "owner@midterm.test" }).lean()),
    existing,
  );
  const garage = await req(
    "/vehicles/my-listings",
    "GET",
    undefined,
    owner.token,
  );
  assert.equal(garage.status, 200);
  assert.ok(garage.data.length > 0);
  assert.ok(garage.data.every((v) => v.seller === owner.user.id));
});

test("shared governorates validate listings and filter both normalized and legacy city locations", async () => {
  const Vehicle = require("../models/Vehicle"),
    User = require("../models/User");
  const owner = await User.findOne({ email: "owner@midterm.test" });
  const login = (
    await req("/auth/login", "POST", {
      email: owner.email,
      password: "midterm-owner-123",
    })
  ).data;
  const fields = {
    title: "Governorate check",
    brand: "Toyota",
    model: "Corolla",
    year: 2025,
    price: 1200000,
    description: "Available to view",
    transmission: "Automatic",
    fuelType: "Petrol",
    listingType: "Sale",
    location: "New Cairo",
  };
  const made = await req("/vehicles", "POST", fields, login.token);
  assert.equal(made.status, 201);
  assert.equal(made.data.vehicle.location, "Cairo");
  const legacy = await Vehicle.create({
    ...fields,
    title: "Legacy district listing",
    seller: owner._id,
    location: "Sheikh Zayed",
  });
  const giza = await req("/vehicles?location=Giza&search=Legacy");
  assert.equal(giza.status, 200);
  assert.ok(giza.data.vehicles.some((v) => v._id === String(legacy._id)));
  const cairo = await req("/vehicles?location=Cairo&search=Governorate");
  assert.equal(cairo.data.count, 1);
  assert.equal((await req("/vehicles?location=Atlantis")).status, 400);
  assert.equal(
    (
      await req(
        "/vehicles/" + made.data.vehicle._id,
        "PUT",
        { location: "Atlantis" },
        login.token,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await req(
        "/vehicles/" + made.data.vehicle._id,
        "PUT",
        { location: "Alexandria" },
        login.token,
      )
    ).data.vehicle.location,
    "Alexandria",
  );
  assert.equal(require("../lib/locations").governorates.length, 27);
});
