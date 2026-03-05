import express from "express";
import axios from "axios";

const router = express.Router();

let cachedRecipes = null;

export async function initRecipes() {
  const options = {
    method: "GET",
    url: "https://tasty.p.rapidapi.com/recipes/list",
    params: {
      from: "0",
      size: "20",
      tags: "under_30_minutes"
    },
    headers: {
      "x-rapidapi-key": process.env.RAPID_API_KEY,
      "x-rapidapi-host": "tasty.p.rapidapi.com"
    }
  };

  try {
    const response = await axios.request(options);
    cachedRecipes = response.data.results;
    console.log("Recipes fetched and cached on server start.");
  } catch (error) {
    console.error("Error fetching recipes on server start:", error);
  }
}

router.get("/", (req, res) => {
  if (cachedRecipes) {
    res.json(cachedRecipes);
  } else {
    res.json({ message: "Recipes not loaded yet" });
  }
});

export default router; 