const fs = require('fs');
const path = require('path');

const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');

if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
}

// 10 premium study-themed male face avatars in SVG format
const maleAvatars = {
    'avatar_male1.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="m_grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3B82F6" />
            <stop offset="100%" stop-color="#1D4ED8" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#m_grad1)" />
    <circle cx="50" cy="48" r="22" fill="#FFE4E6" />
    <path d="M28 44 C28 24, 72 24, 72 44 C66 40, 34 40, 28 44 Z" fill="#1E293B" />
    <circle cx="42" cy="48" r="7" fill="none" stroke="#1E293B" stroke-width="2.5" />
    <circle cx="58" cy="48" r="7" fill="none" stroke="#1E293B" stroke-width="2.5" />
    <line x1="49" y1="48" x2="51" y2="48" stroke="#1E293B" stroke-width="2.5" />
    <path d="M46 59 Q50 63 54 59" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />
    <rect x="25" y="42" width="16" height="4" transform="rotate(-30 25 42)" fill="#F59E0B" rx="1" />
    <polygon points="39,34 43,36 39,38" fill="#EF4444" transform="rotate(-30 25 42)" />
    <path d="M35 70 C35 70, 38 88, 50 88 C62 88, 65 70, 65 70 Z" fill="#FFFFFF" />
    <path d="M50 78 L43 70 H57 Z" fill="#3B82F6" />
</svg>
    `,
    'avatar_male2.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="m_grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FF512F" />
            <stop offset="100%" stop-color="#DD2476" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#m_grad2)" />
    <circle cx="50" cy="52" r="20" fill="#FDE047" />
    <circle cx="50" cy="54" r="18" fill="#FFEDD5" />
    <path d="M32 54 C32 40, 68 40, 68 54 Z" fill="#78350F" />
    <rect x="36" y="50" width="10" height="6" rx="2" fill="none" stroke="#78350F" stroke-width="2" />
    <rect x="54" y="50" width="10" height="6" rx="2" fill="none" stroke="#78350F" stroke-width="2" />
    <line x1="46" y1="53" x2="54" y2="53" stroke="#78350F" stroke-width="2" />
    <circle cx="41" cy="53" r="1" fill="#78350F" />
    <circle cx="59" cy="53" r="1" fill="#78350F" />
    <path d="M47 62 Q50 65 53 62" fill="none" stroke="#78350F" stroke-width="2" stroke-linecap="round" />
    <polygon points="50,30 74,38 50,46 26,38" fill="#1E293B" />
    <rect x="47" y="38" width="6" height="8" fill="#1E293B" />
    <path d="M70 39 L74 46 L74 52" fill="none" stroke="#F59E0B" stroke-width="1.5" />
    <circle cx="74" cy="53" r="2" fill="#F59E0B" />
</svg>
    `,
    'avatar_male3.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="m_grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10B981" />
            <stop offset="100%" stop-color="#047857" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#m_grad3)" />
    <circle cx="50" cy="48" r="21" fill="#FFF1F2" />
    <path d="M29 44 C25 35, 75 35, 71 44 C65 40, 35 40, 29 44 Z" fill="#475569" />
    <circle cx="35" cy="38" r="6" fill="#475569" />
    <circle cx="50" cy="34" r="7" fill="#475569" />
    <circle cx="65" cy="38" r="6" fill="#475569" />
    <circle cx="41" cy="48" r="8" fill="none" stroke="#047857" stroke-width="2.5" />
    <circle cx="59" cy="48" r="8" fill="none" stroke="#047857" stroke-width="2.5" />
    <line x1="49" y1="48" x2="51" y2="48" stroke="#047857" stroke-width="2.5" />
    <path d="M46 58 Q50 63 54 58" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />
    <g transform="translate(72, 14) scale(0.18)">
        <path d="M50 0 A30 30 0 0 0 20 30 C20 48 35 55 35 70 H65 C65 55 80 48 80 30 A30 30 0 0 0 50 0 Z" fill="#FBBF24" />
        <rect x="40" y="73" width="20" height="8" rx="2" fill="#94A3B8" />
        <rect x="43" y="83" width="14" height="5" rx="1" fill="#64748B" />
    </g>
    <path d="M35 70 L50 86 L65 70 Z" fill="#FFFFFF" />
</svg>
    `,
    'avatar_male4.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="m_grad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8B5CF6" />
            <stop offset="100%" stop-color="#6D28D9" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#m_grad4)" />
    <circle cx="50" cy="48" r="22" fill="#FAF5FF" />
    <path d="M28 45 C28 25, 72 25, 72 45 C65 42, 35 42, 28 45 Z" fill="#1E1B4B" />
    <path d="M25 46 A25 25 0 0 1 75 46" fill="none" stroke="#F472B6" stroke-width="5" />
    <rect x="22" y="40" width="8" height="18" rx="4" fill="#F472B6" />
    <rect x="70" y="40" width="8" height="18" rx="4" fill="#F472B6" />
    <path d="M38 48 Q41 51 44 48" fill="none" stroke="#1E1B4B" stroke-width="2.5" stroke-linecap="round" />
    <path d="M56 48 Q59 51 62 48" fill="none" stroke="#1E1B4B" stroke-width="2.5" stroke-linecap="round" />
    <path d="M45 58 Q50 63 55 58" fill="none" stroke="#1E1B4B" stroke-width="2" stroke-linecap="round" />
    <path d="M32 70 C32 70, 30 90, 50 90 C70 90, 68 70, 68 70 Z" fill="#F472B6" />
    <circle cx="50" cy="78" r="4" fill="#FFFFFF" />
</svg>
    `,
    'avatar_male5.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="m_grad5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#F59E0B" />
            <stop offset="100%" stop-color="#D97706" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#m_grad5)" />
    <circle cx="50" cy="50" r="21" fill="#FFEBE9" />
    <path d="M29 48 C29 32, 71 32, 71 48 C68 44, 32 44, 29 48 Z" fill="#78350F" />
    <path d="M29 44 L32 52 L36 45 Z" fill="#78350F" />
    <path d="M71 44 L68 52 L64 45 Z" fill="#78350F" />
    <rect x="35" y="43" width="12" height="8" rx="3" fill="none" stroke="#1E293B" stroke-width="2" />
    <rect x="53" y="43" width="12" height="8" rx="3" fill="none" stroke="#1E293B" stroke-width="2" />
    <line x1="47" y1="47" x2="53" y2="47" stroke="#1E293B" stroke-width="2" />
    <path d="M46 58 Q50 61 54 58" fill="none" stroke="#78350F" stroke-width="2" stroke-linecap="round" />
    <path d="M34 32 L50 22 L66 32 L50 36 Z" fill="#1E293B" />
    <rect x="49" y="32" width="2" height="8" fill="#FBBF24" />
    <g transform="translate(12, 64) scale(0.2)">
        <rect x="0" y="0" width="30" height="40" rx="3" fill="#3B82F6" />
        <rect x="5" y="5" width="20" height="30" fill="#FFFFFF" />
        <line x1="8" y1="12" x2="22" y2="12" stroke="#94A3B8" stroke-width="2" />
        <line x1="8" y1="20" x2="22" y2="20" stroke="#94A3B8" stroke-width="2" />
        <line x1="8" y1="28" x2="16" y2="28" stroke="#94A3B8" stroke-width="2" />
    </g>
    <path d="M35 71 L50 88 L65 71 Z" fill="#FFFFFF" />
</svg>
    `,
    'avatar_male6.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="m_grad6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3B82F6" />
            <stop offset="100%" stop-color="#8B5CF6" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#m_grad6)" />
    <circle cx="50" cy="48" r="22" fill="#FFE4E6" />
    <path d="M28 44 C28 26, 72 26, 72 44 C66 40, 34 40, 28 44 Z" fill="#0F172A" />
    <circle cx="41" cy="48" r="7" fill="none" stroke="#1E293B" stroke-width="2" />
    <circle cx="59" cy="48" r="7" fill="none" stroke="#1E293B" stroke-width="2" />
    <line x1="48" y1="48" x2="52" y2="48" stroke="#1E293B" stroke-width="2" />
    <circle cx="41" cy="48" r="1.5" fill="#0F172A" />
    <circle cx="59" cy="48" r="1.5" fill="#0F172A" />
    <path d="M46 59 Q50 62 54 59" fill="none" stroke="#0F172A" stroke-width="2" stroke-linecap="round" />
    <path d="M35 70 C35 70, 38 88, 50 88 C62 88, 65 70, 65 70 Z" fill="#FFFFFF" />
    <polygon points="48,74 52,74 53,88 47,88" fill="#3B82F6" />
</svg>
    `,
    'avatar_male7.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="m_grad7" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#06B6D4" />
            <stop offset="100%" stop-color="#0891B2" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#m_grad7)" />
    <circle cx="50" cy="48" r="22" fill="#F0FDFA" />
    <path d="M28 44 C28 24, 72 24, 72 44 C66 40, 34 40, 28 44 Z" fill="#0F172A" />
    <rect x="34" y="43" width="13" height="9" rx="2" fill="rgba(14, 165, 233, 0.1)" stroke="#0EA5E9" stroke-width="2" />
    <rect x="53" y="43" width="13" height="9" rx="2" fill="rgba(14, 165, 233, 0.1)" stroke="#0EA5E9" stroke-width="2" />
    <line x1="47" y1="47.5" x2="53" y2="47.5" stroke="#0EA5E9" stroke-width="2" />
    <circle cx="41" cy="48" r="1.5" fill="#0F172A" />
    <circle cx="59" cy="48" r="1.5" fill="#0F172A" />
    <path d="M46 58 Q50 61 54 58" fill="none" stroke="#0F172A" stroke-width="2" stroke-linecap="round" />
    <g transform="translate(68, 12) scale(0.2)">
        <polygon points="0,15 20,5 40,15 40,35 20,45 0,35" fill="none" stroke="#0EA5E9" stroke-width="3" />
        <line x1="10" y1="20" x2="30" y2="20" stroke="#0EA5E9" stroke-width="2" />
        <line x1="10" y1="27" x2="30" y2="27" stroke="#0EA5E9" stroke-width="2" />
    </g>
    <path d="M32 70 C32 70, 30 90, 50 90 C70 90, 68 70, 68 70 Z" fill="#0EA5E9" />
</svg>
    `,
    'avatar_male8.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="m_grad8" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10B981" />
            <stop offset="100%" stop-color="#059669" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#m_grad8)" />
    <circle cx="50" cy="48" r="22" fill="#FAFDFB" />
    <path d="M28 44 C28 24, 72 24, 72 44 Z" fill="#78350F" />
    <circle cx="41" cy="48" r="7.5" fill="none" stroke="#059669" stroke-width="2" />
    <circle cx="59" cy="48" r="7.5" fill="none" stroke="#059669" stroke-width="2" />
    <line x1="48.5" y1="48" x2="51.5" y2="48" stroke="#059669" stroke-width="2" />
    <path d="M47 58 Q50 61 53 58" fill="none" stroke="#78350F" stroke-width="2" stroke-linecap="round" />
    <path d="M30 70 Q38 82 34 90" fill="none" stroke="#059669" stroke-width="4.5" stroke-linecap="round" />
    <path d="M70 70 Q62 82 66 90" fill="none" stroke="#059669" stroke-width="4.5" stroke-linecap="round" />
    <path d="M35 70 L50 86 L65 70 Z" fill="#FFFFFF" />
</svg>
    `,
    'avatar_male9.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="m_grad9" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#EF4444" />
            <stop offset="100%" stop-color="#991B1B" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#m_grad9)" />
    <circle cx="50" cy="48" r="22" fill="#FFF1EE" />
    <path d="M28 44 C28 20, 72 20, 72 44 Z" fill="#1E293B" />
    <circle cx="41" cy="48" r="7" fill="none" stroke="#EF4444" stroke-width="2" />
    <circle cx="59" cy="48" r="7" fill="none" stroke="#EF4444" stroke-width="2" />
    <line x1="48" y1="48" x2="52" y2="48" stroke="#EF4444" stroke-width="2" />
    <path d="M46 59 Q50 62 54 59" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />
    <path d="M32 70 C32 70, 30 90, 50 90 C70 90, 68 70, 68 70 Z" fill="#EF4444" />
</svg>
    `,
    'avatar_male10.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="m_grad10" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4F46E5" />
            <stop offset="100%" stop-color="#312E81" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#m_grad10)" />
    <circle cx="50" cy="48" r="22" fill="#FAF5FF" />
    <path d="M28 44 C28 22, 72 22, 72 44 C65 40, 35 40, 28 44 Z" fill="#312E81" />
    <circle cx="41" cy="48" r="7" fill="none" stroke="#8B5CF6" stroke-width="2" />
    <circle cx="57" cy="48" r="7" fill="none" stroke="#8B5CF6" stroke-width="2" />
    <line x1="48" y1="48" x2="50" y2="48" stroke="#8B5CF6" stroke-width="2" />
    <path d="M45 58 Q50 62 55 58" fill="none" stroke="#312E81" stroke-width="2" stroke-linecap="round" />
    <g transform="translate(10, 18) scale(0.18)">
        <rect x="10" y="20" width="24" height="24" rx="4" fill="#FFFFFF" />
        <path d="M34 26 C38 26, 38 34, 34 34" fill="none" stroke="#FFFFFF" stroke-width="3" />
        <path d="M14 12 Q22 8 30 12" fill="none" stroke="#FBBF24" stroke-width="2" />
    </g>
    <path d="M32 70 C32 70, 30 90, 50 90 C70 90, 68 70, 68 70 Z" fill="#8B5CF6" />
</svg>
    `
};

