import mongoose from "mongoose";
import { User } from "./models/user.models.js";
import { Bookmark } from "./models/bookmark.models.js";
import { CookingHistory } from "./models/cookingHistory.models.js";
import bookmarkRoutes from "./routes/bookmarks.routes.js";
import cookingHistoryRoutes from "./routes/cookingHistory.routes.js";
import recipeRoutes, { initRecipes } from "./routes/recipe.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import aiRoutes from "./routes/ai.js";
import cors from "cors";
import express from "express";
import dotenv from "dotenv";
//net stop MongoDB - to stop the MongoDB service
//net start MongoDB - to start the MongoDB service
//creations == tables

//CTRL + C to stop the server
//node server.js to start the server

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5500" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/user", userRoutes);
app.use("/api/cooking-history", cookingHistoryRoutes);
app.use("/api/ai", aiRoutes);

// MongoDB connection
mongoose
    .connect("mongodb://127.0.0.1:27017/filipino_plate")
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Could not connect to MongoDB", err));

// Initialize recipes cache and start server
async function startServer() {
  await initRecipes();
  
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}

startServer();