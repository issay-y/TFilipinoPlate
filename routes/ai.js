import express from "express";

const router = express.Router();

// Get AI recipe suggestion
router.post("/suggest", (req, res) => {
  // TODO: Implement OpenAI/Gemini integration (Week 5)
  res.json({ suggestion: "AI suggestion placeholder" });
});

export default router;