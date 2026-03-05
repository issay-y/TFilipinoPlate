import express from "express";

const router = express.Router();

// Get user allergens (protected)
router.get("/allergens", (req, res) => {
  // TODO: Implement with auth middleware (Week 4)
  res.json({ allergens: [] });
});

// Update user allergens (protected)
router.put("/allergens", (req, res) => {
  // TODO: Implement with auth middleware (Week 4)
  res.json({ message: "Allergens updated" });
});

export default router;
