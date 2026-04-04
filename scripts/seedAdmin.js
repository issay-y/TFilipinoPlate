import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { User } from "../models/user.models.js";

//npm run seed:admin -- to run
dotenv.config();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function seedAdmin() {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment.");
        process.exit(1);
    }

    await mongoose.connect("mongodb://127.0.0.1:27017/filipino_plate");

    const existingUser = await User.findOne({ email: ADMIN_EMAIL });

    if (existingUser) {
        const updates = {
            role: "admin",
            status: "active"
        };

        // Only reset password if explicitly requested for existing user.
        if (process.env.ADMIN_RESET_PASSWORD === "true") {
            updates.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
        }

        await User.updateOne({ _id: existingUser._id }, { $set: updates });
        console.log("Admin user already existed and was updated.");
    } else {
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await User.create({
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: "admin",
            status: "active",
            allergens: []
        });

        console.log("Admin user created successfully.");
    }

    await mongoose.disconnect();
}

seedAdmin().catch(async (err) => {
    console.error("Failed to seed admin:", err.message);
    try {
        await mongoose.disconnect();
    } catch (_err) {
        // Ignore disconnect errors in failure path.
    }
    process.exit(1);
});
