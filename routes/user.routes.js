import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { User } from "../models/user.models.js";

const router = express.Router();

// Get the logged-in user's allergen list.
router.get("/allergens", verifyToken, async (req, res) => {
  // TODO: Add token check middleware so only logged-in users can access this route.

  try {

    const id = req.userId; // Set by auth middleware after token check
    
    const userId = await User.findById(id).select("allergens").then(user => {
      if (!user) {
        return null;
      }
      return user.allergens;
    });

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found in token" });
    }

  } catch (err) {
    console.error("Error fetching allergens:", err.message);
    return res.status(500).json({ message: "Error fetching allergens", error: err.message });
  }

  res.json({ allergens: [] });
});

// Update the logged-in user's allergen list.
router.put("/allergens", verifyToken, async (req, res) => {
  // TODO: Add token check middleware so only logged-in users can update this route.

  try {
    const userId = req.userId; // Set by auth middleware after token check.
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user ID found in token" });
    }
    const { allergens } = req.body;
    if (!Array.isArray(allergens)) {
      return res.status(400).json({ message: "Allergens must be an array" });
    }
  } catch (err) {
    console.error("Error updating allergens:", err.message);
    return res.status(500).json({ message: "Error updating allergens", error: err.message });
  }
  res.json({ message: "Allergens updated" });
});

export default router;
