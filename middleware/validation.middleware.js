import { validationResult } from "express-validator";

export function handleValidationErrors(req, res) {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return null;
    }

    return res.status(400).json({
        message: "Validation failed",
        errors: errors.array().map((error) => ({ field: error.path, message: error.msg }))
    });
}
