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
    personalEmail: "jeemmu237@gmail.com",
    password:      "Admin@1234",
    mfaMethod:     "otp",
  },
  {
    firstName:     "Rohit",
    lastName:      "Prajapati",
    role:          "hr",
    systemEmail:   "rohit.prajapati.hr@netpair.com",
    personalEmail: "jeemmu222@gmail.com",
    password:      "Hr@1234",
    mfaMethod:     "otp",
  },
  {
    firstName:     "Ashish",
    lastName:      "Girase",
    role:          "employee",
    systemEmail:   "ashish.girase.employee@netpair.com",
    personalEmail: "jeemmu444@gmail.com",
    password:      "Employee@1234",
    mfaMethod:     "otp",
  },
  {
    firstName:     "Ravi",
    lastName:      "Sharma",
    role:          "employee",
    systemEmail:   "ravi.sharma.employee@netpair.com",
    personalEmail: "jeemmu111@gmail.com",
    password:      "Employee@1234",
    mfaMethod:     "otp",
  },
  {
    firstName:     "Neha",
    lastName:      "Patel",
    role:          "employee",
    systemEmail:   "neha.patel.employee@netpair.com",
    personalEmail: "jeemmu333@gmail.com",
    password:      "Employee@1234",
    mfaMethod:     "otp",
  },
];

async function run() {
  console.log("\nConnecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.\n");

  const User     = require("../models/User");
  const Employee = require("../models/Employee");

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

    let userDoc;
    if (existing) {
      await User.findOneAndUpdate(
        { _id: existing._id },
        { $set: { password: hash, isVerified: true, isActive: true, mfaMethod: u.mfaMethod, personalEmail: u.personalEmail } }
      );
      userDoc = existing;
      console.log("UPDATED:", u.systemEmail.padEnd(52), "→", u.password);
    } else {
      userDoc = await User.create({
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

    // Step 2b — Ensure Employee record exists for employee/hr/admin roles
    if (["employee", "hr", "admin", "superAdmin"].includes(u.role)) {
      const empExists = await Employee.findOne({ userId: userDoc._id });
      if (!empExists) {
        const deptMap = {
          superAdmin: "Management",
          admin:      "Administration",
          hr:         "Human Resources",
          employee:   "Engineering",
        };
        const desigMap = {
          superAdmin: "Super Administrator",
          admin:      "Administrator",
          hr:         "HR Manager",
          employee:   "Software Engineer",
        };
        await Employee.create({
          userId:      userDoc._id,
          firstName:   u.firstName,
          lastName:    u.lastName,
          email:       u.systemEmail,
          department:  deptMap[u.role] || "General",
          designation: desigMap[u.role] || "Employee",
          status:      "active",
          joiningDate: new Date("2024-01-01"),
        });
        console.log("  → Employee record created for", u.firstName, u.lastName);
      } else {
        console.log("  → Employee record already exists for", u.firstName, u.lastName);
      }
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
