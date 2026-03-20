// Require an authenticated admin user for protected admin endpoints.
export function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.status && req.user.status !== "active") {
        return res.status(403).json({ message: "Account is suspended" });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }

    return next();
}
