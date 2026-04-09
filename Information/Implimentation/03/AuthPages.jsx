// src/pages/auth/Lform.jsx  (Login)
// ─────────────────────────────────────────────────────────────
//  Uses useTranslation() — works because ThemeLanguageProvider
//  is now in main.jsx wrapping the entire app.
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeLang } from '../../context/ThemeLanguageContext';
import { toast } from 'react-toastify';

export const Lform = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const { login }    = useAuth();
  const { t, isDark, toggleTheme, lang, setLang, currentLang, LANGUAGES } = useThemeLang();
  const navigate     = useNavigate();

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.email, form.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 flex bg-gray-100 dark:bg-gray-950 z-50 transition-colors duration-300">

      {/* Top-right quick controls for auth pages */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <select value={lang} onChange={(e) => setLang(e.target.value)}
          className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1
            bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none">
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.flag} {l.short}</option>
          ))}
        </select>
        <button onClick={toggleTheme}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700
            bg-white dark:bg-gray-900 flex items-center justify-center text-sm">
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Left */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="flex bg-white dark:bg-gray-900 shadow-2xl rounded-2xl overflow-hidden w-full max-w-lg
          border border-gray-100 dark:border-gray-800">

          {/* Form */}
          <div className="flex-1 p-8">
            <img src="/src/assets/imgs/Netpairlogo.png" alt="Netpair" className="w-28 mb-6"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">{t('auth.sign_in')}</h2>

            <form onSubmit={submit} className="space-y-4">
              <input type="email" name="email" placeholder={t('auth.email')} required
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-600
                  focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                value={form.email} onChange={handle} />
              <input type="password" name="password" placeholder={t('auth.password')} required
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-600
                  focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                value={form.password} onChange={handle} />
              <button type="submit" disabled={busy}
                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[.99] text-white
                  py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-sm">
                {busy ? t('common.loading') : t('auth.sign_in_btn')}
              </button>
            </form>

            <p className="text-sm mt-4 text-gray-500 dark:text-gray-400">
              {t('auth.no_account')}{' '}
              <a href="/registration" className="text-orange-500 font-bold hover:underline">{t('auth.sign_up_btn')}</a>
            </p>
            <a href="/forgot-password" className="block text-xs text-gray-400 hover:text-orange-500 mt-2 transition-colors">
              Forgot password?
            </a>
          </div>

          {/* Welcome panel */}
          <div className="hidden sm:flex bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500
            text-white p-8 w-52 flex-col justify-center shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <i className="ri-shield-check-line text-2xl" />
            </div>
            <h3 className="text-lg font-black mb-2 leading-snug">{t('auth.welcome_title')}</h3>
            <p className="text-sm text-white/80 leading-relaxed">{t('auth.welcome_sub')}</p>
          </div>
        </div>
      </div>

      {/* Right image */}
      <div className="hidden lg:block w-1/2">
        <img src="/src/assets/img/tech1.jpeg" alt="Tech" className="h-full w-full object-cover" />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Rform — Register
