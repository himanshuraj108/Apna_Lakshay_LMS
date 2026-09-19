import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    IoMail, IoLockClosed, IoArrowForward,
    IoEye, IoEyeOff, IoCheckmarkCircle,
    IoGridOutline, IoLocationOutline,
    IoInformationCircleOutline, IoClose,
    IoSparkles,
} from 'react-icons/io5';
import useMobileViewport from '../hooks/useMobileViewport';
import AttendanceFloatingBtn from '../components/ui/AttendanceFloatingBtn';
import api from '../utils/api';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/dm-sans/800.css';

/* ─── Stat definitions: num=numeric target, suffix=display suffix, label ─── */
const STATS_CONFIG = [
    { num: 100, suffix: '+', label: 'Students' },
    { num: 95,  suffix: '%', label: 'Satisfaction' },
    { num: 24,  suffix: '/7', label: 'Access' },
];

/* ─── Smooth count-up hook (0 → target, easeOut, duration ms) ─── */
function useCountUp(target, duration = 1800, start = false) {
    const [count, setCount] = useState(0);
    const raf = useRef(null);
    useEffect(() => {
        if (!start || !target) return;
        setCount(0);
        const startTime = performance.now();
        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOut cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [target, duration, start]);
    return count;
}

/* ─── Single animated stat cell ─── */
function StatCell({ num, suffix, label, delay = 0 }) {
    const [started, setStarted] = useState(false);
    const displayed = useCountUp(num, 1800, started);
    useEffect(() => {
        const t = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(t);
    }, [delay]);
    return (
        <div>
            <p style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                {displayed}{suffix}
            </p>
            <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, margin: '2px 0 0' }}>{label}</p>
        </div>
    );
}

/* ─── Animated visitor/views counter ─── */
function ViewsCell({ count }) {
    const [started, setStarted] = useState(false);
    const displayed = useCountUp(count, 2200, started);
    useEffect(() => {
        const t = setTimeout(() => setStarted(true), 200);
        return () => clearTimeout(t);
    }, []);
    return (
        <div>
            <p style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                {displayed.toLocaleString('en-IN')}
            </p>
            <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, margin: '2px 0 0' }}>Total Views</p>
        </div>
    );
}

