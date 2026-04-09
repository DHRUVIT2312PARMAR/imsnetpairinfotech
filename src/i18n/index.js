// src/i18n/index.js
// ─────────────────────────────────────────────────────────────
//  COMPLETE SYSTEM-WIDE i18n
// ─────────────────────────────────────────────────────────────

// ── Supported languages ───────────────────────────────────────
export const LANGUAGES = [
  { code: 'en', label: 'English',   nativeLabel: 'English',    flag: '🇬🇧', short: 'EN', rtl: false },
  { code: 'hi', label: 'Hindi',     nativeLabel: 'हिंदी',       flag: '🇮🇳', short: 'HI', rtl: false },
  { code: 'gu', label: 'Gujarati',  nativeLabel: 'ગુજરાતી',     flag: '🇮🇳', short: 'GU', rtl: false },
  { code: 'mr', label: 'Marathi',   nativeLabel: 'मराठी',       flag: '🇮🇳', short: 'MR', rtl: false },
  { code: 'ta', label: 'Tamil',     nativeLabel: 'தமிழ்',       flag: '🇮🇳', short: 'TA', rtl: false },
  { code: 'fr', label: 'French',    nativeLabel: 'Français',   flag: '🇫🇷', short: 'FR', rtl: false },
  { code: 'de', label: 'German',    nativeLabel: 'Deutsch',    flag: '🇩🇪', short: 'DE', rtl: false },
  { code: 'ar', label: 'Arabic',    nativeLabel: 'العربية',    flag: '🇸🇦', short: 'AR', rtl: true  },
];

// ── Master translation map ────────────────────────────────────
const translations = {
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.loading': 'Loading…',
    'common.no_data': 'No data found',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.view_all': 'View All',
    'common.close': 'Close',
    'common.submit': 'Submit',
    'common.approve': 'Approve',
    'common.reject': 'Reject',
    'common.pending': 'Pending',
    'common.approved': 'Approved',
    'common.rejected': 'Rejected',
    
    // Time
    'time.just_now': 'Just now',
    'time.min_ago': 'm ago',
    'time.hr_ago': 'h ago',
    'time.day_ago': 'd ago',
    
    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.attendance': 'Attendance',
    'nav.leave': 'Leave',
    'nav.helpdesk': 'Helpdesk',
    'nav.announcements': 'Announcements',
    'nav.settings': 'Settings',
    'nav.policies': 'Policies',
    'nav.tasks_timesheet': 'Tasks & Timesheet',
    'nav.employees': 'Employees',
    'nav.hr_management': 'HR Management',
    'nav.wfh_records': 'WFH Records',
    'nav.payroll': 'Payroll',
    'nav.projects': 'Projects',
    'nav.assets': 'Assets',
    'nav.reports': 'Reports',
    'nav.inventory': 'Inventory',
    'nav.role_management': 'Role Management',
    'nav.audit_logs': 'Audit Logs',
    'nav.system_config': 'System Config',
    
    // Navbar
    'navbar.welcome': 'Welcome',
    'navbar.today_is': 'Today is',
    'navbar.notifications': 'Notifications',
    'navbar.mark_all_read': 'Mark all read',
    'navbar.no_notifications': 'No notifications yet',
    'navbar.view_all': 'View all notifications',
    'navbar.my_profile': 'My Profile',
    'navbar.settings': 'Settings',
    'navbar.change_password': 'Change Password',
    'navbar.logout': 'Logout',
    'navbar.dark_mode': 'Dark mode',
    'navbar.light_mode': 'Light mode',
    'navbar.language': 'Language',
    
    // Auth
    'auth.sign_in': 'Sign in to your account',
    'auth.sign_up': 'Create your account',
    'auth.forgot_password': 'Reset your password',
    'auth.email': 'Email address',
    'auth.password': 'Password',
    'auth.confirm_password': 'Confirm Password',
    'auth.username': 'Username',
    'auth.sign_in_btn': 'Sign in',
    'auth.sign_up_btn': 'Sign up',
    'auth.no_account': "Don't have an account?",
    'auth.have_account': 'Already have an account?',
    'auth.reset_link': 'Send reset link',
    'auth.back_to_signin': 'Back to sign in',
    'auth.remember_pwd': 'Remember your password?',
    'auth.welcome_title': 'Welcome to Netpair Infotech',
    'auth.welcome_sub': 'Connecting your future with advanced HR management solutions.',
    'auth.join_title': 'Join Our Team',
    'auth.join_sub': 'Start your journey with our comprehensive HR management platform.',
    'auth.recover_title': 'Secure Recovery',
    'auth.recover_sub': "We'll help you get back into your account safely.",
  },
  
  hi: {
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'हटाएं',
    'common.loading': 'लोड हो रहा है…',
    'common.approve': 'स्वीकृत',
    'common.reject': 'अस्वीकृत',
    'time.just_now': 'अभी',
    'time.min_ago': 'मि. पहले',
    'time.hr_ago': 'घं. पहले',
    'time.day_ago': 'दि. पहले',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.attendance': 'उपस्थिति',
    'nav.leave': 'छुट्टी',
    'navbar.welcome': 'स्वागत है',
    'navbar.today_is': 'आज है',
    'navbar.notifications': 'सूचनाएं',
    'navbar.mark_all_read': 'सभी पढ़े',
    'navbar.logout': 'लॉगआउट',
    'auth.sign_in': 'अपने खाते में साइन इन करें',
    'auth.email': 'ईमेल पता',
    'auth.password': 'पासवर्ड',
    'auth.sign_in_btn': 'साइन इन',
  },
  
  gu: {
    'common.save': 'સાચવો',
    'common.loading': 'લોડ થઈ રહ્યું છે…',
    'time.just_now': 'હમણાં',
    'nav.dashboard': 'ડેશબોર્ડ',
    'navbar.welcome': 'સ્વાગત છે',
    'navbar.logout': 'લૉગઆઉટ',
    'auth.sign_in': 'તમારા એકાઉન્ટમાં સાઇન ઇન કરો',
  },
};

// ── Fallback chain: requested lang → en ──────────────────────
const translate = (lang, key) =>
  translations[lang]?.[key] ?? translations.en[key] ?? key;

export const timeAgo = (dateStr, lang = 'en') => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return translate(lang, 'time.just_now');
  if (diff < 3600)  return `${Math.floor(diff / 60)} ${translate(lang, 'time.min_ago')}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${translate(lang, 'time.hr_ago')}`;
  return `${Math.floor(diff / 86400)} ${translate(lang, 'time.day_ago')}`;
};

export { translate as t };
export default translate;
