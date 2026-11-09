const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const { fail } = require('./http');
// All booking writes and listing edits acquire this same document write lock.
// withTransaction retries write conflicts with a fresh snapshot on Atlas/replica sets.
module.exports = async (id, fn) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const vehicle = await Vehicle.findOneAndUpdate({ _id: id }, { $inc: { bookingRevision: 1 } }, { new:true, session });
      if (!vehicle) throw fail(404, 'Vehicle not found');
      return fn(vehicle, session);
    });
  } finally { await session.endSession(); }
};
