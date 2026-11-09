const express = require("express");
const router = express.Router();
const { idParam } = require("../lib/http");
router.param("id", idParam("id"));

const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getMyVehicles,
} = require("../controllers/vehicleController");

const { protect } = require("../middleware/authMiddleware");

// Public routes
router.get("/", getVehicles);

// Protected routes
router.get("/my-listings", protect, getMyVehicles);

// Vehicle ID routes
router.get("/:id", getVehicleById);
router.post("/", protect, createVehicle);
router.put("/:id", protect, updateVehicle);
router.delete("/:id", protect, deleteVehicle);

module.exports = router;