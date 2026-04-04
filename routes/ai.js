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

function normalizeText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function parseIngredientList(value) {
  return normalizeText(value)
    .split(/[,\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatTimePreference(value) {
  switch (String(value || "any")) {
    case "15":
      return "under 15 minutes";
    case "30":
      return "under 30 minutes";
    case "60":
      return "under 1 hour";
    case "slow":
      return "slow cook / 1+ hours";
    default:
      return "any amount of time";
  }
}

function sanitizeAiSuggestion(rawText, options = {}) {
  const useSavedAllergens = Boolean(options.useSavedAllergens);
  const text = String(rawText || "").replace(/\r/g, "");

  // Remove markdown separators and repeated punctuation artifacts.
  let cleaned = text
    .replace(/[ \t]*[-_=*]{3,}[ \t]*/g, "\n")
    .replace(/\.{4,}/g, "...");

  // Hard-stop before any alternative recommendation block.
  const lines = cleaned.split("\n");
  const altIndex = lines.findIndex((line) => /^(alternative|other\s+suggestions?|extra\s+suggestions?)\b/i.test(line.trim()));
  if (altIndex >= 0) {
    cleaned = lines.slice(0, altIndex).join("\n");
  }

  if (!useSavedAllergens) {
    // Remove invented dietary declarations when allergen filtering is OFF.
    cleaned = cleaned
      .replace(/\b(no|without)\s+(egg|eggs|protein|rice)\b[^.\n]*[.]?/gi, "")
      .replace(/\b(allergen|allergy|allergies)\b[^.\n]*[.]?/gi, "");
  }

  return cleaned
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}


router.post("/suggest", verifyToken, async (req, res) => {
  console.log("GEMINI_API_KEY from env:", process.env.GEMINI_API_KEY ? "Found" : "NOT FOUND");
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
  });
  try {
    const user = await User.findById(req.user._id).select("allergens full_name username");
    const cookingHistory = await CookingHistory.find({ user_id: req.user._id })
      .sort({ cooked_at: -1 })
      .select("recipe_name cooked_at");
    const requestedIngredients = parseIngredientList(req.body?.ingredients);
    const timePreference = formatTimePreference(req.body?.time);
    const useSavedAllergens = req.body?.useSavedAllergens !== false && req.body?.useSavedAllergens !== "false";

    if (requestedIngredients.length === 0) {
      return res.status(400).json({ message: "Please provide at least one ingredient." });
    }

    const allergens = useSavedAllergens ? (user?.allergens || []) : [];
    const recentRecipes = cookingHistory.slice(0, 5).map(entry => entry.recipe_name);
    const ingredientSummary = requestedIngredients.length > 0
      ? requestedIngredients.join(", ")
      : "no specific ingredients provided";
    const allergenSummary = allergens.length > 0
      ? allergens.join(", ")
      : "none";

    const prompt = [
      "You are a Filipino recipe assistant.",
      `User ingredients: ${ingredientSummary}.`,
      `Time preference: ${timePreference}.`,
      `Saved allergen filter is ${useSavedAllergens ? "ON" : "OFF"}.`,
      `Allergens to avoid: ${allergenSummary}.`,
      `Recently cooked recipes to avoid repeating: ${recentRecipes.length > 0 ? recentRecipes.join(", ") : "none"}.`,
      "Suggest exactly one Filipino recipe that best matches the ingredients and time preference.",
      "Keep the recipe practical, avoid the listed allergens, and do not repeat a recent recipe.",
      "Do not invent extra dietary restrictions beyond the provided allergens.",
      "If allergen filter is OFF or allergens are 'none', do not mention allergy-based restrictions.",
      "Never include alternatives, substitutions list sections, or 'other suggestions'.",
      "Return only one final recipe and stop after the Tip section.",
      "Return only plain text using exactly these section labels and order:",
      "Recipe Name: <actual Filipino dish name>",
      "Why it fits: <clear explanation of why this fits the user's ingredients, time, and allergen limits>",
      "Main Ingredients:",
      "Steps:",
      "Time Estimate: <e.g., 25 minutes>",
      "Nutrition: <Calories, Protein, Carbs, Fat per serving>",
      "Tip: <one practical tip>",
      "Rules:",
      "- Main Ingredients must be a bullet list using '-' prefix.",
      "- Steps must be a numbered list using 1., 2., 3. format.",
      "- Nutrition should include estimated calories, protein, carbs, and fat per serving.",
      "- Do not use ellipsis (no '...' anywhere).",
      "- Steps must be complete, actionable, and not cut off.",
      "- Keep the response practical and complete."
    ].join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const suggestion = sanitizeAiSuggestion(response.text, {
      useSavedAllergens,
      allergens
    });

    return res.json({
      suggestion,
      promptInfo: {
        ingredients: requestedIngredients,
        timePreference,
        useSavedAllergens,
        allergens
      }
    });
  } catch (err) {
    console.error("Error generating AI suggestion:", err);
    return res.status(500).json({ message: "Error generating AI suggestion", error: err.message });
  }
});

export default router;