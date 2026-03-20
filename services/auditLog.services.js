import { AuditLog } from "../models/auditLog.models.js";

export async function writeAuditLog({ actorUser, action, targetModel, targetId, targetSummary, before, after }) {
    return AuditLog.create({
        actor_user_id: String(actorUser?._id || ""),
        actor_email: actorUser?.email || null,
        action,
        target_model: targetModel,
        target_id: String(targetId),
        target_summary: targetSummary || {},
        before: before || null,
        after: after || null
    });
}

export function buildUserSnapshot(userDoc) {
    if (!userDoc) {
        return null;
    }

    return {
        _id: String(userDoc._id),
        username: userDoc.username,
        email: userDoc.email,
        role: userDoc.role,
        status: userDoc.status
    };
}