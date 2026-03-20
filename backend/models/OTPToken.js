const mongoose = require("mongoose");

const otpTokenSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  otp:      { type: String, required: true },  // bcrypt hashed
  purpose:  { type: String, enum: ["email_verification", "login_mfa", "password_reset"], required: true },
  expiresAt:{ type: Date, required: true },
  used:     { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },      // max 5
  createdAt:{ type: Date, default: Date.now },
});

// MongoDB auto-deletes expired tokens
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OTPToken", otpTokenSchema);
