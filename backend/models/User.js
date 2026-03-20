const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ── Identity (set at registration, never changes) ──────────────────────
    systemEmail:  { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    personalEmail:{ type: String, required: true, lowercase: true, trim: true },
    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, required: true, trim: true },

    // Legacy field kept for backward compat (equals systemEmail after migration)
    username:     { type: String, trim: true },
    email:        { type: String, unique: true, sparse: true, lowercase: true, trim: true },

    password:     { type: String, required: true, minlength: 8, select: false },
    role:         { type: String, enum: ["employee", "hr", "admin", "superAdmin"], default: "employee" },

    // ── Account state ──────────────────────────────────────────────────────
    isActive:     { type: Boolean, default: true, index: true },
    isVerified:   { type: Boolean, default: true },   // true = dev mode; change to false in production
    lastLogin:    { type: Date },

    // ── MFA ────────────────────────────────────────────────────────────────
    mfaMethod:    { type: String, enum: ["otp", "totp"] },
    totpSecret:   { type: String, select: false },   // base32, admin/superAdmin only
    totpEnabled:  { type: Boolean, default: false },
    backupCodes:  [{ hash: String, used: { type: Boolean, default: false } }],

    // ── Profile (filled post-login) ────────────────────────────────────────
    profile: {
      avatar:      { type: String, default: "" },
      designation: { type: String },
      department:  { type: String },
      phone:       { type: String },
      dateOfBirth: { type: Date },
      gender:      { type: String, enum: ["male", "female", "other", "prefer_not"] },
      address: {
        street:  String,
        city:    String,
        state:   String,
        pincode: String,
        country: { type: String, default: "India" },
      },
      emergencyContact: {
        name:         String,
        relationship: String,
        phone:        String,
      },
      bio:         { type: String, maxlength: 250 },
      socialLinks: { linkedin: String },
      isComplete:  { type: Boolean, default: false },
    },

    // ── Employment (set by HR/Admin) ───────────────────────────────────────
    employment: {
      joiningDate:    Date,
      employeeId:     String,
      employmentType: { type: String, enum: ["fulltime", "parttime", "contract", "intern"] },
      reportingTo:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    // ── RBAC extras ────────────────────────────────────────────────────────
    extraPermissions:   { type: [String], default: [] },
    blockedPermissions: { type: [String], default: [] },
    employeeRef:        { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },

    // ── Tokens ─────────────────────────────────────────────────────────────
    refreshToken: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.totpSecret;
  delete obj.backupCodes;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
