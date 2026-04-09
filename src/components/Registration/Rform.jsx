// src/components/Registration/Rform.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFormik } from "formik";
import { registerSchema } from "../../schemas";
import { useThemeLang } from "../../context/ThemeLanguageContext";
import { toast } from "react-toastify";
import api from "../../services/api";

const ROLES = [
  { value: "employee",   label: "Employee" },
  { value: "hr",         label: "HR" },
  { value: "admin",      label: "Admin" },
  { value: "superAdmin", label: "Super Admin" },
];

const cleanName = (s) => s.toLowerCase().trim().replace(/[^a-z]/g, "");
const ROLE_SLUG = { employee: "employee", hr: "hr", admin: "admin", superAdmin: "superadmin" };

const Rform = () => {
  const navigate = useNavigate();
  const { t, isDark, toggleTheme, lang, setLang, LANGUAGES } = useThemeLang();
  
  const [isLoading, setIsLoading]         = useState(false);
  const [previewEmail, setPreviewEmail]   = useState("");
  // Popup state
  const [showPopup, setShowPopup]         = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [tempUserId, setTempUserId]       = useState("");
  const [mfaMethod, setMfaMethod]         = useState("");
  const [qrCode, setQrCode]               = useState("");
  const [mfaCode, setMfaCode]             = useState("");
  const [backupCodes, setBackupCodes]     = useState([]);
  const [mfaLoading, setMfaLoading]       = useState(false);
  const [copied, setCopied]               = useState(false);

  const formik = useFormik({
    initialValues: {
      firstName: "", lastName: "", role: "",
      personalEmail: "", password: "", confirmPassword: "",
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const { data } = await api.post("/auth/register", values);
        setGeneratedEmail(data.data.systemEmail);
        setMfaMethod(data.data.mfaMethod);
        setTempUserId(data.data.tempUserId);
        if (data.data.qrCode) setQrCode(data.data.qrCode);
        setShowPopup(true);
      } catch (err) {
        toast.error(err.response?.data?.message || t('auth.registration_failed') || "Registration failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Live email preview
  useEffect(() => {
    const { firstName, lastName, role } = formik.values;
    if (firstName && lastName && role && ROLE_SLUG[role]) {
      setPreviewEmail(`${cleanName(firstName)}.${cleanName(lastName)}.${ROLE_SLUG[role]}@netpair.com`);
    } else {
      setPreviewEmail("");
    }
  }, [formik.values.firstName, formik.values.lastName, formik.values.role]);

  const handleMfaVerify = async () => {
    if (!mfaCode.trim()) return toast.error(t('auth.enter_code') || "Enter the verification code");
    setMfaLoading(true);
    try {
      const { data } = await api.post("/auth/setup-mfa", { tempUserId, mfaCode });
      if (data.data?.backupCodes?.length) {
        setBackupCodes(data.data.backupCodes);
      } else {
        toast.success(t('auth.account_verified') || "Account verified! Please log in.");
        navigate("/");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.verification_failed') || "Verification failed");
    } finally {
      setMfaLoading(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = (name) =>
    `w-full h-11 border rounded-lg px-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm
    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
    placeholder-gray-400 dark:placeholder-gray-600 transition ${
      formik.errors[name] && formik.touched[name] ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-700"
    }`;

  const FieldError = ({ name }) =>
    formik.errors[name] && formik.touched[name] ? (
      <p className="text-red-500 dark:text-red-400 text-xs mt-1 flex items-center gap-1">
        <i className="ri-error-warning-line" />{formik.errors[name]}
      </p>
    ) : null;

  return (
    <div className="flex justify-center items-center w-full py-8 relative">
      {/* Top-right quick controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <select value={lang} onChange={(e) => setLang(e.target.value)}
          className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1
            bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none transition">
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.flag} {l.short}</option>
          ))}
        </select>
        <button onClick={toggleTheme}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700
            bg-white dark:bg-gray-900 flex items-center justify-center text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800">
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <form onSubmit={formik.handleSubmit}
        className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-8 w-full max-w-2xl space-y-4 border border-gray-200 dark:border-gray-800 transition">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('auth.create_account') || 'Create Account'}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('auth.fill_details') || 'Fill in your details to register'}</p>
        </div>

        {/* Name row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.first_name') || 'First Name'} *
            </label>
            <input id="reg-firstName" name="firstName" type="text" placeholder="Rahul"
              className={inputCls("firstName")}
              value={formik.values.firstName} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            <FieldError name="firstName" />
          </div>
          <div>
            <label htmlFor="reg-lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.last_name') || 'Last Name'} *
            </label>
            <input id="reg-lastName" name="lastName" type="text" placeholder="Shah"
              className={inputCls("lastName")}
              value={formik.values.lastName} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            <FieldError name="lastName" />
          </div>
        </div>

        {/* Role */}
        <div>
          <label htmlFor="reg-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.role') || 'Role'} *
          </label>
          <select id="reg-role" name="role"
            className={inputCls("role")}
            value={formik.values.role} onChange={formik.handleChange} onBlur={formik.handleBlur}>
            <option value="">{t('auth.select_role') || 'Select role'}</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <FieldError name="role" />
        </div>

        {/* Live email preview */}
        {previewEmail && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 flex flex-col gap-1 transition">
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t('auth.login_id_will_be') || 'Your login ID will be'}</span>
            <code className="text-sm text-blue-900 dark:text-blue-300 font-mono break-all">{previewEmail}</code>
          </div>
        )}

        {/* Personal email */}
        <div>
          <label htmlFor="reg-personalEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('auth.personal_email') || 'Personal Email'} *
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{t('auth.personal_email_desc') || 'Used for verification and notifications — not your login ID'}</p>
          <input id="reg-personalEmail" name="personalEmail" type="email" placeholder="you@gmail.com"
            className={inputCls("personalEmail")}
            value={formik.values.personalEmail} onChange={formik.handleChange} onBlur={formik.handleBlur} />
          <FieldError name="personalEmail" />
        </div>

        {/* Password row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.password') || 'Password'} *
            </label>
            <input id="reg-password" name="password" type="password" placeholder={t('auth.min_chars') || "Min 8 chars"}
              className={inputCls("password")}
              value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            <FieldError name="password" />
          </div>
          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('auth.confirm_password') || 'Confirm Password'} *
            </label>
            <input id="reg-confirm" name="confirmPassword" type="password" placeholder={t('auth.repeat_password') || "Repeat password"}
              className={inputCls("confirmPassword")}
              value={formik.values.confirmPassword} onChange={formik.handleChange} onBlur={formik.handleBlur} />
            <FieldError name="confirmPassword" />
          </div>
        </div>

        <button type="submit" disabled={isLoading}
          className="w-full bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-500 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {isLoading ? (
            <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>{t('auth.creating_account') || 'Creating Account...'}</>
          ) : (t('auth.create_account') || 'Create Account')}
        </button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.have_account') || 'Already have an account?'}{" "}
          <Link to="/" className="text-blue-700 dark:text-blue-400 font-bold hover:underline transition">
            {t('auth.sign_in_btn') || 'Sign In'}
          </Link>
        </p>
      </form>

      {/* ── MFA Setup Popup ─────────────────────────────────────────────────── */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800 transition">

            {backupCodes.length === 0 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{t('auth.login_id_ready') || 'Your NetPair login ID is ready'}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{t('auth.permanent_login') || 'This is your permanent login email. Save it — you cannot change it.'}</p>

                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 flex items-center justify-between gap-3 mb-5 transition">
                  <code className="text-sm text-blue-800 dark:text-blue-300 font-mono break-all">{generatedEmail}</code>
                  <button onClick={copyEmail}
                    className="shrink-0 text-xs bg-blue-700 dark:bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-500 transition">
                    {copied ? (t('common.copied') || 'Copied!') : (t('common.copy') || 'Copy')}
                  </button>
                </div>

                <hr className="mb-5 border-gray-200 dark:border-gray-700" />

                {mfaMethod === "otp" && (
                  <>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{t('auth.otp_sent_desc') || 'A 6-digit code has been sent to your personal email.'}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{t('auth.check_inbox') || 'Check your inbox — valid for 10 minutes.'}</p>
                    <input type="text" maxLength={6} inputMode="numeric" placeholder="000000"
                      value={mfaCode} onChange={(e) => setMfaCode(e.target.value)}
                      className="w-full h-14 border border-gray-300 dark:border-gray-700 rounded-lg text-center text-2xl tracking-[12px] font-mono outline-none focus:ring-2 focus:ring-blue-500 mb-4
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition" />
                    <button onClick={handleMfaVerify} disabled={mfaLoading}
                      className="w-full bg-blue-700 dark:bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-500 transition disabled:opacity-50">
                      {mfaLoading ? (t('auth.verifying') || 'Verifying...') : (t('auth.verify_account') || 'Verify Account')}
                    </button>
                  </>
                )}

                {mfaMethod === "totp" && (
                  <>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{t('auth.scan_qr') || 'Scan this QR code with Google Authenticator or Authy.'}</p>
                    {qrCode && <img src={qrCode} alt="TOTP QR Code" className="w-44 h-44 mx-auto mb-4 rounded-lg border border-gray-200 dark:border-gray-700" />}
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{t('auth.enter_totp') || 'Then enter the 6-digit code from the app:'}</p>
                    <input type="text" maxLength={6} inputMode="numeric" placeholder="000000"
                      value={mfaCode} onChange={(e) => setMfaCode(e.target.value)}
                      className="w-full h-14 border border-gray-300 dark:border-gray-700 rounded-lg text-center text-2xl tracking-[12px] font-mono outline-none focus:ring-2 focus:ring-blue-500 mb-4
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition" />
                    <button onClick={handleMfaVerify} disabled={mfaLoading}
                      className="w-full bg-blue-700 dark:bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-500 transition disabled:opacity-50">
                      {mfaLoading ? (t('auth.confirming') || 'Confirming...') : (t('auth.confirm_setup') || 'Confirm Setup')}
                    </button>
                  </>
                )}
              </>
            ) : (
              /* Backup codes screen */
              <>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{t('auth.save_backup_codes') || 'Save your backup codes'}</h2>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-4">{t('auth.backup_codes_warning') || 'These will not be shown again. Use one if you lose access to your authenticator app.'}</p>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {backupCodes.map((code, i) => (
                    <code key={i} className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 text-center text-sm font-mono tracking-widest text-gray-900 dark:text-gray-100">
                      {code}
                    </code>
                  ))}
                </div>
                <button onClick={() => { toast.success(t('auth.account_created') || "Account created! Please log in."); navigate("/"); }}
                  className="w-full bg-blue-700 dark:bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 dark:hover:bg-blue-500 transition">
                  {t('auth.saved_backup_codes') || 'I have saved my backup codes'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Rform;
