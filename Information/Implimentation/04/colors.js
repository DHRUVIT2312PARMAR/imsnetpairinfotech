// src/config/colors.js
// ─────────────────────────────────────────────────────────────
//  SINGLE SOURCE OF TRUTH for all color constants used in
//  React components. Import from here — never hardcode colors
//  in individual components.
//
//  Usage:
//    import { ROLE_PILL, STAT_CARD, STATUS_BADGE } from '../config/colors';
// ─────────────────────────────────────────────────────────────

// ── Role badge Tailwind classes ───────────────────────────────
export const ROLE_PILL = {
  super_admin:
    'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] ' +
    'dark:bg-[rgba(185,28,28,0.15)] dark:text-[#FCA5A5] dark:border-[rgba(239,68,68,0.3)]',
  admin:
    'bg-[#FFF2EB] text-[#C2410C] border border-[#FDD9BF] ' +
    'dark:bg-[rgba(251,146,60,0.15)] dark:text-[#FB923C] dark:border-[rgba(251,146,60,0.3)]',
  hr:
    'bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] ' +
    'dark:bg-[rgba(139,92,246,0.15)] dark:text-[#A78BFA] dark:border-[rgba(167,139,250,0.3)]',
  employee:
    'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] ' +
    'dark:bg-[rgba(59,130,246,0.15)] dark:text-[#93C5FD] dark:border-[rgba(96,165,250,0.3)]',
};

export const ROLE_LABEL = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  hr:          'HR',
  employee:    'Employee',
};

// ── Status badge classes ──────────────────────────────────────
export const STATUS_BADGE = {
  pending:
    'bg-[#FFFBEB] text-[#92400E] border border-[#FCD34D] ' +
    'dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D] dark:border-[rgba(251,191,36,0.25)]',
  approved:
    'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7] ' +
    'dark:bg-[rgba(16,185,129,0.12)] dark:text-[#6EE7B7] dark:border-[rgba(52,211,153,0.25)]',
  rejected:
    'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] ' +
    'dark:bg-[rgba(239,68,68,0.12)] dark:text-[#FCA5A5] dark:border-[rgba(248,113,113,0.25)]',
  active:
    'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7] ' +
    'dark:bg-[rgba(16,185,129,0.12)] dark:text-[#6EE7B7] dark:border-[rgba(52,211,153,0.25)]',
  inactive:
    'bg-[#F3F4F6] text-[#6B7280] border border-[#D1D5DB] ' +
    'dark:bg-[rgba(107,114,128,0.15)] dark:text-[#9CA3AF] dark:border-[rgba(156,163,175,0.25)]',
  open:
    'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] ' +
    'dark:bg-[rgba(59,130,246,0.12)] dark:text-[#93C5FD] dark:border-[rgba(96,165,250,0.25)]',
  closed:
    'bg-[#F3F4F6] text-[#6B7280] border border-[#D1D5DB] ' +
    'dark:bg-[rgba(107,114,128,0.15)] dark:text-[#9CA3AF] dark:border-[rgba(156,163,175,0.25)]',
};

// ── System health badge classes ───────────────────────────────
export const HEALTH_BADGE = {
  healthy:     'text-[#059669] dark:text-[#34D399]',
  operational: 'text-[#059669] dark:text-[#34D399]',
  active:      'text-[#2563EB] dark:text-[#60A5FA]',
  degraded:    'text-[#D97706] dark:text-[#FBBF24]',
  down:        'text-[#DC2626] dark:text-[#F87171]',
};

// ── Attendance stat cards (solid colored bg) ──────────────────
// These use inline CSS vars so they flip with dark mode
export const STAT_CARD = {
  total:   { bg: 'bg-[#3B82F6] dark:bg-[#1D4ED8]', label: 'Total Employees',   icon: 'ri-team-line' },
  present: { bg: 'bg-[#10B981] dark:bg-[#059669]', label: 'Present Today',     icon: 'ri-user-follow-line' },
  absent:  { bg: 'bg-[#EF4444] dark:bg-[#DC2626]', label: 'Absent Today',      icon: 'ri-user-unfollow-line' },
  late:    { bg: 'bg-[#F59E0B] dark:bg-[#D97706]', label: 'Late Today',        icon: 'ri-time-line' },
  wfh:     { bg: 'bg-[#8B5CF6] dark:bg-[#7C3AED]', label: 'WFH Today',         icon: 'ri-home-office-line' },
};

