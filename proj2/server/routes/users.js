// routes/users.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// 取得指定 user（可用在 debug / 之後 profile page）
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: user.toJSON() });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 更新 user（地址 + 位置）
// M1: only the logged-in user may edit themselves, and only profile/location --
// passing req.body straight through let anyone set any user's role,
// password or totalEarnings.
router.put(
  "/:id",
  requireAuth,
  [
    body("profile").optional().isObject(),
    body("location").optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      if (req.params.id !== req.user.id) {
        return res.status(403).json({ error: "You can only update your own account" });
      }

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const { profile, location } = req.body;
      const updated = await user.update({
        ...(profile !== undefined ? { profile } : {}),
        ...(location !== undefined ? { location } : {}),
      });

      res.json({
        message: "User updated successfully",
        user: updated.toJSON(),
      });
    } catch (err) {
      console.error("Update user error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
