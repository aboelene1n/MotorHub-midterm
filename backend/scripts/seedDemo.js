const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const vehicles = require("../data/demoVehicles.json");
const owners = require("../data/demoOwners.json");
// Adapted from the full project's fixed-key seed, restricted to its two
// marketplace models and a separate namespace/database for the midterm.
const PREFIX = "motorhub-midterm-v1/";
const keyFor = (model, key) => `${PREFIX}${model}/${key}`;
const idFor = (model, key) =>
  new mongoose.Types.ObjectId(
    crypto
      .createHash("sha256")
      .update(keyFor(model, key))
      .digest("hex")
      .slice(0, 24),
  );
function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD;
  if (!password)
    throw new Error(
      "DEMO_PASSWORD is missing. Set it in backend/.env. No data was changed.",
    );
  if (
    password.length < 8 ||
    !password.trim() ||
    Buffer.byteLength(password) > 72
  )
    throw new Error(
      "DEMO_PASSWORD must contain at least 8 characters and fit the 72-byte bcrypt limit. No data was changed.",
    );
  return password;
}
async function seedDemo({ now = new Date() } = {}) {
  const password = requireDemoPassword();
  if (mongoose.connection.readyState !== 1)
    throw new Error("Connect to MongoDB before seeding.");
  if (!/midterm/i.test(mongoose.connection.name))
    throw new Error(
      "Use a separate database with Midterm in its name, such as MotorHubMidterm. The full database was not changed.",
    );
  const records = [];
  for (const [key, name, email] of owners)
    records.push({
      model: User,
      key,
      fields: {
        name,
        email,
        role: "user",
        password: await bcrypt.hash(password, 12),
      },
    });
  for (const { key, owner, ...fields } of vehicles)
    records.push({
      model: Vehicle,
      key,
      fields: { ...fields, seller: idFor("User", owner) },
    });
  await Promise.all([User.init(), Vehicle.init()]);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const { model: Model, key, fields } of records) {
        const _id = idFor(Model.modelName, key),
          demoKey = keyFor(Model.modelName, key);
        const existing = await Model.collection.findOne({ _id }, { session });
        if (existing && existing.demoKey !== demoKey)
          throw new Error(
            "A prepared ID is occupied by unrelated data; no records were changed.",
          );
        if (Model === User) {
          const emailOwner = await User.collection.findOne(
            { email: fields.email },
            { session },
          );
          if (
            emailOwner &&
            (String(emailOwner._id) !== String(_id) ||
              emailOwner.demoKey !== demoKey)
          )
            throw new Error(
              "A prepared email belongs to an existing account. Use a separate midterm database; existing accounts were not changed.",
            );
        }
      }
      for (const { model: Model, key, fields } of records) {
        const _id = idFor(Model.modelName, key),
          demoKey = keyFor(Model.modelName, key);
        const document = new Model({ _id, ...fields });
        await document.validate();
        const data = document.toObject({ versionKey: false });
        data.demoKey = demoKey;
        data.createdAt = now;
        data.updatedAt = now;
        await Model.collection.updateOne(
          { _id, demoKey },
          { $setOnInsert: data },
          { upsert: true, session },
        );
      }
    });
  } finally {
    await session.endSession();
  }
  return {
    accounts: owners.map(([, name, email]) => ({
      name,
      email,
      password: "see DEMO_PASSWORD",
    })),
    users: await User.collection.countDocuments({
      demoKey: { $in: owners.map(([key]) => keyFor("User", key)) },
    }),
    vehicles: await Vehicle.collection.countDocuments({
      demoKey: { $in: vehicles.map(({ key }) => keyFor("Vehicle", key)) },
    }),
  };
}
if (require.main === module) {
  require("dotenv").config({ path: path.join(__dirname, "../.env") });
  (async () => {
    requireDemoPassword();
    await require("../config/db")();
    const result = await seedDemo();
    console.log(
      "Prepared marketplace is ready in " +
        mongoose.connection.name +
        ". Existing data and passwords were preserved.",
    );
    console.table(result.accounts);
    console.log(
      `${result.users} prepared owners, ${result.vehicles} prepared listings.`,
    );
  })()
    .catch((error) => {
      console.error("Setup failed: " + error.message);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}
module.exports = { seedDemo, requireDemoPassword, idFor, keyFor };