// ── Dashboard stat cards (icon bg + number) ───────────────────
export const DASH_CARD = {
  policy:   { iconBg: 'bg-[#FFF2EB] dark:bg-[rgba(242,107,46,0.15)]', iconColor: 'text-[#F26B2E] dark:text-[#FB923C]' },
  system:   { iconBg: 'bg-[#F5F3FF] dark:bg-[rgba(139,92,246,0.12)]', iconColor: 'text-[#7C3AED] dark:text-[#A78BFA]' },
  critical: { iconBg: 'bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.12)]',  iconColor: 'text-[#DC2626] dark:text-[#F87171]' },
};

// ── Priority badges (helpdesk) ────────────────────────────────
export const PRIORITY_BADGE = {
  high:
    'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] ' +
    'dark:bg-[rgba(239,68,68,0.12)] dark:text-[#FCA5A5] dark:border-[rgba(248,113,113,0.25)]',
  medium:
    'bg-[#FFFBEB] text-[#92400E] border border-[#FCD34D] ' +
    'dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D] dark:border-[rgba(251,191,36,0.25)]',
  low:
    'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7] ' +
    'dark:bg-[rgba(16,185,129,0.12)] dark:text-[#6EE7B7] dark:border-[rgba(52,211,153,0.25)]',
};

// ── Announcement role badge colors ────────────────────────────
export const ROLE_COLORS = {
  super_admin: { bg: 'bg-[#FEF2F2] dark:bg-[rgba(185,28,28,0.15)]', text: 'text-[#B91C1C] dark:text-[#FCA5A5]', dot: 'bg-[#EF4444]' },
  admin:       { bg: 'bg-[#FFF2EB] dark:bg-[rgba(251,146,60,0.15)]', text: 'text-[#C2410C] dark:text-[#FB923C]', dot: 'bg-[#F26B2E]' },
  hr:          { bg: 'bg-[#F5F3FF] dark:bg-[rgba(139,92,246,0.15)]', text: 'text-[#6D28D9] dark:text-[#A78BFA]', dot: 'bg-[#8B5CF6]' },
  employee:    { bg: 'bg-[#EFF6FF] dark:bg-[rgba(59,130,246,0.15)]',  text: 'text-[#1D4ED8] dark:text-[#93C5FD]', dot: 'bg-[#3B82F6]' },
};

// ── Leave type colors ─────────────────────────────────────────
export const LEAVE_TYPE = {
  casual:    'bg-[#EFF6FF] text-[#1D4ED8] dark:bg-[rgba(59,130,246,0.12)] dark:text-[#93C5FD]',
  sick:      'bg-[#FEF2F2] text-[#B91C1C] dark:bg-[rgba(239,68,68,0.12)] dark:text-[#FCA5A5]',
  earned:    'bg-[#ECFDF5] text-[#065F46] dark:bg-[rgba(16,185,129,0.12)] dark:text-[#6EE7B7]',
  maternity: 'bg-[#FDF4FF] text-[#7E22CE] dark:bg-[rgba(168,85,247,0.12)] dark:text-[#D8B4FE]',
  unpaid:    'bg-[#F3F4F6] text-[#374151] dark:bg-[rgba(107,114,128,0.12)] dark:text-[#9CA3AF]',
};

// ── Payroll / category tags ───────────────────────────────────
export const CATEGORY_TAG = {
  policy:  'bg-[#FFFBEB] text-[#92400E]  dark:bg-[rgba(245,158,11,0.12)] dark:text-[#FCD34D]',
  payroll: 'bg-[#ECFDF5] text-[#065F46]  dark:bg-[rgba(16,185,129,0.12)] dark:text-[#6EE7B7]',
  system:  'bg-[#EFF6FF] text-[#1D4ED8]  dark:bg-[rgba(59,130,246,0.12)] dark:text-[#93C5FD]',
  hr:      'bg-[#F5F3FF] text-[#6D28D9]  dark:bg-[rgba(139,92,246,0.12)] dark:text-[#A78BFA]',
  event:   'bg-[#FFF7ED] text-[#9A3412]  dark:bg-[rgba(234,88,12,0.12)]  dark:text-[#FB923C]',
  general: 'bg-[#F0F9FF] text-[#075985]  dark:bg-[rgba(14,165,233,0.12)] dark:text-[#7DD3FC]',
};
