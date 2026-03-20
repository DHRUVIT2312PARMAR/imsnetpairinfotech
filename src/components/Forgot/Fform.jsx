import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const Fform = () => {
  const [step, setStep]       = useState(1); // 1=Email, 2=OTP, 3=Reset
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) return toast.error("Enter a valid email");
    setLoading(true);
    // Simulate OTP send (replace with real API call when email service is set up)
    await new Promise(r => setTimeout(r, 800));
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    setOtp(generated);
    setLoading(false);
    toast.success(`OTP sent to ${email} (demo: ${generated})`);
    setStep(2);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (enteredOtp !== otp) return toast.error("Invalid OTP. Please try again.");
    toast.success("OTP verified");
    setStep(3);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) return toast.error("Password must be at least 6 characters");
    if (newPass !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    toast.success("Password reset successfully! Please login.");
    setStep(1);
    setEmail(""); setOtp(""); setEnteredOtp(""); setNewPass(""); setConfirm("");
  };

  const stepLabel = ["Enter Email", "Verify OTP", "Reset Password"];

  return (
    <div className="flex items-center justify-center pt-16 pb-24">
      <div className="bg-white p-8 rounded-xl w-full max-w-sm shadow space-y-5">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          {[1,2,3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-1 rounded transition ${step > s ? "bg-blue-600" : "bg-gray-200"}`}></div>}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-gray-500 -mt-2">{stepLabel[step - 1]}</p>

        <h2 className="text-xl font-semibold">Forgot Password</h2>

        {/* Step 1 — Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input id="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-800 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Sending...</> : "Send OTP"}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-xs text-gray-500">OTP sent to <span className="font-medium text-gray-700">{email}</span></p>
            <div>
              <label htmlFor="forgot-otp" className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
              <input id="forgot-otp" type="text" maxLength={6} value={enteredOtp} onChange={e => setEnteredOtp(e.target.value)}
                placeholder="6-digit OTP"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm tracking-widest text-center text-lg font-bold" />
            </div>
            <button type="submit"
              className="w-full bg-blue-800 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition">
              Verify OTP
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-gray-500 hover:text-blue-600">
              ← Change email
            </button>
          </form>
        )}

        {/* Step 3 — New Password */}
        {step === 3 && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label htmlFor="forgot-newpass" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input id="forgot-newpass" type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div>
              <label htmlFor="forgot-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input id="forgot-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-800 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Resetting...</> : "Reset Password"}
            </button>
          </form>
        )}

        <p className="text-center text-sm">
          <Link to="/" className="text-blue-600 hover:underline">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Fform;
