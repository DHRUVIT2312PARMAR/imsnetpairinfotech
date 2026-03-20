require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require("../models/User");

  // List all users first
  const users = await User.find({}, { systemEmail:1, isVerified:1, isActive:1, role:1, mfaMethod:1 });
  console.log("\nALL USERS IN DB:");
  users.forEach(u => console.log(
    " ", u.systemEmail, "| role:", u.role,
    "| verified:", u.isVerified, "| active:", u.isActive, "| mfa:", u.mfaMethod
  ));

  const hash = await bcrypt.hash("Admin@1234", 12);

  // Switch superAdmin to OTP so login works via email code
  const result = await User.findOneAndUpdate(
    { systemEmail: "dhruvitkumar.parmar.superadmin@netpair.com" },
    {
      $set: {
        password:    hash,
        isVerified:  true,
        isActive:    true,
        mfaMethod:   "otp",       // ← switched from totp to otp
        totpEnabled: false,
        totpSecret:  null,
      },
    },
    { new: true }
  );

  if (result) {
    console.log("\n✓ FIXED:", result.systemEmail);
    console.log("  Login email:  ", result.systemEmail);
    console.log("  Password:      Admin@1234");
    console.log("  MFA method:    otp  (code sent to", result.personalEmail, ")");
    console.log("  isVerified:   ", result.isVerified);
    console.log("  isActive:     ", result.isActive);
  } else {
    console.log("\n✗ User not found — creating fresh superAdmin...");
    const newUser = await User.create({
      firstName:     "Dhruvitkumar",
      lastName:      "Parmar",
      role:          "superAdmin",
      systemEmail:   "dhruvitkumar.parmar.superadmin@netpair.com",
      personalEmail: "dhruvitpc@gmail.com",
      username:      "Dhruvitkumar Parmar",
      email:         "dhruvitkumar.parmar.superadmin@netpair.com",
      password:      hash,
      mfaMethod:     "otp",
      isVerified:    true,
      isActive:      true,
      totpEnabled:   false,
    });
    console.log("\n✓ CREATED:", newUser.systemEmail);
    console.log("  Password:   Admin@1234");
    console.log("  MFA method: otp (code sent to dhruvitpc@gmail.com)");
  }

  process.exit();
}).catch(err => {
  console.error("DB Error:", err.message);
  process.exit(1);
});
