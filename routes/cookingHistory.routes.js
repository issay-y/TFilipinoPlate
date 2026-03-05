import express from "express";

const router = express.Router();
// Define routes for bookmarks here

router.post("/", (req, res) => {
    //Logic to log history
    res.json({ message: "Cooking history logged successfully" });
});

router.get("/", (req, res) => {
    //Logic to get cooking history for a user
    res.json({ cookingHistory: [] });
});

export default router;