// 10 premium study-themed female face avatars in SVG format
const femaleAvatars = {
    'avatar_female1.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="f_grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#EC4899" />
            <stop offset="100%" stop-color="#DB2777" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#f_grad1)" />
    <circle cx="50" cy="48" r="22" fill="#FFF1F2" />
    <path d="M28 44 C28 22, 72 22, 72 44 C67 38, 33 38, 28 44 Z" fill="#4C1D95" />
    <path d="M28 44 C25 50, 24 60, 26 65 C28 62, 30 55, 30 48 Z" fill="#4C1D95" />
    <path d="M72 44 C75 50, 76 60, 74 65 C72 62, 70 55, 70 48 Z" fill="#4C1D95" />
    <circle cx="41" cy="48" r="7" fill="none" stroke="#FBBF24" stroke-width="2" />
    <circle cx="57" cy="48" r="7" fill="none" stroke="#FBBF24" stroke-width="2" />
    <line x1="48" y1="48" x2="50" y2="48" stroke="#FBBF24" stroke-width="2" />
    <path d="M46 58 Q50 62 54 58" fill="none" stroke="#4C1D95" stroke-width="2" stroke-linecap="round" />
    <rect x="25" y="42" width="16" height="4" transform="rotate(-30 25 42)" fill="#F59E0B" rx="1" />
    <polygon points="39,34 43,36 39,38" fill="#EF4444" transform="rotate(-30 25 42)" />
    <path d="M34 70 L50 88 L66 70 Z" fill="#FFFFFF" />
</svg>
    `,
    'avatar_female2.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="f_grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FF758C" />
            <stop offset="100%" stop-color="#FF7EB3" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#f_grad2)" />
    <circle cx="70" cy="34" r="8" fill="#78350F" />
    <circle cx="50" cy="52" r="20" fill="#FDE047" />
    <circle cx="50" cy="54" r="18" fill="#FFEDD5" />
    <path d="M32 54 C32 40, 68 40, 68 54 Z" fill="#78350F" />
    <rect x="36" y="50" width="10" height="6" rx="2" fill="none" stroke="#78350F" stroke-width="2" />
    <rect x="54" y="50" width="10" height="6" rx="2" fill="none" stroke="#78350F" stroke-width="2" />
    <line x1="46" y1="53" x2="54" y2="53" stroke="#78350F" stroke-width="2" />
    <circle cx="41" cy="53" r="1" fill="#78350F" />
    <circle cx="59" cy="53" r="1" fill="#78350F" />
    <path d="M47 62 Q50 65 53 62" fill="none" stroke="#78350F" stroke-width="2" stroke-linecap="round" />
    <polygon points="50,30 74,38 50,46 26,38" fill="#1E293B" />
    <rect x="47" y="38" width="6" height="8" fill="#1E293B" />
</svg>
    `,
    'avatar_female3.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="f_grad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#059669" />
            <stop offset="100%" stop-color="#10B981" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#f_grad3)" />
    <circle cx="30" cy="36" r="7" fill="#475569" />
    <circle cx="70" cy="36" r="7" fill="#475569" />
    <circle cx="50" cy="48" r="21" fill="#FFF1F2" />
    <path d="M29 44 C25 35, 75 35, 71 44 C65 40, 35 40, 29 44 Z" fill="#475569" />
    <circle cx="41" cy="48" r="8" fill="none" stroke="#047857" stroke-width="2.5" />
    <circle cx="59" cy="48" r="8" fill="none" stroke="#047857" stroke-width="2.5" />
    <line x1="49" y1="48" x2="51" y2="48" stroke="#047857" stroke-width="2.5" />
    <path d="M46 58 Q50 63 54 58" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />
    <g transform="translate(72, 14) scale(0.18)">
        <path d="M50 0 A30 30 0 0 0 20 30 C20 48 35 55 35 70 H65 C65 55 80 48 80 30 A30 30 0 0 0 50 0 Z" fill="#FBBF24" />
        <rect x="40" y="73" width="20" height="8" rx="2" fill="#94A3B8" />
        <rect x="43" y="83" width="14" height="5" rx="1" fill="#64748B" />
    </g>
    <path d="M35 70 L50 86 L65 70 Z" fill="#FFFFFF" />
</svg>
    `,
    'avatar_female4.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="f_grad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#C084FC" />
            <stop offset="100%" stop-color="#8B5CF6" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#f_grad4)" />
    <circle cx="50" cy="48" r="22" fill="#FAF5FF" />
    <path d="M28 44 C28 22, 72 22, 72 44 C65 40, 35 40, 28 44 Z" fill="#1E1B4B" />
    <path d="M25 44 C22 50, 21 62, 23 68 C25 65, 27 58, 27 50 Z" fill="#1E1B4B" />
    <path d="M72 44 C75 50, 76 62, 74 68 C72 65, 70 58, 70 50 Z" fill="#1E1B4B" />
    <path d="M25 46 A25 25 0 0 1 75 46" fill="none" stroke="#F472B6" stroke-width="5" />
    <rect x="22" y="40" width="8" height="18" rx="4" fill="#F472B6" />
    <rect x="70" y="40" width="8" height="18" rx="4" fill="#F472B6" />
    <path d="M38 48 Q41 51 44 48" fill="none" stroke="#1E1B4B" stroke-width="2.5" stroke-linecap="round" />
    <path d="M56 48 Q59 51 62 48" fill="none" stroke="#1E1B4B" stroke-width="2.5" stroke-linecap="round" />
    <path d="M45 58 Q50 63 55 58" fill="none" stroke="#1E1B4B" stroke-width="2" stroke-linecap="round" />
    <path d="M32 70 C32 70, 30 90, 50 90 C70 90, 68 70, 68 70 Z" fill="#F472B6" />
</svg>
    `,
    'avatar_female5.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="f_grad5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FBBF24" />
            <stop offset="100%" stop-color="#F59E0B" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#f_grad5)" />
    <circle cx="50" cy="50" r="21" fill="#FFEBE9" />
    <path d="M29 48 C29 32, 71 32, 71 48 C68 44, 32 44, 29 48 Z" fill="#78350F" />
    <path d="M29 48 C27 54, 26 62, 28 66 C29 63, 30 58, 30 52 Z" fill="#78350F" />
    <path d="M71 48 C73 54, 74 62, 72 66 C71 63, 70 58, 70 52 Z" fill="#78350F" />
    <g transform="translate(64, 28) scale(0.11)">
        <polygon points="0,0 20,-10 40,0 40,25 20,15 0,25" fill="#EF4444" />
    </g>
    <rect x="35" y="45" width="12" height="8" rx="3" fill="none" stroke="#1E293B" stroke-width="2" />
    <rect x="53" y="45" width="12" height="8" rx="3" fill="none" stroke="#1E293B" stroke-width="2" />
    <line x1="47" y1="49" x2="53" y2="49" stroke="#1E293B" stroke-width="2" />
    <path d="M46 58 Q50 61 54 58" fill="none" stroke="#78350F" stroke-width="2" stroke-linecap="round" />
    <g transform="translate(12, 64) scale(0.2)">
        <rect x="0" y="0" width="30" height="40" rx="3" fill="#3B82F6" />
        <rect x="5" y="5" width="20" height="30" fill="#FFFFFF" />
        <line x1="8" y1="12" x2="22" y2="12" stroke="#94A3B8" stroke-width="2" />
        <line x1="8" y1="20" x2="22" y2="20" stroke="#94A3B8" stroke-width="2" />
    </g>
    <path d="M35 71 L50 88 L65 71 Z" fill="#FFFFFF" />
</svg>
    `,
    'avatar_female6.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="f_grad6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#F472B6" />
            <stop offset="100%" stop-color="#E879F9" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#f_grad6)" />
    <circle cx="70" cy="30" r="8" fill="#312E81" />
    <path d="M28 44 C28 22, 72 22, 72 44 C65 40, 35 40, 28 44 Z" fill="#312E81" />
    <circle cx="41" cy="48" r="7" fill="none" stroke="#8B5CF6" stroke-width="2" />
    <circle cx="57" cy="48" r="7" fill="none" stroke="#8B5CF6" stroke-width="2" />
    <line x1="48" y1="48" x2="50" y2="48" stroke="#8B5CF6" stroke-width="2" />
    <path d="M45 58 Q50 62 55 58" fill="none" stroke="#312E81" stroke-width="2" stroke-linecap="round" />
    <path d="M34 70 L50 88 L66 70 Z" fill="#FFFFFF" />
</svg>
    `,
    'avatar_female7.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="f_grad7" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#22D3EE" />
            <stop offset="100%" stop-color="#06B6D4" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#f_grad7)" />
    <circle cx="50" cy="48" r="22" fill="#F0FDFA" />
    <path d="M28 44 C28 24, 72 24, 72 44 C66 40, 34 40, 28 44 Z" fill="#0F172A" />
    <circle cx="68" cy="38" r="3" fill="#EF4444" />
    <rect x="35" y="44" width="12" height="8" rx="2" fill="none" stroke="#0891B2" stroke-width="2.5" />
    <rect x="53" y="44" width="12" height="8" rx="2" fill="none" stroke="#0891B2" stroke-width="2.5" />
    <line x1="47" y1="48" x2="53" y2="48" stroke="#0891B2" stroke-width="2.5" />
    <circle cx="41" cy="48" r="1.5" fill="#0F172A" />
    <circle cx="59" cy="48" r="1.5" fill="#0F172A" />
    <path d="M46 58 Q50 61 54 58" fill="none" stroke="#0F172A" stroke-width="2" stroke-linecap="round" />
    <path d="M35 70 L50 86 L65 70 Z" fill="#FFFFFF" />
    <polygon points="48,74 52,74 53,88 47,88" fill="#0891B2" />
</svg>
    `,
    'avatar_female8.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="f_grad8" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34D399" />
            <stop offset="100%" stop-color="#10B981" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#f_grad8)" />
    <path d="M24 60 C22 66, 24 74, 28 78 C29 74, 28 66, 27 60 Z" fill="#78350F" />
    <path d="M76 60 C78 66, 76 74, 72 78 C71 74, 72 66, 73 60 Z" fill="#78350F" />
    <circle cx="50" cy="48" r="22" fill="#FAFDFB" />
    <path d="M28 44 C28 24, 72 24, 72 44 Z" fill="#78350F" />
    <circle cx="41" cy="48" r="7.5" fill="none" stroke="#059669" stroke-width="2" />
    <circle cx="59" cy="48" r="7.5" fill="none" stroke="#059669" stroke-width="2" />
    <line x1="48.5" y1="48" x2="51.5" y2="48" stroke="#059669" stroke-width="2" />
    <path d="M47 58 Q50 61 53 58" fill="none" stroke="#78350F" stroke-width="2" stroke-linecap="round" />
    <path d="M30 70 Q38 82 34 90" fill="none" stroke="#059669" stroke-width="4.5" stroke-linecap="round" />
    <path d="M70 70 Q62 82 66 90" fill="none" stroke="#059669" stroke-width="4.5" stroke-linecap="round" />
    <path d="M35 70 L50 86 L65 70 Z" fill="#FFFFFF" />
</svg>
    `,
    'avatar_female9.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="f_grad9" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#F43F5E" />
            <stop offset="100%" stop-color="#BE123C" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#f_grad9)" />
    <circle cx="50" cy="48" r="22" fill="#FFF1EE" />
    <path d="M28 44 C28 20, 72 20, 72 44 Z" fill="#1E293B" />
    <path d="M25 40 Q50 34 75 40" fill="none" stroke="#FBBF24" stroke-width="3" />
    <circle cx="41" cy="48" r="7" fill="none" stroke="#EF4444" stroke-width="2" />
    <circle cx="59" cy="48" r="7" fill="none" stroke="#EF4444" stroke-width="2" />
    <line x1="48" y1="48" x2="52" y2="48" stroke="#EF4444" stroke-width="2" />
    <path d="M46 59 Q50 62 54 59" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />
    <path d="M32 70 C32 70, 30 90, 50 90 C70 90, 68 70, 68 70 Z" fill="#EF4444" />
</svg>
    `,
    'avatar_female10.svg': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
        <linearGradient id="f_grad10" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#EC4899" />
            <stop offset="100%" stop-color="#8B5CF6" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#f_grad10)" />
    <circle cx="50" cy="48" r="22" fill="#FAF5FF" />
    <path d="M28 44 C28 22, 72 22, 72 44 C65 40, 35 40, 28 44 Z" fill="#312E81" />
    <path d="M26 42 C24 48, 22 60, 24 66 C25 63, 26 56, 27 48 Z" fill="#312E81" />
    <path d="M74 42 C76 48, 78 60, 76 66 C75 63, 74 56, 73 48 Z" fill="#312E81" />
    <path d="M80 15 L82 20 L87 21 L83 25 L84 30 L80 27 L76 30 L77 25 L73 21 L78 20 Z" fill="#FBBF24" />
    <circle cx="41" cy="48" r="7" fill="none" stroke="#8B5CF6" stroke-width="2" />
    <circle cx="57" cy="48" r="7" fill="none" stroke="#8B5CF6" stroke-width="2" />
    <line x1="48" y1="48" x2="50" y2="48" stroke="#8B5CF6" stroke-width="2" />
    <path d="M45 58 Q50 62 55 58" fill="none" stroke="#312E81" stroke-width="2" stroke-linecap="round" />
    <g transform="translate(10, 18) scale(0.18)">
        <rect x="10" y="20" width="24" height="24" rx="4" fill="#FFFFFF" />
        <path d="M34 26 C38 26, 38 34, 34 34" fill="none" stroke="#FFFFFF" stroke-width="3" />
        <path d="M14 12 Q22 8 30 12" fill="none" stroke="#FBBF24" stroke-width="2" />
    </g>
    <path d="M32 70 C32 70, 30 90, 50 90 C70 90, 68 70, 68 70 Z" fill="#8B5CF6" />
</svg>
    `
};

// Generate Male Avatars
for (const [filename, content] of Object.entries(maleAvatars)) {
    const filePath = path.join(avatarsDir, filename);
    fs.writeFileSync(filePath, content.trim());
    console.log(`Generated Male Avatar: ${filePath}`);
}

// Generate Female Avatars
for (const [filename, content] of Object.entries(femaleAvatars)) {
    const filePath = path.join(avatarsDir, filename);
    fs.writeFileSync(filePath, content.trim());
    console.log(`Generated Female Avatar: ${filePath}`);
}

// Generate backwards-compatible versions (avatar1.svg to avatar10.svg)
// Map them to male / female alternately so we get a neat mixed legacy set
for (let i = 1; i <= 10; i++) {
    const filename = `avatar${i}.svg`;
    const sourceMap = i % 2 === 0 ? femaleAvatars[`avatar_female${i}.svg`] : maleAvatars[`avatar_male${i}.svg`];
    const filePath = path.join(avatarsDir, filename);
    fs.writeFileSync(filePath, sourceMap.trim());
    console.log(`Generated Legacy Fallback Avatar: ${filePath}`);
}

console.log('✅ Generated all 30 premium avatars successfully!');