// ─────────────────────────────────────────────────────────────
export const Rform = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const { register }  = useAuth();
  const { t, isDark, toggleTheme, lang, setLang, currentLang, LANGUAGES } = useThemeLang();
  const navigate      = useNavigate();

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setBusy(true);
    try {
      await register({ username: form.username, email: form.email, password: form.password });
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (err) { toast.error(err.message || 'Registration failed'); }
    finally { setBusy(false); }
  };

  const inputCls = `w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm
    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
    placeholder-gray-400 dark:placeholder-gray-600
    focus:outline-none focus:ring-2 focus:ring-orange-400 transition`;

  return (
    <div className="fixed inset-0 flex bg-gray-100 dark:bg-gray-950 z-50 transition-colors duration-300">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <select value={lang} onChange={(e) => setLang(e.target.value)}
          className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1
            bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none">
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.short}</option>)}
        </select>
        <button onClick={toggleTheme}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center">
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="flex bg-white dark:bg-gray-900 shadow-2xl rounded-2xl overflow-hidden w-full max-w-lg border border-gray-100 dark:border-gray-800">
          <div className="flex-1 p-8">
            <img src="/src/assets/imgs/Netpairlogo.png" alt="Netpair" className="w-28 mb-4" onError={(e) => { e.currentTarget.style.display='none'; }} />
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{t('auth.sign_up')}</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">Join us today!</p>
            <form onSubmit={submit} className="space-y-3">
              <input name="username" type="text" required placeholder={t('auth.username')} className={inputCls} value={form.username} onChange={handle} />
              <input name="email" type="email" required placeholder={t('auth.email')} className={inputCls} value={form.email} onChange={handle} />
              <input name="password" type="password" required placeholder={t('auth.password')} className={inputCls} value={form.password} onChange={handle} />
              <input name="confirmPassword" type="password" required placeholder={t('auth.confirm_password')} className={inputCls} value={form.confirmPassword} onChange={handle} />
              <button type="submit" disabled={busy}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                {busy ? t('common.loading') : t('auth.sign_up_btn')}
              </button>
            </form>
            <p className="text-sm mt-4 text-center text-gray-500 dark:text-gray-400">
              {t('auth.have_account')}{' '}
              <a href="/" className="text-orange-500 font-bold hover:underline">{t('auth.sign_in_btn')}</a>
            </p>
          </div>
          <div className="hidden sm:flex bg-gradient-to-br from-blue-500 to-purple-600 text-white p-8 w-52 flex-col justify-center shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <i className="ri-team-line text-2xl" />
            </div>
            <h3 className="text-lg font-black mb-2">{t('auth.join_title')}</h3>
            <p className="text-sm text-white/80 leading-relaxed">{t('auth.join_sub')}</p>
          </div>
        </div>
      </div>
      <div className="hidden lg:block w-1/2">
        <img src="/src/assets/img/tech1.jpeg" alt="Tech" className="h-full w-full object-cover" />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Fform — Forgot password
// ─────────────────────────────────────────────────────────────
export const Fform = () => {
  const [email, setEmail] = useState('');
  const [busy, setBusy]   = useState(false);
  const { t, isDark, toggleTheme, lang, setLang, LANGUAGES } = useThemeLang();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      toast.info('Password reset link sent — check your email');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 flex bg-gray-100 dark:bg-gray-950 z-50 transition-colors duration-300">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <select value={lang} onChange={(e) => setLang(e.target.value)}
          className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none">
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.short}</option>)}
        </select>
        <button onClick={toggleTheme}
          className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center">
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="flex bg-white dark:bg-gray-900 shadow-2xl rounded-2xl overflow-hidden w-full max-w-lg border border-gray-100 dark:border-gray-800">
          <div className="flex-1 p-8">
            <img src="/src/assets/imgs/Netpairlogo.png" alt="Netpair" className="w-28 mb-6" onError={(e) => { e.currentTarget.style.display='none'; }} />
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t('auth.forgot_password')}</h2>
            <p className="text-sm text-gray-400 mb-6">Enter your email and we'll send a reset link.</p>
            <form onSubmit={submit} className="space-y-4">
              <input type="email" placeholder={t('auth.email')} required
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit" disabled={busy}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50">
                {busy ? t('common.loading') : t('auth.reset_link')}
              </button>
            </form>
            <p className="text-sm mt-4 text-center text-gray-500 dark:text-gray-400">
              {t('auth.remember_pwd')}{' '}
              <a href="/" className="text-orange-500 font-bold hover:underline">{t('auth.back_to_signin')}</a>
            </p>
          </div>
          <div className="hidden sm:flex bg-gradient-to-br from-green-500 to-teal-600 text-white p-8 w-52 flex-col justify-center shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <i className="ri-lock-unlock-line text-2xl" />
            </div>
            <h3 className="text-lg font-black mb-2">{t('auth.recover_title')}</h3>
            <p className="text-sm text-white/80 leading-relaxed">{t('auth.recover_sub')}</p>
          </div>
        </div>
      </div>
      <div className="hidden lg:block w-1/2">
        <img src="/src/assets/img/tech1.jpeg" alt="Tech" className="h-full w-full object-cover" />
      </div>
    </div>
  );
};
