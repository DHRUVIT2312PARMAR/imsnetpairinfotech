const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    userName: { type: String, default: "" },
    action:   { type: String, enum: ["LOGIN","LOGOUT","CREATE","UPDATE","DELETE","APPROVE","REJECT","EXPORT","ROLE_CHANGE","VIEW"], index: true },
    module:   { type: String, default: "" },
    detail:   { type: String, default: "" },
    ip:       { type: String, default: "" },
  },
  { timestamps: true }
);

// Auto-expire logs after 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
