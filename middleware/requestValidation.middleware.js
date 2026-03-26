import { handleValidationErrors } from "./validation.middleware.js";

export function validateRequest(validations = []) {
    return [
        ...validations,
        (req, res, next) => {
            if (handleValidationErrors(req, res)) {
                return;
            }
            return next();
        }
    ];
}
