import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

const router = express.Router();

// Register endpoint
router.post("/register", (req, res) => {
  // TODO: Implement registration logic (Week 2)
  // 1. Validate input: username, email, password (non-empty, valid email format, password strength)
  // 2. Check if user already exists: User.findOne({ email })
  // 3. Hash password: bcrypt.hash(password, saltRounds), jwt.sign({ userId: user._id }, secretKey, { expiresIn: "1h" })
  // 4. Save user to database: const newUser = new User({ username, email, password: hashedPassword });

  const { username, email, password } = req.body;

   // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
    // Check if user already exists
  User.findOne({ email }).then((existingUser) => {
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }
    else {
      // Hash password and save user
      bcrypt.hash(password, 10).then((hashedPassword) => {
        const newUser = new User({ username, email, password: hashedPassword }); // Create new user instance with hashed password
        newUser.save().then((savedUser) => {
          const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" }); // Generate JWT token
          res.json({ token });
        }).catch((err) => {
          console.error("Error saving user:", err);
          res.status(500).json({ message: "Error saving user" });
        });
      }).catch((err) => {
        console.error("Error hashing password:", err);
        res.status(500).json({ message: "Error hashing password" });
      });
    }
  });

  res.json({ message: "Register endpoint" });
});

// Login endpoint
router.post("/login", (req, res) => {
  // TODO: Implement login logic (Week 2)
  res.json({ message: "Login endpoint" });
});

// Get current user (protected)
router.get("/me", (req, res) => {
  // TODO: Implement with auth middleware (Week 2)
  res.json({ message: "Current user endpoint" });
});

export default router;
