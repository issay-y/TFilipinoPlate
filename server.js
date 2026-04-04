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
import adminRoutes from "./routes/admin.routes.js";
import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import path from "path";
// For root page wire with landing page
import { fileURLToPath } from "url";
// Use `net stop MongoDB` to stop the MongoDB service.
// Use `net start MongoDB` to start the MongoDB service.
// In MongoDB, data is stored in collections (similar to tables).

// Press Ctrl + C to stop the server.
// Run `node server.js` to start the server.
//to cache something in git: git rm --cached "the file name"
// Load values from the .env file.
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the Express app.
const app = express();

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || !process.env.GEMINI_API_KEY || !process.env.ADMIN_USERNAME || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.error("Error: One or more required environment variables are not defined.");
  process.exit(1);
}

// Set up shared middleware.
const allowedOrigins = new Set([
  process.env.AO1,
  process.env.AO2,
  process.env.AO3,
  process.env.AO4,
  process.env.AO5,
  process.env.AO6
]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser tools and file:// origin during local development.
    if (!origin) {
      return callback(null, true);
    }

    // Allow localhost and 127.0.0.1 for local development.
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }

    // Allow VS Code devtunnels for forwarded access.
    if (origin.includes("devtunnels.ms")) {
      return callback(null, true);
    }

    // Allow other configured origins from env vars.
    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  }
}));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "front-end", "guest-home.html"));
});

app.use(express.static(path.join(__dirname, "front-end")));

// Register API route groups.
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/user", userRoutes);
app.use("/api/cooking-history", cookingHistoryRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

// Connect to MongoDB.
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Could not connect to MongoDB", err));

// Initialize recipe setup, then start the server.
async function startServer() {
  await initRecipes();
  
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer();