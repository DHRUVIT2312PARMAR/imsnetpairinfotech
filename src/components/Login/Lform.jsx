// src/components/Login/Lform.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useThemeLang } from "../../context/ThemeLanguageContext";
import { toast } from "react-toastify";
import api from "../../services/api";

const Lform = () => {
  const { login } = useAuth();
  const { t, isDark, toggleTheme } = useThemeLang();

  const [step, setStep]               = useState("credentials");
  const [mfaMethod, setMfaMethod]     = useState("");
  const [tempToken, setTempToken]     = useState("");
  const [mfaCode, setMfaCode]         = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [showPass, setShowPass]       = useState(false);

  const [creds, setCreds] = useState({ systemEmail: "", password: "" });
  const [errors, setErrors] = useState({});

  const validateCreds = () => {
    const e = {};
    if (!creds.systemEmail.trim()) e.systemEmail = t('auth.email_required') || "Email is required";
    else if (!/\S+@\S+\.\S+/.test(creds.systemEmail)) e.systemEmail = t('auth.invalid_email') || "Invalid email format";
    if (!creds.password) e.password = t('auth.password_required') || "Password is required";
    return e;
  };

  // Step 1 — submit credentials
  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    const errs = validateCreds();
    if (Object.keys(errs).length) return setErrors(errs);

    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        systemEmail: creds.systemEmail,
        password:    creds.password,
      });
      setMfaMethod(data.data.mfaMethod);
      setTempToken(data.data.tempToken);
      setMaskedEmail(data.data.maskedEmail || "");
      setStep("mfa");
      if (data.data.mfaMethod === "otp") {
        toast.info(t('auth.otp_sent') || "OTP sent to your personal email");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.login_failed') || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 — submit MFA code
  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) return toast.error(t('auth.enter_code') || "Enter the verification code");

    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/verify-mfa", { tempToken, mfaCode });
      login(data.data.user);
      toast.success(`${t('auth.welcome_back') || 'Welcome back'}, ${data.data.user.firstName}!`);
      window.location.replace("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.verification_failed') || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post("/auth/resend-otp", { tempToken });
      toast.success(t('auth.otp_resent') || "OTP resent to your personal email");
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.resend_failed') || "Could not resend OTP");
    }
  };

  const inputCls = (name) =>
    `w-full h-10 border rounded px-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm
    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
    placeholder-gray-400 dark:placeholder-gray-600 transition ${
      errors[name] ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-700"
    }`;

  return (
    <div className="relative">
      {/* Top-right quick controls for auth pages */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button onClick={toggleTheme}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700
            bg-white dark:bg-gray-900 flex items-center justify-center text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800">
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* ── Step 1: Credentials ─────────────────────────────────────────── */}
      {step === "credentials" && (
        <form onSubmit={handleCredentialSubmit}
          className="bg-white dark:bg-gray-900 p-8 rounded-lg w-full max-w-md shadow-lg border border-gray-100 dark:border-gray-800 transition">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('auth.sign_in') || 'Login to your account'}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{t('auth.sign_in_subtitle') || 'Enter your NetPair login email and password'}</p>

          <div className="mb-4">
            <label htmlFor="login-email" className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
              {t('auth.netpair_email') || 'NetPair Email'}
            </label>
            <input id="login-email" type="email" name="systemEmail"
              value={creds.systemEmail}
              onChange={(e) => { setCreds(p => ({ ...p, systemEmail: e.target.value })); setErrors(p => ({ ...p, systemEmail: "" })); }}
              placeholder="name.surname.role@netpair.com"
              className={inputCls("systemEmail")} />
            {errors.systemEmail && (
              <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center gap-1">
                <i className="ri-error-warning-line" />{errors.systemEmail}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="login-password" className="block font-medium mb-1 text-sm text-gray-700 dark:text-gray-300">
              {t('auth.password') || 'Password'}
            </label>
            <div className="relative">
              <input id="login-password" type={showPass ? "text" : "password"} name="password"
                value={creds.password}
                onChange={(e) => { setCreds(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: "" })); }}
                placeholder={t('auth.enter_password') || "Enter your password"}
                className={`${inputCls("password")} pr-10`} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                <i className={showPass ? "ri-eye-off-line" : "ri-eye-line"} />
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center gap-1">
                <i className="ri-error-warning-line" />{errors.password}
              </p>
            )}
          </div>

          <div className="flex justify-end mb-6 text-sm">
            <Link to="/forgot" className="text-blue-700 dark:text-blue-400 font-semibold hover:underline transition">
              {t('auth.forgot_password') || 'Forgot Password?'}
            </Link>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full bg-blue-800 dark:bg-blue-600 text-white py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isLoading ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>{t('common.loading') || 'Checking...'}</>
            ) : (t('auth.continue') || 'Continue')}
          </button>

          <p className="text-center mt-5 text-sm text-gray-600 dark:text-gray-400">
            {t('auth.no_account') || "Don't have an account?"}{" "}
            <Link to="/employee/registration" className="text-blue-700 dark:text-blue-400 font-bold hover:underline transition">
              {t('auth.sign_up_btn') || 'Sign Up'}
            </Link>
          </p>
        </form>
      )}

      {/* ── Step 2: MFA ─────────────────────────────────────────────────── */}
      {step === "mfa" && (
        <form onSubmit={handleMfaSubmit}
          className="bg-white dark:bg-gray-900 p-8 rounded-lg w-full max-w-md shadow-lg border border-gray-100 dark:border-gray-800 transition">
          <button type="button" onClick={() => { setStep("credentials"); setMfaCode(""); setMaskedEmail(""); }}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition">
            <i className="ri-arrow-left-line" /> {t('common.back') || 'Back'}
          </button>

          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('auth.two_factor') || 'Two-factor verification'}</h2>

          {mfaMethod === "otp" && (
            <>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{t('auth.otp_sent_desc') || 'A 6-digit code has been sent to your personal email.'}</p>
              {maskedEmail && (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-4 py-2.5 mb-3 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <span className="text-blue-700 dark:text-blue-400 text-sm font-medium tracking-wide">{maskedEmail}</span>
                </div>
              )}
              <p className="text-gray-400 dark:text-gray-500 text-xs mb-6">{t('auth.check_inbox') || 'Check your inbox — valid for 10 minutes.'}</p>
            </>
          )}
          {mfaMethod === "totp" && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{t('auth.totp_desc') || 'Enter the 6-digit code from your authenticator app.'}</p>
          )}

          <input type="text" maxLength={6} inputMode="numeric" placeholder="000000"
            value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
            className="w-full h-16 border border-gray-300 dark:border-gray-700 rounded-lg text-center text-3xl tracking-[16px] font-mono outline-none focus:ring-2 focus:ring-blue-500 mb-5
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition" />

          <button type="submit" disabled={isLoading}
            className="w-full bg-blue-800 dark:bg-blue-600 text-white py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isLoading ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>{t('auth.verifying') || 'Verifying...'}</>
            ) : (t('auth.verify_signin') || 'Verify & Sign In')}
          </button>

          {mfaMethod === "otp" && (
            <button type="button" onClick={handleResendOtp}
              className="w-full mt-3 text-sm text-blue-700 dark:text-blue-400 hover:underline transition">
              {t('auth.resend_code') || 'Resend code'}
            </button>
          )}
        </form>
      )}
    </div>
  );
};

export default Lform;
