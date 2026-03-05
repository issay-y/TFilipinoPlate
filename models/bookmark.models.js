import mongoose from "mongoose";

const Bookmark = mongoose.model("Bookmark", new mongoose.Schema({
        user_id: { type: String, required: true }, //reference to User
        recipe_id: { type: String, required: true }, //reference to Recipe from API
        recipe_name: { type: String, required: true },
        recipe_image: String,
        cooking_method: String,
        bookmarked_at: { type: Date, default: Date.now }
    }));
export { Bookmark };