import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { User } from "../models/user.models.js";
import { CookingHistory } from "../models/cookingHistory.models.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Return an AI-based recipe suggestion.
// This will get the user's allergens and cooking history
// then use that to generate a recipe suggestion using Gemini.

const router = express.Router();


router.post("/suggest", verifyToken, async (req, res) => {
  console.log("GEMINI_API_KEY from env:", process.env.GEMINI_API_KEY ? "Found" : "NOT FOUND");
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
  });
  try {
    const user = await User.findById(req.user._id).select("allergens");
    const cookingHistory = await CookingHistory.find({ user_id: req.user._id }).select("recipe_name");

    const allergens = user.allergens || [];
    const recentRecipes = cookingHistory.slice(0, 5).map(entry => entry.recipe_name);

    const prompt = `Suggest a Filipino recipe that does not include these allergens: ${allergens.join(", ")}. The user recently cooked: ${recentRecipes.join(", ")}.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return res.json({ suggestion: response.text });
} catch (err) {
  console.error("Error generating AI suggestion:", err);
  return res.status(500).json({ message: "Error generating AI suggestion", error: err.message });
  }
});

export default router;