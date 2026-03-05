import mongoose from "mongoose";

const CookingHistory = mongoose.model("CookingHistory", new mongoose.Schema({
        user_id: { type: String, required: true }, //reference to User
        recipe_id: { type: String, required: true }, //reference to Recipe from API
        recipe_name: { type: String, required: true },
        cooking_method: String,
        cooked_at: { type: Date, default: Date.now }
    }));

export { CookingHistory };