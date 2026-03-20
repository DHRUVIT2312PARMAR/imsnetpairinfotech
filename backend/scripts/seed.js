/**
 * NetPair IMS — Seed Script
 * Run:  cd backend && npm run seed
 *
 * - Fixes all isVerified: false users
 * - Creates or updates seed users with known passwords
 * - Safe to run unlimited times
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const USERS = [
  {
    firstName:     "Dhruvitkumar",
    lastName:      "Parmar",
    role:          "superAdmin",
    systemEmail:   "dhruvitkumar.parmar.superadmin@netpair.com",
    personalEmail: "dhruvitpc@gmail.com",
    password:      "Admin@1234",
    mfaMethod:     "otp",
  },
  {
    firstName:     "Amit",
    lastName:      "Patel",
    role:          "admin",
    systemEmail:   "amit.patel.admin@netpair.com",
    personalEmail: "amit@gmail.com",
    password:      "Admin@1234",
    mfaMethod:     "otp",
  },
  {
    firstName:     "Mitesh",
    lastName:      "Patel",
    role:          "admin",
    systemEmail:   "mitesh.patel.admin@netpair.com",
    personalEmail: "mitesh@gmail.com",
    password:      "Admin@1234",
    mfaMethod:     "otp",
  },
  {
    firstName:     "Rohit",
    lastName:      "Prajapati",
    role:          "hr",
    systemEmail:   "rohit.prajapati.hr@netpair.com",
    personalEmail: "rohit@gmail.com",
    password:      "Hr@1234",
    mfaMethod:     "otp",
  },
  {
    firstName:     "Priya",
    lastName:      "Desai",
    role:          "hr",
    systemEmail:   "priya.desai.hr@netpair.com",
    personalEmail: "priya@gmail.com",
    password:      "Hr@1234",
    mfaMethod:     "otp",
  },
  {
    firstName:     "Ashish",
    lastName:      "Girase",
    role:          "employee",
    systemEmail:   "ashish.girase.employee@netpair.com",
    personalEmail: "ashish@gmail.com",
    password:      "Employee@1234",
    mfaMethod:     "otp",
  },
];

async function run() {
  console.log("\nConnecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.\n");

  const User = require("../models/User");

  // Step 1 — Fix all existing unverified users
  const fixed = await User.updateMany(
    { isVerified: false },
    { $set: { isVerified: true, isActive: true } }
  );
  if (fixed.modifiedCount > 0) {
    console.log(`Fixed ${fixed.modifiedCount} unverified user(s) → isVerified: true`);
  }

  // Step 2 — Create or update seed users
  console.log("\nProcessing seed users...");
  console.log("─".repeat(65));

  for (const u of USERS) {
    const hash     = await bcrypt.hash(u.password, 12);
    const existing = await User.findOne({ systemEmail: u.systemEmail });

    if (existing) {
      await User.findOneAndUpdate(
        { _id: existing._id },
        { $set: { password: hash, isVerified: true, isActive: true, mfaMethod: u.mfaMethod, personalEmail: u.personalEmail } }
      );
      console.log("UPDATED:", u.systemEmail.padEnd(52), "→", u.password);
    } else {
      await User.create({
        firstName:     u.firstName,
        lastName:      u.lastName,
        role:          u.role,
        systemEmail:   u.systemEmail,
        personalEmail: u.personalEmail,
        username:      `${u.firstName} ${u.lastName}`,
        email:         u.systemEmail,
        password:      hash,
        mfaMethod:     u.mfaMethod,
        isVerified:    true,
        isActive:      true,
      });
      console.log("CREATED:", u.systemEmail.padEnd(52), "→", u.password);
    }
  }

  // Step 3 — List all users
  const all = await User.find(
    {},
    { systemEmail: 1, role: 1, isVerified: 1, isActive: 1, _id: 0 }
  ).sort({ role: 1 });

  console.log("\n" + "─".repeat(65));
  console.log("ALL USERS IN DATABASE:\n");
  all.forEach(u =>
    console.log(
      (u.systemEmail || "NO EMAIL").padEnd(55),
      "| role:", u.role.padEnd(10),
      "| verified:", u.isVerified
    )
  );
  console.log("\nSeed complete. All users can now log in.");
  process.exit(0);
}

run().catch(err => {
  console.error("\nSeed FAILED:", err.message);
  process.exit(1);
});
