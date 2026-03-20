import * as Yup from "yup";

export const loginSchema = Yup.object({
  systemEmail: Yup.string().email("Invalid email format").required("Email is required"),
  password:    Yup.string().min(6, "Minimum 6 characters").required("Password is required"),
});

export const registerSchema = Yup.object({
  firstName:     Yup.string().min(2).max(50).matches(/^[a-zA-Z]+$/, "Letters only").required("First name is required"),
  lastName:      Yup.string().min(2).max(50).matches(/^[a-zA-Z]+$/, "Letters only").required("Last name is required"),
  role:          Yup.string().oneOf(["employee", "hr", "admin", "superAdmin"], "Select a valid role").required("Role is required"),
  personalEmail: Yup.string().email("Invalid email format").required("Personal email is required")
    .test("not-netpair", "Use your personal email, not a NetPair address", (val) => !val?.endsWith("@netpair.com")),
  password:      Yup.string().min(8, "Minimum 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/, "Must include uppercase, lowercase, number and special character (@$!%*?&#)")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Confirm password is required"),
});

export const forgotSchema = Yup.object({
  email: Yup.string().email("Invalid email format").required("Email is required"),
});
