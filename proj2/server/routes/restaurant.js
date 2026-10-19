const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { verifyPassword } = require("../middleware/auth");
const Restaurant = require("../models/Restaurant");

const router = express.Router();

// Get restaurant profile (simplified - no auth required for now)
router.get("/profile", async (req, res) => {
  try {
    // For now, return empty profile until we implement proper restaurant identification
    res.json({
      user: null,
      restaurant: null,
    });
  } catch (error) {
    console.error("Get restaurant profile error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update restaurant profile by email and password
router.put(
  "/profile",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 1 }),
    body("restaurant.name").optional().isString(),
    body("restaurant.cuisine").optional().isString(),
    body("restaurant.description").optional().isString(),
    body("restaurant.address").optional().isObject(),
    body("restaurant.phone").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, restaurant: restaurantData } = req.body;
      const user = await User.findByEmail(email);

      if (!(await verifyPassword(user, password)) || user.role !== "restaurant") {
        return res
          .status(401)
          .json({ error: "Invalid credentials or not a restaurant" });
      }

      // Get restaurant data for this owner
      const restaurants = await Restaurant.findByOwnerId(user.id);
      let restaurant = restaurants[0];

      if (restaurant) {
        // Update existing restaurant
        restaurant = await restaurant.update(restaurantData);
      } else {
        // Create new restaurant if none exists
        restaurant = await Restaurant.create({
          ...restaurantData,
          ownerId: user.id,
        });
      }

      res.json({
        message: "Restaurant profile updated successfully",
        restaurant: restaurant.toJSON(),
      });
    } catch (error) {
      console.error("Update restaurant profile error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get restaurant menu
router.get("/menu", async (req, res) => {
  try {
    const { ownerId } = req.query;
    const { db } = require("../config/firebase");

    if (!ownerId) {
      return res.status(400).json({ error: "ownerId is required" });
    }

    // 找到登入的那家餐廳
    const snap = await db
      .collection("users")
      .where("id", "==", ownerId)
      .where("role", "==", "restaurant")
      .limit(1)
      .get();

    if (snap.empty) {
      return res.json({ menu: [] });
    }

    const data = snap.docs[0].data();
    const menu = data.profile?.menu || [];

    res.json({ menu });
  } catch (error) {
    console.error("Get restaurant menu error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update restaurant menu
router.put(
  "/menu",
  [body("ownerId").isString(), body("menu").isArray()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { ownerId, menu } = req.body;
      console.log(ownerId);

      const { db } = require("../config/firebase");
      const usersSnapshot = await db
        .collection("users")
        .where("id", "==", ownerId)
        .where("role", "==", "restaurant")
        .get();

      if (usersSnapshot.empty) {
        return res
          .status(404)
          .json({ error: "Restaurant not found for this ownerId" });
      }

      const ownerDoc = usersSnapshot.docs[0];

      await ownerDoc.ref.update({
        "profile.menu": menu,
        updatedAt: new Date(),
      });

      res.json({
        message: "Menu updated successfully",
        menu,
      });
    } catch (error) {
      console.error("Update restaurant menu error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

router.post("/fix-geolocation", async (req, res) => {
  try {
    const { db } = require("../config/firebase");
    const admin = require("firebase-admin");
    const axios = require("axios");

    const snap = await db
      .collection("users")
      .where("role", "==", "restaurant")
      .get();

    console.log("Found restaurants:", snap.size);

    for (const doc of snap.docs) {
      const data = doc.data();

      if (data.location) {
        console.log(`Skip ${doc.id} (already has location)`);
        continue;
      }

      const addr = data.profile?.address;
      if (!addr) {
        console.log(`Skip ${doc.id} (missing address)`);
        continue;
      }

      const formatted = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
      console.log("Geocoding:", formatted);

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        formatted
      )}&key=${apiKey}`;

      const geoRes = await axios.get(url);

      if (geoRes.data.status === "OK") {
        const { lat, lng } = geoRes.data.results[0].geometry.location;
        await doc.ref.update({
          location: new admin.firestore.GeoPoint(lat, lng),
        });
        console.log(`Updated ${doc.id}: ${lat}, ${lng}`);
      } else {
        console.log(`Failed geocoding ${doc.id}:`, geoRes.data.status);
      }
    }

    res.json({ message: "Restaurant geolocation update complete." });
  } catch (error) {
    console.error("Fix geolocation error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
