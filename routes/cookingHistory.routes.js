import express from "express";
import { CookingHistory } from "../models/cookingHistory.models.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();



// Add cooking history entry for the logged-in user.
router.post("/", verifyToken, async (req, res) => {
    try {
        const { recipe_id, recipe_name, cooking_method, cooked_at } = req.body;

        // Make sure required fields are included.
        if (!recipe_id || !recipe_name || !cooking_method) {
            return res.status(400).json({ message: "recipe_id, recipe_name, and cooking_method are required" });
        }

        // Save this cooking history item under the current user.
        const newHistory = new CookingHistory({
            user_id: req.userId, // Set by auth middleware after token check.
            recipe_id,
            recipe_name,
            cooking_method,
            cooked_at: cooked_at || new Date() // Use the provided date, or use now if none is given.
        });

        const savedHistory = await newHistory.save();
        res.status(201).json({ message: "Cooking history logged successfully", history: savedHistory });
    } catch (err) {
        console.error("Error logging cooking history:", err.message);
        res.status(500).json({ message: "Error logging cooking history", error: err.message });
    }
});

// Get all cooking history entries for the logged-in user.
router.get("/", verifyToken, async (req, res) => {
    try {
        const cookingHistory = await CookingHistory.find({ user_id: req.userId }).sort({ cooked_at: -1 });
        res.json({ cookingHistory, count: cookingHistory.length });
    } catch (err) {
        console.error("Error fetching cooking history:", err.message);
        res.status(500).json({ message: "Error fetching cooking history", error: err.message });
    }
});

    //diversity: access history of viewed/bookmarked recipes, also cooked
    //keep track of type of cooking method or type of dish
    //then; use that to generate AI-based recipe suggestions that fit the user's preferences and history.
    //

export default router;