import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    actor_user_id: { type: String, required: true },
    actor_email: { type: String, default: null },
    action: { type: String, required: true },
    target_model: { type: String, required: true },
    target_id: { type: String, required: true },
    target_summary: { type: Object, default: {} },
    before: { type: Object, default: null },
    after: { type: Object, default: null },
    created_at: { type: Date, default: Date.now }
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export { AuditLog };
