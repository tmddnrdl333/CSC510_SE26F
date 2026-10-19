// models/User.js
const { db } = require("../config/firebase");
const admin = require("firebase-admin");
const axios = require("axios");

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role;
    this.profile = data.profile || {};
    this.deliveryStatus =
      data.deliveryStatus || (data.role === "delivery" ? "free" : null);
    this.location = data.location || null; // GeoPoint

    this.totalEarnings = data.totalEarnings || 0; 

    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static formatAddress(addr) {
    if (!addr) return null;
    const { street, city, state, zipCode } = addr;
    return [street, city, state, zipCode].filter(Boolean).join(", ");
  }

  static async geocodeAddress(addrObj) {
    try {
      const formatted = User.formatAddress(addrObj);
      if (!formatted) return null;

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        formatted
      )}&key=${apiKey}`;

      const res = await axios.get(url);

      if (res.data.status === "OK" && res.data.results.length > 0) {
        const { lat, lng } = res.data.results[0].geometry.location;
        return new admin.firestore.GeoPoint(lat, lng);
      }
      return null;
    } catch (err) {
      console.error("User geocode error:", err.message);
      return null;
    }
  }

  /** Create user with possible client lat/lng or geocode */
  static async create(userData) {
    try {
      const userRef = db.collection("users").doc();

      let geoPoint = null;

      // Case 1: client 已經給 lat/lng
      if (userData.location?.lat && userData.location?.lng) {
        geoPoint = new admin.firestore.GeoPoint(
          userData.location.lat,
          userData.location.lng
        );
      }
      // Case 2: 沒 lat/lng → 從 address geocode
      else if (userData.profile?.address) {
        geoPoint = await User.geocodeAddress(userData.profile.address);
      }

      const userDoc = {
        id: userRef.id,
        ...userData,
        location: geoPoint,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await userRef.set(userDoc);
      return new User(userDoc);
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  static async findById(id) {
    const doc = await db.collection("users").doc(id).get();
    if (!doc.exists) return null;
    return new User({ id: doc.id, ...doc.data() });
  }

  static async findByEmail(email) {
    const snap = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return new User({ id: doc.id, ...doc.data() });
  }

  async update(updateData) {
    try {
      const userRef = db.collection("users").doc(this.id);
      let payload = {
        ...updateData,
        updatedAt: new Date(),
      };

      // Case 1: client 有傳 lat/lng
      if (updateData.location?.lat && updateData.location?.lng) {
        payload.location = new admin.firestore.GeoPoint(
          updateData.location.lat,
          updateData.location.lng
        );
      }
      // Case 2: 沒 lat/lng，但有新的 address
      else if (updateData.profile?.address) {
        const newLoc = await User.geocodeAddress(updateData.profile.address);
        if (newLoc) {
          payload.location = newLoc;
        }
      }

      await userRef.update(payload);

      Object.assign(this, payload);
      return this;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      profile: this.profile,
      deliveryStatus: this.deliveryStatus,
      location: this.location
        ? {
            latitude: this.location.latitude,
            longitude: this.location.longitude,
          }
        : null,
      totalEarnings: this.totalEarnings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
  async updateEarnings(amount) {
    try {
      const userRef = db.collection('users').doc(this.id);
      const newTotal = (this.totalEarnings || 0) + amount;
      await userRef.update({
        totalEarnings: newTotal,
        updatedAt: new Date()
      });
      this.totalEarnings = newTotal;
      return this;
    } catch (error) {
      throw new Error(`Failed to update earnings: ${error.message}`);
    }
  }

  /** Set a delivery partner's availability ('free' | 'busy'). */
  async updateDeliveryStatus(status) {
    if (!['free', 'busy'].includes(status)) {
      throw new Error(`Invalid delivery status: ${status}`);
    }
    try {
      await db.collection('users').doc(this.id).update({
        deliveryStatus: status,
        updatedAt: new Date()
      });
      this.deliveryStatus = status;
      return this;
    } catch (error) {
      throw new Error(`Failed to update delivery status: ${error.message}`);
    }
  }
}

module.exports = User;
