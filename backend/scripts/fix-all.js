require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require("../models/User");

  const adminHash = await bcrypt.hash("Admin@1234", 12);
  const hrHash    = await bcrypt.hash("Hr@1234", 12);
  const empHash   = await bcrypt.hash("Employee@1234", 12);

  // Fix all users — set isVerified + isActive
  await User.updateMany({}, { $set: { isVerified: true, isActive: true } });

  // Fix mitesh — switch totp → otp, reset password
  await User.findOneAndUpdate(
    { systemEmail: "mitesh.patel.admin@netpair.com" },
    { $set: { password: adminHash, mfaMethod: "otp", totpSecret: null, totpEnabled: false } }
  );

  // Fix superAdmin password
  await User.findOneAndUpdate(
    { systemEmail: "dhruvitkumar.parmar.superadmin@netpair.com" },
    { $set: { password: adminHash, mfaMethod: "otp" } }
  );

  // Fix hr password
  await User.findOneAndUpdate(
    { systemEmail: "rohit.prajapati.hr@netpair.com" },
    { $set: { password: hrHash, mfaMethod: "otp" } }
  );

  // Fix employee password
  await User.findOneAndUpdate(
    { systemEmail: "ashish.girase.employee@netpair.com" },
    { $set: { password: empHash, mfaMethod: "otp" } }
  );

  // Show final state
  const all = await User.find({}, { systemEmail:1, isVerified:1, isActive:1, mfaMethod:1, _id:0 });
  console.log("\nALL USERS (fixed):");
  console.log("─".repeat(70));
  all.forEach(u => console.log(
    " ", u.systemEmail.padEnd(52),
    "| verified:", String(u.isVerified).padEnd(5),
    "| mfa:", u.mfaMethod
  ));

  console.log("\nPasswords:");
  console.log("  mitesh.patel.admin@netpair.com                    → Admin@1234");
  console.log("  dhruvitkumar.parmar.superadmin@netpair.com        → Admin@1234");
  console.log("  rohit.prajapati.hr@netpair.com                    → Hr@1234");
  console.log("  ashish.girase.employee@netpair.com                → Employee@1234");

  process.exit(0);
}).catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
