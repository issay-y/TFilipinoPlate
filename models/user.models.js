import mongoose from "mongoose";

const User = mongoose.model("User", new mongoose.Schema({
        username: { type: String, unique: true, required: true},
        email: { type: String, unique: true, required: true },
    full_name: { type: String, default: "" },
    avatar: { type: String, default: "" },
    password: { type: String, required: true }, // Save only a hashed password, never plain text.
        role: { type: String, enum: ["user", "admin"], default: "user" },
        status: { type: String, enum: ["active", "suspended"], default: "active" },
        allergens: [String],
        created_at: { type: Date, default: Date.now }
    }));
export { User };