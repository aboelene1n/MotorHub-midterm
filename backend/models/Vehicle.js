const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    bookingRevision: { type: Number, default: 0, select: false },
    bodyType: { type: String, trim: true, maxlength: 50, default: "" },
    title: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      required: true,
    },

    model: {
      type: String,
      required: true,
    },

    year: {
      min: 1900, max: new Date().getFullYear() + 1,
      validate: Number.isInteger,
      type: Number,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
    },

    mileage: {
      min: 0,
      type: Number,
      default: 0,
    },

    transmission: {
      type: String,
      enum: ["Automatic", "Manual"],
      required: true,
    },

    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Electric", "Hybrid"],
      required: true,
    },

    condition: {
      type: String,
      enum: ["New", "Used"],
      default: "Used",
    },

    listingType: {
      type: String,
      enum: ["Sale", "Rent"],
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    images: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["Available", "Sold", "Rented"],
      default: "Available",
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);