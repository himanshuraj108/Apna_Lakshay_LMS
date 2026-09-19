/**
 * Apna Lakshay LMS - Super Admin & Admin Shared Design System Tokens
 * Unified high-production warm palette matching Student & Public portals.
 */

// Canvas & Backgrounds
export const THEME = {
    bgPage: '#FAF6F0',
    bgPageAlt: '#F7F3EC',
    bgCard: '#FFFFFF',
    bgSurfaceMuted: '#FBF8F5',
    bgSurfaceHighlight: '#FFF7ED',
    
    // Borders
    borderCard: '#EDE8E0',
    borderInput: '#E2DBD2',
    borderDivider: '#F1EBE3',
    borderActive: '#FDBA74',
    
    // Text
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#9B7B5A',
    textSubtle: '#94A3B8',
    
    // Accents
    accentOrange: '#F97316',
    accentOrangeDark: '#EA580C',
    accentAmber: '#F59E0B',
    accentEmerald: '#10B981',
    accentRose: '#F43F5E',
    accentIndigo: '#6366F1',
    
    // Sidebar (Executive Dark Warm Espresso)
    sidebarBg: '#141210',
    sidebarSurface: '#1C1916',
    sidebarBorder: '#292420',
    sidebarText: '#D6D3D1',
    sidebarActiveBg: 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(234,88,12,0.12) 100%)',
    sidebarActiveText: '#FDBA74',
    sidebarActiveBorder: '#F97316',
};

// Reusable Class Strings
export const INPUT_CLASS = 'w-full bg-white border border-[#E2DBD2] rounded-xl px-3.5 py-2.5 text-[#0F172A] text-sm focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15 outline-none transition-all placeholder-slate-400 shadow-2xs';

export const LABEL_CLASS = 'block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5';

export const BTN_PRIMARY = 'px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white shadow-sm shadow-orange-500/25 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer';

export const BTN_SECONDARY = 'px-4 py-2.5 rounded-xl text-xs font-bold text-[#334155] bg-white hover:bg-[#FBF8F5] border border-[#EDE8E0] shadow-2xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer';

export const BTN_DANGER = 'px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-sm shadow-rose-500/20 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer';

export const WARM_CARD_CLASS = 'bg-white border border-[#EDE8E0] rounded-2xl shadow-xs transition-all duration-200 hover:border-[#E2B08A] hover:shadow-md';

// Background Helper Component for Sub-pages
export const AdminPageBg = () => (
    <>
        <div className="fixed inset-0 -z-10" style={{ background: THEME.bgPage }} />
        <div
            className="fixed inset-0 -z-10 pointer-events-none"
            style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(180,120,60,0.07) 1px, transparent 0)',
                backgroundSize: '28px 28px'
            }}
        />
    </>
);