/* ─── Compact badge count-up (for the visitor pill) ─── */
function ViewsBadge({ count }) {
    const [started, setStarted] = useState(false);
    const displayed = useCountUp(count, 1600, started);
    useEffect(() => {
        const t = setTimeout(() => setStarted(true), 300);
        return () => clearTimeout(t);
    }, []);
    return <strong style={{ color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{displayed.toLocaleString('en-IN')}</strong>;
}

const FEATURES = [
    'Smart seat booking with real-time availability',
    'QR + GPS verified daily attendance tracking',
    'AI mock tests & doubt solving for competitive exams',
    'Live discussion rooms & study collaboration',
];

/* ─── Instructions content ─── */
const INSTRUCTIONS = {
    en: {
        title: 'How to Login',
        subtitle: 'Follow these steps to access your account',
        steps: [
            {
                num: '1',
                heading: 'Get Your Credentials from Admin',
                body: 'Visit the library and ask the admin/staff to register you. They will create your account and provide you with your login Email/Mobile Number and Password.',
            },
            {
                num: '2',
                heading: 'Enter Your Email or Mobile',
                body: 'In the "Email or Mobile Number" field, enter the email address or 10-digit mobile number provided by the admin.',
            },
            {
                num: '3',
                heading: 'Enter Your Password',
                body: 'Enter the password given by the admin. By default, it is usually your registered mobile number. You can change it later from your profile.',
            },
            {
                num: '4',
                heading: 'Click Login',
                body: 'Press the orange "Login" button. You will be redirected to your personalized student dashboard.',
            },
            {
                num: '?',
                heading: 'Forgot Password?',
                body: 'Click "Forgot password?" below the password field and follow the steps to reset it via your registered email.',
            },
        ],
        contactLabel: 'Still having trouble? Contact the library admin.',
        contactBtn: 'Contact Admin',
        langBtn: 'हिंदी में देखें',
    },
    hi: {
        title: 'लॉगिन कैसे करें',
        subtitle: 'अपने अकाउंट में प्रवेश करने के लिए इन चरणों का पालन करें',
        steps: [
            {
                num: '1',
                heading: 'एडमिन से क्रेडेंशियल प्राप्त करें',
                body: 'लाइब्रेरी जाएं और एडमिन/स्टाफ से अपना रजिस्ट्रेशन कराएं। वे आपका अकाउंट बनाएंगे और आपको ईमेल/मोबाइल नंबर और पासवर्ड देंगे।',
            },
            {
                num: '2',
                heading: 'ईमेल या मोबाइल नंबर दर्ज करें',
                body: '"Email or Mobile Number" वाले बॉक्स में एडमिन द्वारा दिया गया ईमेल पता या 10 अंकों का मोबाइल नंबर भरें।',
            },
            {
                num: '3',
                heading: 'पासवर्ड दर्ज करें',
                body: 'एडमिन द्वारा दिया गया पासवर्ड भरें। डिफ़ॉल्ट रूप से यह आमतौर पर आपका पंजीकृत मोबाइल नंबर होता है। बाद में प्रोफ़ाइल से बदला जा सकता है।',
            },
            {
                num: '4',
                heading: 'Login बटन दबाएं',
                body: 'नारंगी "Login" बटन दबाएं। आप अपने स्टूडेंट डैशबोर्ड पर पहुंच जाएंगे।',
            },
            {
                num: '?',
                heading: 'पासवर्ड भूल गए?',
                body: '"Forgot password?" लिंक पर क्लिक करें और अपने पंजीकृत ईमेल से पासवर्ड रीसेट करें।',
            },
        ],
        contactLabel: 'फिर भी समस्या हो? लाइब्रेरी एडमिन से संपर्क करें।',
        contactBtn: 'एडमिन से संपर्क करें',
        langBtn: 'View in English',
    },
};

const FONT = "'DM Sans','Inter','Segoe UI',sans-serif";

/* ─── tiny reusable label+input wrapper ─── */
const Field = ({ label, id, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label htmlFor={id}
            style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: FONT }}>
            {label}
        </label>
        {children}
    </div>
);

/* ─── Instruction Modal ─── */
function InstructionModal({ onClose }) {
    const [lang, setLang] = useState('en');
    const content = INSTRUCTIONS[lang];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 16,
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: 24 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: '#fff',
                        borderRadius: 22,
                        width: '100%',
                        maxWidth: 440,
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 24px 64px rgba(249,115,22,0.18), 0 4px 16px rgba(0,0,0,0.10)',
                        position: 'relative',
                        fontFamily: FONT,
                        border: '1.5px solid #FED7AA',
                    }}
                >
                    <div style={{ height: 4, background: 'linear-gradient(90deg,#F97316,#FB923C,#FDBA74)', borderRadius: '22px 22px 0 0' }} />

                    <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)', border: '1.5px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <IoInformationCircleOutline size={20} style={{ color: '#F97316' }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.2, fontFamily: FONT }}>{content.title}</h3>
                                <p style={{ fontSize: 12, color: '#6B7280', margin: '3px 0 0', lineHeight: 1.4, fontFamily: FONT }}>{content.subtitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 9, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C', flexShrink: 0, transition: 'background 0.15s', fontFamily: FONT }}
                            onMouseOver={e => e.currentTarget.style.background = '#FFEDD5'}
                            onMouseOut={e => e.currentTarget.style.background = '#FFF7ED'}
                        >
                            <IoClose size={16} />
                        </button>
                    </div>

                    <div style={{ padding: '12px 24px 0' }}>
                        <button
                            onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
                            style={{
                                fontSize: 12, fontWeight: 700, color: '#EA580C',
                                background: '#FFF7ED', border: '1px solid #FED7AA',
                                borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                                transition: 'all 0.15s', fontFamily: FONT,
                            }}
                        >
                            {content.langBtn}
                        </button>
                    </div>

                    <div style={{ padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {content.steps.map((step, i) => (
                            <motion.div
                                key={`${lang}-${i}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                    display: 'flex', gap: 14, alignItems: 'flex-start',
                                    background: '#FFFBF7',
                                    border: '1.5px solid #EDE8E0',
                                    borderRadius: 14, padding: '12px 14px',
                                }}
                            >
                                <div style={{
                                    minWidth: 28, height: 28, borderRadius: 8,
                                    background: i === content.steps.length - 1
                                        ? 'linear-gradient(135deg,#EF4444,#DC2626)'
                                        : 'linear-gradient(135deg,#F97316,#EA580C)',
                                    color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 800, flexShrink: 0,
                                    boxShadow: i === content.steps.length - 1 ? '0 2px 8px rgba(239,68,68,0.3)' : '0 2px 8px rgba(249,115,22,0.3)',
                                    fontFamily: FONT,
                                }}>
                                    {step.num}
                                </div>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E3A5F', margin: '0 0 3px', lineHeight: 1.3, fontFamily: FONT }}>{step.heading}</p>
                                    <p style={{ fontSize: 12.5, color: '#4B5563', margin: 0, lineHeight: 1.6, fontFamily: FONT }}>{step.body}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div style={{ margin: '0 24px 22px', padding: '12px 14px', background: '#FFFBF7', border: '1.5px solid #EDE8E0', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <p style={{ fontSize: 12, color: '#92400E', margin: 0, fontWeight: 600, lineHeight: 1.5, fontFamily: FONT }}>
                            {content.contactLabel}
                        </p>
                        <Link
                            to="/contact"
                            onClick={onClose}
                            style={{
                                flexShrink: 0, fontSize: 12, fontWeight: 700,
                                color: '#fff', background: 'linear-gradient(135deg,#F97316,#EA580C)',
                                border: 'none', borderRadius: 9,
                                padding: '7px 14px', textDecoration: 'none',
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                boxShadow: '0 2px 8px rgba(249,115,22,0.3)',
                                whiteSpace: 'nowrap', fontFamily: FONT,
                            }}
                        >
                            {content.contactBtn}
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default function Login() {
    useMobileViewport();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(true);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);
    const [visitorCount, setVisitorCount] = useState(null);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // ── Strictly 0% scroll lock on viewport ──
    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        const prevHtmlOverflow = document.documentElement.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
            document.documentElement.style.overflow = prevHtmlOverflow;
        };
    }, []);

    useEffect(() => {
        if (location.state?.email && location.state?.password) {
            setEmail(location.state.email);
            setPassword(location.state.password);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const alreadyCounted = sessionStorage.getItem('visitor_counted');
                let count;
                if (!alreadyCounted) {
                    const res = await api.get('/public/visitor-count');
                    count = res.data.count;
                    sessionStorage.setItem('visitor_counted', 'true');
                    sessionStorage.setItem('visitor_count_value', String(count));
                } else {
                    count = parseInt(sessionStorage.getItem('visitor_count_value') || '0', 10) || null;
                }
                if (count) setVisitorCount(count);
            } catch { /* silent */ }
        };
        fetchCount();
    }, []);

    const handleEmailChange = (e) => {
        let val = e.target.value;
        if (/^[\d\s]+$/.test(val)) {
            val = val.replace(/\D/g, '');
            if (val.length > 10) val = val.slice(0, 10);
        }
        setEmail(val);
    };

    const progress = (() => {
        let eProg = 0;
        if (email.length > 0) {
            if (/^\d+$/.test(email)) {
                eProg = Math.min((email.length / 10) * 100, 100);
            } else {
                eProg = Math.min((email.length / 12) * 100, 100);
                if (email.toLowerCase().includes('gmail.') || email.toLowerCase().includes('@')) {
                    eProg = 100;
                }
            }
        }
        let pProg = Math.min((password.length / 6) * 100, 100);
        return Math.min(100, Math.max(0, 100 - eProg + pProg));
    })();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);
        if (result.success) {
            const user = JSON.parse(localStorage.getItem('user'));
            navigate(user.role === 'admin' ? '/admin' : user.role === 'subadmin' ? '/sub-admin' : '/student');
        } else {
            setError(result.message);
            setShake(true);
            setTimeout(() => setShake(false), 450);
        }
        setLoading(false);
    };

    const inputStyle = (name) => ({
        width: '100%',
        padding: name === 'password' ? '12px 46px 12px 42px' : '12px 16px 12px 42px',
        border: focused === name ? '1.5px solid #F97316' : '1.5px solid #EDE8E0',
        borderRadius: 12,
        fontSize: 14,
        color: '#111827',
        background: focused === name ? '#FFFBF7' : '#fff',
        outline: 'none',
        boxShadow: focused === name ? '0 0 0 3px rgba(249,115,22,0.10)' : '0 1px 3px rgba(0,0,0,0.03)',
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
        fontFamily: FONT,
        boxSizing: 'border-box',
    });

    return (
        <div
            style={{
                height: '100dvh',
                minHeight: '100vh',
                maxHeight: '100dvh',
                display: 'flex',
                fontFamily: FONT,
                background: '#FFFBF7',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <style>{`
                html, body { overflow: hidden !important; height: 100% !important; margin: 0 !important; }
                * { font-family: 'DM Sans','Inter','Segoe UI',sans-serif !important; }
                @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
                @keyframes orb1{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(40px,-60px) scale(1.1);}66%{transform:translate(-30px,20px) scale(0.9);}}
                @keyframes orb2{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(-40px,30px) scale(1.08);}66%{transform:translate(20px,-30px) scale(0.92);}}
                @keyframes orb3{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(25px,40px) scale(1.05);}}
                @keyframes spin{to{transform:rotate(360deg)}}
                .do-shake{animation:shake 0.45s ease;}
                input:-webkit-autofill{-webkit-box-shadow:0 0 0 50px #FFFBF7 inset !important;-webkit-text-fill-color:#111827 !important;}
                .login-blob{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
                .login-blob-1{width:500px;height:500px;top:-120px;left:-140px;background:radial-gradient(circle,rgba(249,115,22,0.08) 0%,transparent 70%);animation:orb1 22s ease-in-out infinite;}
                .login-blob-2{width:420px;height:420px;top:15%;right:-80px;background:radial-gradient(circle,rgba(251,146,60,0.06) 0%,transparent 70%);animation:orb2 28s ease-in-out infinite;}
                .login-blob-3{width:360px;height:360px;bottom:10%;left:5%;background:radial-gradient(circle,rgba(253,186,116,0.07) 0%,transparent 70%);animation:orb3 32s ease-in-out infinite;}
                .warm-input-wrap { position: relative; }
            `}</style>

            {/* ── Ambient Blobs ── */}
            <div className="login-blob login-blob-1" />
            <div className="login-blob login-blob-2" />
            <div className="login-blob login-blob-3" />

            {/* ══════════════════════════════════════════
                LEFT PANEL — brand / features (desktop)
               ══════════════════════════════════════════ */}
            <div
                className="hidden lg:flex flex-col justify-between"
                style={{
                    width: '48%',
                    height: '100%',
                    background: 'linear-gradient(160deg,#FFF7ED 0%,#FFFBF7 60%,#FFF7ED 100%)',
                    borderRight: '1.5px solid #EDE8E0',
                    position: 'relative',
                    overflow: 'hidden',
                    zIndex: 1,
                }}
            >
                {/* Top orange stripe */}
                <div style={{ height: 4, background: 'linear-gradient(90deg,#F97316,#FB923C,#FDBA74)' }} />

                {/* Top nav */}
                <div style={{ padding: 'clamp(16px, 2.5vh, 26px) clamp(28px, 3.5vw, 44px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <img
                            src="/app-icon-192.png"
                            alt="Apna Lakshay"
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 11,
                                objectFit: 'cover',
                                boxShadow: '0 4px 14px rgba(249,115,22,0.28)',
                                flexShrink: 0,
                            }}
                        />
                        <div>
                            <p style={{ fontWeight: 900, fontSize: 17, color: '#111827', lineHeight: 1, margin: 0 }}>Apna Lakshay</p>
                            <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.15em', color: '#F97316', textTransform: 'uppercase', marginTop: 3, margin: 0 }}>Library System</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Link
                            to="/public-seats"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: '#EA580C', background: '#FFF7ED', border: '1.5px solid #FED7AA', padding: '6px 12px', borderRadius: 9, textDecoration: 'none', transition: 'all 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.background = '#FFEDD5'}
                            onMouseOut={e => e.currentTarget.style.background = '#FFF7ED'}
                        >
                            <IoGridOutline size={13} /> Seats
                        </Link>
                        <Link
                            to="/contact"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#6B7280', background: '#fff', border: '1.5px solid #EDE8E0', padding: '6px 12px', borderRadius: 9, textDecoration: 'none', transition: 'all 0.2s' }}
                            onMouseOver={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
                            onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#EDE8E0'; }}
                        >
                            <IoLocationOutline size={13} /> Location
                        </Link>
                    </div>
                </div>

                {/* Main brand content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 clamp(28px, 4vw, 52px)' }}>
                    {/* Pill badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px',
                            background: 'rgba(249,115,22,0.09)', border: '1.5px solid rgba(249,115,22,0.22)',
                            borderRadius: 100, marginBottom: 'clamp(14px, 2.2vh, 22px)', width: 'fit-content'
                        }}
                    >
                        <IoSparkles size={13} style={{ color: '#F97316' }} />
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#EA6B00', letterSpacing: '0.04em' }}>Trusted by 100+ students</span>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} className="animate-pulse" />
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{
                            fontSize: 'clamp(2rem, 2.7vw, 2.6rem)',
                            fontWeight: 900,
                            color: '#111827',
                            lineHeight: 1.15,
                            margin: '0 0 clamp(10px, 1.8vh, 16px)',
                        }}
                    >
                        Your Study Space,<br />
                        <span style={{ color: '#F97316' }}>All in One Place.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        style={{
                            fontSize: '14.5px',
                            color: '#6B7280',
                            lineHeight: 1.65,
                            maxWidth: 420,
                            margin: '0 0 clamp(16px, 2.5vh, 26px)',
                        }}
                    >
                        A complete library management platform built for serious students — seat booking, attendance, fees, and AI-powered exam preparation.
                    </motion.p>

                    {/* Stats — animated count-up */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 'clamp(24px, 3vw, 36px)',
                            paddingBottom: 'clamp(14px, 2vh, 22px)',
                            marginBottom: 'clamp(14px, 2vh, 22px)',
                            borderBottom: '1.5px solid #EDE8E0',
                            flexWrap: 'wrap',
                        }}
                    >
                        {STATS_CONFIG.map((s, i) => (
                            <StatCell key={i} num={s.num} suffix={s.suffix} label={s.label} delay={i * 120} />
                        ))}
                        {visitorCount && <ViewsCell count={visitorCount} />}
                    </div>

                    {/* Features */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(9px, 1.4vh, 13px)' }}>
                        {FEATURES.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <IoCheckmarkCircle size={13} style={{ color: '#F97316' }} />
                                </div>
                                <p style={{ fontSize: '13.5px', color: '#4B5563', lineHeight: 1.45, margin: 0 }}>{f}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom footer */}
                <div style={{ padding: 'clamp(12px, 1.8vh, 18px) clamp(28px, 4vw, 52px)', borderTop: '1.5px solid #EDE8E0' }}>
                    <p style={{ fontSize: 11.5, color: '#9CA3AF', margin: 0 }}>© 2026 Apna Lakshay · Built for serious students</p>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                RIGHT PANEL — login form (Spacious, bold, 0% scroll)
               ══════════════════════════════════════════ */}
            <div
                style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'clamp(18px, 3vh, 32px) 24px',
                    position: 'relative',
                    zIndex: 1,
                    overflow: 'hidden',
                }}
            >
                {/* Visitor Counter */}
                {/* Visitor counter pill — animated count-up */}
                {visitorCount !== null && (
                    <div style={{ position: 'absolute', top: 14, left: 18, zIndex: 10 }}>
                        <span
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: '#fff', border: '1.5px solid #EDE8E0',
                                borderRadius: 20, padding: '5px 14px',
                                fontSize: 11.5, color: '#6B7280',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                            }}
                        >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'spin 2s linear infinite', boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
                            <ViewsBadge count={visitorCount} /> <span style={{ color: '#9CA3AF' }}>visitors</span>
                        </span>
                    </div>
                )}

                {/* Top interactive progress bar */}
                <motion.div
                    animate={{ width: `${progress}%`, opacity: progress > 0 ? 1 : 0 }}
                    transition={{ type: 'spring', bounce: 0.2, stiffness: 120 }}
                    style={{ position: 'absolute', top: 0, left: '50%', x: '-50%', height: 4.5, background: 'linear-gradient(90deg,#F97316,#EF4444)', borderBottomLeftRadius: 6, borderBottomRightRadius: 6, zIndex: 30 }}
                />

                {/* Bottom interactive progress bar */}
                <motion.div
                    animate={{ width: `${progress}%`, opacity: progress > 0 ? 1 : 0 }}
                    transition={{ type: 'spring', bounce: 0.2, stiffness: 120 }}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        x: '-50%',
                        height: 5,
                        background: 'linear-gradient(270deg,#EF4444,#F97316)',
                        borderTopLeftRadius: 6,
                        borderTopRightRadius: 6,
                        zIndex: 45,
                    }}
                />

                {/* Mobile brand header */}
                <div className="lg:hidden" style={{ width: '100%', maxWidth: 430, marginBottom: 'clamp(12px, 2vh, 20px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <img
                                src="/app-icon-192.png"
                                alt="Apna Lakshay"
                                style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    objectFit: 'cover',
                                    boxShadow: '0 3px 10px rgba(249,115,22,0.28)',
                                    flexShrink: 0,
                                }}
                            />
                            <div>
                                <p style={{ fontWeight: 900, fontSize: 15, color: '#111827', lineHeight: 1, margin: 0 }}>Apna Lakshay</p>
                                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#F97316', textTransform: 'uppercase', marginTop: 2, margin: 0 }}>Library System</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <Link to="/public-seats" style={{ fontSize: 12, fontWeight: 700, color: '#EA580C', background: '#FFF7ED', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: '1.5px solid #FED7AA', borderRadius: 9 }}>
                                <IoGridOutline size={12} /> Seats
                            </Link>
                            <Link to="/contact" style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: '1.5px solid #EDE8E0', borderRadius: 9, background: '#fff' }}>
                                <IoLocationOutline size={12} /> Map
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Form Card (Bold, Spacious, 440px) ── */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className={shake ? 'do-shake' : ''}
                    style={{
                        width: '100%',
                        maxWidth: 430,
                        background: '#fff',
                        border: '1.5px solid #EDE8E0',
                        borderRadius: 22,
                        padding: 'clamp(26px, 3.5vh, 34px) clamp(24px, 3vw, 32px)',
                        boxShadow: '0 8px 30px rgba(249,115,22,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                        position: 'relative',
                        boxSizing: 'border-box',
                    }}
                >
                    {/* Top orange card stripe */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#F97316,#FB923C,#FDBA74)', borderRadius: '22px 22px 0 0' }} />

                    {/* Form header */}
                    <div style={{ marginBottom: 'clamp(18px, 2.5vh, 24px)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div>
                                <h2 style={{ fontSize: 'clamp(22px, 2.8vh, 25px)', fontWeight: 900, color: '#111827', margin: '0 0 4px', lineHeight: 1.2 }}>
                                    Welcome back 👋
                                </h2>
                                <p style={{ fontSize: 13.5, color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                                    Login to access your library dashboard
                                </p>
                            </div>
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => setShowInstructions(true)}
                                title="How to login?"
                                style={{
                                    background: '#FFF7ED',
                                    border: '1.5px solid #FED7AA',
                                    borderRadius: '50%',
                                    width: 36,
                                    height: 36,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    boxShadow: '0 2px 8px rgba(249,115,22,0.15)',
                                    transition: 'all 0.18s ease',
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = '#FFEDD5'; e.currentTarget.style.borderColor = '#F97316'; }}
                                onMouseOut={e => { e.currentTarget.style.background = '#FFF7ED'; e.currentTarget.style.borderColor = '#FED7AA'; }}
                            >
                                <IoInformationCircleOutline size={20} style={{ color: '#F97316' }} />
                            </motion.button>
                        </div>
                    </div>

                    {/* Error message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                                    background: '#FEF2F2', border: '1.5px solid #FECACA',
                                    borderRadius: 11, fontSize: 12.5, color: '#B91C1C', marginBottom: 16
                                }}
                            >
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2vh, 18px)' }}>
                        {/* Email / Mobile */}
                        <Field label="Email or Mobile Number" id="email">
                            <div className="warm-input-wrap">
                                <IoMail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused === 'email' ? '#F97316' : '#9CA3AF', transition: 'color 0.15s', pointerEvents: 'none' }} />
                                <input
                                    id="email"
                                    type="text"
                                    value={email}
                                    required
                                    onChange={handleEmailChange}
                                    placeholder="you@example.com or 10-digit mobile"
                                    style={{ ...inputStyle('email'), letterSpacing: /^[\d]+$/.test(email) && email.length > 0 ? '5px' : 'normal' }}
                                    onFocus={() => setFocused('email')}
                                    onBlur={() => setFocused('')}
                                />
                            </div>
                        </Field>

                        {/* Password */}
                        <Field label="Password" id="password">
                            <div className="warm-input-wrap">
                                <IoLockClosed size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused === 'password' ? '#F97316' : '#9CA3AF', transition: 'color 0.15s', pointerEvents: 'none' }} />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    required
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    style={{ ...inputStyle('password'), letterSpacing: showPassword && /^[\d]+$/.test(password) && password.length > 0 ? '5px' : 'normal' }}
                                    onFocus={() => setFocused('password')}
                                    onBlur={() => setFocused('')}
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword(p => !p)}
                                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', padding: 0 }}
                                >
                                    {showPassword ? <IoEyeOff size={17} /> : <IoEye size={17} />}
                                </button>
                            </div>
                        </Field>

                        {/* Forgot Password */}
                        <div style={{ textAlign: 'right', marginTop: -4 }}>
                            <Link to="/forgot-password" style={{ fontSize: 13, fontWeight: 700, color: '#F97316', textDecoration: 'none' }}>
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={!loading ? { opacity: 0.92, y: -1 } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                            style={{
                                width: '100%',
                                padding: '13px',
                                borderRadius: 12,
                                background: loading ? '#E5E7EB' : 'linear-gradient(135deg,#F97316,#EA580C)',
                                color: loading ? '#9CA3AF' : '#fff',
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: 15,
                                fontWeight: 800,
                                fontFamily: FONT,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                boxShadow: loading ? 'none' : '0 4px 16px rgba(249,115,22,0.35)',
                                transition: 'background 0.15s, box-shadow 0.15s',
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{ width: 16, height: 16, border: '2px solid #D1D5DB', borderTopColor: '#9CA3AF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                    Logging in…
                                </>
                            ) : (
                                <>Login <IoArrowForward size={15} /></>
                            )}
                        </motion.button>
                    </form>
                </motion.div>

                {/* Bottom subtitle note */}
                <p style={{ fontSize: 11.5, color: '#9CA3AF', textAlign: 'center', margin: 'clamp(10px, 1.8vh, 18px) 0 clamp(10px, 1.8vh, 16px) 0' }}>
                    Secure · Private · For Apna Lakshay members only
                </p>
            </div>

            {/* Bottom full-width orange accent line */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: 'linear-gradient(90deg, #F97316, #FB923C, #FDBA74)',
                    zIndex: 40,
                }}
            />

            {/* Instruction Modal */}
            {showInstructions && <InstructionModal onClose={() => setShowInstructions(false)} />}

            <AttendanceFloatingBtn />
        </div>
    );
}
