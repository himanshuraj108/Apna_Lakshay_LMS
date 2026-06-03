import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import {
    IoArrowBack, IoWallet, IoPeople, IoGift, IoCopy, IoCheckmark,
    IoTrendingUp, IoTrendingDown, IoClose, IoInformationCircle,
    IoLogoWhatsapp, IoAlert, IoRefreshOutline,
    IoTimeOutline, IoSparkles, IoChevronDown, IoChevronUp, IoStar,
    IoArrowUp, IoArrowDown, IoHardwareChip, IoDocumentText,
    IoBarChart, IoFlame, IoHandLeft
} from 'react-icons/io5';

/* ───── helpers ─────────────────────────────────────────── */
const fmt = (n) => (n || 0).toLocaleString('en-IN');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

const activityLabel = {
    referral:          'Referral Reward',
    daily_quiz:        'Daily Quiz',
    streak:            '7-Day Streak',
    attendance:        'Attendance',
    mock_test:         'Mock Test',
    ai_tool:           'AI Tool Used',
    fee_discount:      'Fee Discount',
    mock_test_credit:  'Mock Test Credit',
    doubt_credit:      'Doubt Credit',
    study_planner:     'Study Planner',
    note_summarizer:   'Note Summarizer',
    manual:            'Manual Adjustment',
    expiry:            'Coins Expired',
};

const activityIcon = {
    referral:          IoPeople,
    daily_quiz:        IoDocumentText,
    streak:            IoFlame,
    attendance:        IoCheckmark,
    mock_test:         IoBarChart,
    ai_tool:           IoHardwareChip,
    fee_discount:      IoWallet,
    mock_test_credit:  IoBarChart,
    doubt_credit:      IoHandLeft,
    study_planner:     IoDocumentText,
    note_summarizer:   IoDocumentText,
    manual:            IoSparkles,
    expiry:            IoAlert,
};

const statusColor = {
    rewarded: { bg: '#dcfce7', text: '#16a34a', label: 'Rewarded' },
    pending:  { bg: '#fef9c3', text: '#b45309', label: 'Pending' },
    approved: { bg: '#dbeafe', text: '#1d4ed8', label: 'Approved' },
    rejected: { bg: '#fee2e2', text: '#dc2626', label: 'Rejected' },
};

/* ── Coin chip — replaces all 🪙 occurrences ── */
const CoinChip = ({ count, size = 'sm', color = '#6366f1' }) => (
    <span className="inline-flex items-center gap-1 font-black" style={{ color }}>
        <IoWallet size={size === 'lg' ? 18 : 13} style={{ color }} />
        {count}
    </span>
);

/* ───── StatCard ────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: 'spring', stiffness: 120 }}
        className="relative rounded-2xl bg-white border border-gray-200 p-4 overflow-hidden"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: color }} />
        <Icon size={40} className="absolute -bottom-1 -right-1 opacity-5" style={{ color }} />
        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
            <Icon size={15} style={{ color }} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
        <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
    </motion.div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
const WalletPage = () => {
    const [tab, setTab] = useState('wallet');
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [referral, setReferral] = useState(null);
    const [loading, setLoading] = useState(true);
    const [txnLoading, setTxnLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState(null);
    const [redeemModal, setRedeemModal] = useState(false);
    const [redeemType, setRedeemType] = useState('');
    const [redeemCoins, setRedeemCoins] = useState('');
    const [redeemLoading, setRedeemLoading] = useState(false);
    const [txnPage, setTxnPage] = useState(1);
    const [txnTotal, setTxnTotal] = useState(0);
    const [showAllReferrals, setShowAllReferrals] = useState(false);
    const [instrLang, setInstrLang] = useState('en');
    const [referralEnabled, setReferralEnabled] = useState(true);


    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchWallet = useCallback(async () => {
        try {
            const res = await api.get('/student/wallet');
            setWallet(res.data.wallet);
        } catch {/* silent */}
    }, []);

    const fetchTransactions = useCallback(async (page = 1) => {
        setTxnLoading(true);
        try {
            const res = await api.get(`/student/wallet/transactions?page=${page}&limit=20`);
            setTransactions(res.data.transactions || []);
            setTxnTotal(res.data.total || 0);
        } catch {/* silent */} finally {
            setTxnLoading(false);
        }
    }, []);

    const fetchReferral = useCallback(async () => {
        try {
            const res = await api.get('/student/referral/my-code');
            setReferral(res.data);
        } catch {/* silent */}
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [, , , settingsRes] = await Promise.allSettled([
                    fetchWallet(),
                    fetchReferral(),
                    fetchTransactions(1),
                    api.get('/public/settings')
                ]);
                if (settingsRes.status === 'fulfilled' && settingsRes.value.data?.success) {
                    const settings = settingsRes.value.data.settings;
                    setReferralEnabled(!!settings.referral?.enabled);
                }
            } catch (err) {
                console.error('Failed to load wallet:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [fetchWallet, fetchReferral, fetchTransactions]);

    const copyCode = () => {
        if (!referral?.referralCode) return;
        navigator.clipboard.writeText(referral.referralCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const shareWhatsApp = () => {
        const code = referral?.referralCode;
        const coins = referral?.settings?.coinsPerReferral || 500;
        const msg = `Join Apna Lakshya Library using my referral code *${code}* and I'll earn ${coins} Lakshay Coins!\n\nDownload: https://apnalakshay.com`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleRedeem = async () => {
        if (!redeemType || !redeemCoins || Number(redeemCoins) <= 0) return;
        setRedeemLoading(true);
        try {
            const res = await api.post('/student/wallet/redeem', {
                type: redeemType,
                coinsToSpend: Number(redeemCoins)
            });
            showToast(`Redeemed! ${res.data.discountAmount > 0 ? `Rs.${res.data.discountAmount} discount applied.` : 'Credits added.'}`);
            setRedeemModal(false);
            setRedeemCoins('');
            setRedeemType('');
            fetchWallet();
            fetchTransactions(1);
        } catch (err) {
            showToast(err.response?.data?.message || 'Redemption failed', 'error');
        } finally {
            setRedeemLoading(false);
        }
    };

    const changeTxnPage = (p) => {
        setTxnPage(p);
        fetchTransactions(p);
    };

    // ─── loading skeleton ─────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen" style={{ background: '#F8FAFC', fontFamily: "'Inter',sans-serif" }}>
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="h-8 w-32 bg-gray-200 rounded-xl animate-pulse mb-8" />
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[0,1,2].map(i => (
                            <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                    <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    if (!referralEnabled) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 animate-fadeIn" style={{ fontFamily: "'Inter', sans-serif" }}>
                <div className="max-w-md w-full mx-auto px-6 py-12 bg-white border border-gray-200 rounded-3xl shadow-xl text-center">
                    <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <IoAlert size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-3">Wallet Disabled</h2>
                    <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                        The referral rewards and coin wallet features have been temporarily turned off by the administration.
                    </p>
                    <Link to="/student" className="inline-flex items-center gap-2 text-xs font-bold px-5 py-3 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 transition-all hover:shadow-lg active:scale-95">
                        <IoArrowBack size={14} /> Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const redeemOptions = wallet?.redeemEnabled ? Object.entries(wallet.redeemEnabled)
        .filter(([, enabled]) => enabled)
        .map(([key]) => ({
            key,
            label: activityLabel[key] || key,
            rate: wallet.redeemRates?.[key] || 100
        })) : [];

    const refList = referral?.referrals || [];
    const visibleRefs = showAllReferrals ? refList : refList.slice(0, 5);

    return (
        <div className="min-h-screen pb-20" style={{ background: '#F8FAFC', fontFamily: "'Inter',sans-serif" }}>

            {/* ── fixed bg pattern ─ */}
            <div className="fixed inset-0 -z-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,rgba(0,0,0,0.04) 1px,transparent 0)', backgroundSize: '40px 40px' }} />

            {/* ── Toast ─ */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -60, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -60, x: '-50%' }}
                        className="fixed top-5 left-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl"
                        style={{
                            background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
                            border: toast.type === 'error' ? '1px solid #fca5a5' : '1px solid #86efac',
                            color: toast.type === 'error' ? '#dc2626' : '#16a34a'
                        }}>
                        {toast.type === 'error' ? <IoAlert size={17} /> : <IoCheckmark size={17} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Header ─ */}
                <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-7">
                    <Link to="/student">
                        <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 transition-all">
                            <IoArrowBack size={15} /> <span className="hidden sm:inline">Dashboard</span>
                        </motion.button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Lakshay Wallet</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Earn &amp; spend coins, share your referral</p>
                    </div>
                </motion.div>

                {/* ── Tabs ─ */}
                <div className="flex gap-2 mb-6 p-1 bg-white border border-gray-200 rounded-2xl w-fit shadow-sm">
                    {[
                        { key: 'wallet',   label: 'Coin Wallet', icon: IoWallet,      show: true },
                        { key: 'referral', label: 'Referral',    icon: IoPeople,      show: referral?.enabled === true },
                        { key: 'history',  label: 'History',     icon: IoTimeOutline, show: true },
                    ].filter(t => t.show).map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === key
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-800'}`}>
                            <Icon size={14} /> {label}
                        </button>
                    ))}
                </div>


                {/* ══════════════════════════ WALLET TAB ══════════════════════════ */}
                <AnimatePresence mode="wait">
                {tab === 'wallet' && (
                    <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>

                        {/* Expiry warning */}
                        {wallet?.coinExpiresAt && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl mb-5 text-amber-700 text-sm font-medium">
                                <IoAlert size={16} className="text-amber-500 shrink-0" />
                                Coins expire on <strong>{fmtDate(wallet.coinExpiresAt)}</strong>. Stay active to reset expiry!
                            </motion.div>
                        )}

                        {/* Stat cards */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <StatCard icon={IoWallet}      label="Balance"      value={fmt(wallet?.coinBalance)}      color="#6366f1" delay={0} />
                            <StatCard icon={IoTrendingUp}  label="Total Earned"  value={fmt(wallet?.totalCoinsEarned)} color="#22c55e" delay={0.06} />
                            <StatCard icon={IoTrendingDown} label="Total Spent"  value={fmt(wallet?.totalCoinsSpent)}  color="#f59e0b" delay={0.12} />
                        </div>

                        {/* Big balance display */}
                        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                            className="relative rounded-3xl overflow-hidden mb-6 text-white"
                            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)', boxShadow: '0 20px 60px rgba(99,102,241,0.35)' }}>
                            <div className="absolute inset-0 opacity-10"
                                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,rgba(255,255,255,0.4) 1px,transparent 0)', backgroundSize: '24px 24px' }} />
                            <div className="relative px-6 py-7">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Lakshay Coins</p>
                                        <div className="flex items-center gap-3">
                                            <p className="text-5xl font-black leading-none">{fmt(wallet?.coinBalance)}</p>
                                            <IoWallet size={28} className="opacity-60" />
                                        </div>
                                        <p className="text-white/50 text-xs mt-2">
                                            = approx. ₹{Math.floor((wallet?.coinBalance || 0) / 100) * 10} fee discount
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-white/10 border border-white/20">
                                        <IoSparkles size={24} className="text-yellow-300" />
                                    </div>
                                </div>

                                {/* Redeem button */}
                                {redeemOptions.length > 0 && (wallet?.coinBalance || 0) > 0 && (
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={() => setRedeemModal(true)}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-indigo-700 rounded-2xl font-black text-sm shadow-lg hover:shadow-xl transition-all">
                                        <IoGift size={16} /> Redeem Coins
                                    </motion.button>
                                )}
                                {(wallet?.coinBalance || 0) === 0 && (
                                    <div className="w-full py-3.5 bg-white/10 border border-white/20 text-white/50 rounded-2xl font-bold text-sm text-center">
                                        Earn coins to unlock redemptions
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Full Bilingual Instructions */}
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">

                            {/* Header + Language Selector */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                                        <IoInformationCircle size={14} className="text-indigo-500" />
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">
                                        {instrLang === 'hi' ? 'लक्ष्य कॉइन गाइड' : 'Lakshay Coins Guide'}
                                    </p>
                                </div>
                                <select value={instrLang} onChange={e => setInstrLang(e.target.value)}
                                    className="text-xs font-bold border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:border-indigo-400 cursor-pointer">
                                    <option value="en">English</option>
                                    <option value="hi">हिन्दी</option>
                                </select>
                            </div>

                            {instrLang === 'en' ? (
                                <div className="space-y-4 text-sm text-gray-700">
                                    <p className="text-xs text-gray-500 leading-relaxed border-l-2 border-indigo-300 pl-3">
                                        Lakshay Coins is a reward system that recognizes your dedication and effort. Earn coins through daily activities and redeem them for real benefits.
                                    </p>

                                    <div className="space-y-3">
                                        <p className="text-xs font-black uppercase tracking-widest text-indigo-600">How to Earn Coins</p>

                                        {[
                                            { icon: IoPeople,      title: 'Referral (+500 coins)',       desc: 'Invite a friend to join Apna Lakshya using your unique referral code. When they are admitted and verified by the admin, you will automatically receive 500 Lakshay Coins as a thank-you reward.' },
                                            { icon: IoDocumentText, title: 'Daily Quiz (+10 coins)',      desc: 'A new quiz is available every day on your dashboard. Attempt it and submit your answers to earn 10 coins. You can only earn from each quiz once, so make it a daily habit.' },
                                            { icon: IoFlame,        title: '7-Day Streak (+50 coins)',   desc: 'Log in and stay active every day for 7 consecutive days to earn a 50-coin streak bonus. Missing even one day resets your streak, so stay consistent!' },
                                            { icon: IoBarChart,     title: 'Mock Test (+20 coins)',       desc: 'Complete a full mock test on the platform. After submitting, 20 coins are credited to your wallet. Practice regularly to earn more and improve your score.' },
                                            { icon: IoHardwareChip, title: 'AI Tool Use (+5 coins)',      desc: 'Every time you use an AI-powered tool — such as Study Planner, Note Summarizer, Test Analyzer, or Current Affairs Quiz — you earn 5 coins. These tools are available in the AI Study Suite section.' },
                                        ].map(({ icon: Icon, title, desc }) => (
                                            <div key={title} className="flex gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Icon size={15} className="text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm mb-0.5">{title}</p>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">How to Use / Redeem Coins</p>
                                        {[
                                            { icon: IoWallet,       title: 'Fee Discount',               desc: 'Redeem your coins to get a discount on your monthly seat fee. Every 100 coins = ₹10 off. You can apply the discount when paying your next fee cycle. The admin will verify and apply it.' },
                                            { icon: IoBarChart,     title: 'Mock Test Credits',           desc: 'Out of mock test attempts? Use your coins to unlock additional attempts. Every 200 coins give you 1 extra mock test credit, so you can keep practising.' },
                                            { icon: IoHandLeft,     title: 'Doubt / Ask AI Credits',     desc: 'Need to ask the AI more questions? Redeem 50 coins for 1 extra doubt credit and keep getting answers without interruption.' },
                                        ].map(({ icon: Icon, title, desc }) => (
                                            <div key={title} className="flex gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Icon size={15} className="text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm mb-0.5">{title}</p>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                                        <IoAlert size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            <strong>Note:</strong> Coins have an expiry period set by the admin. Stay active to keep your coins valid. Expired coins cannot be recovered.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 text-sm text-gray-700">
                                    <p className="text-xs text-gray-500 leading-relaxed border-l-2 border-indigo-300 pl-3">
                                        लक्ष्य कॉइन एक रिवॉर्ड सिस्टम है जो आपकी मेहनत और नियमितता को पहचानता है। रोज़ाना की गतिविधियों से कॉइन कमाएं और असली फायदे के लिए रिडीम करें।
                                    </p>

                                    <div className="space-y-3">
                                        <p className="text-xs font-black uppercase tracking-widest text-indigo-600">कॉइन कैसे कमाएं</p>

                                        {[
                                            { icon: IoPeople,       title: 'रेफरल (+500 कॉइन)',            desc: 'अपने दोस्त को अपने यूनीक रेफरल कोड से Apna Lakshya में जुड़ने के लिए आमंत्रित करें। जब उनका एडमिशन हो जाए और एडमिन द्वारा वेरीफाई हो जाए, तो आपको 500 कॉइन मिलेंगे।' },
                                            { icon: IoDocumentText, title: 'डेली क्विज़ (+10 कॉइन)',       desc: 'हर दिन आपके डैशबोर्ड पर एक नया क्विज़ उपलब्ध होता है। क्विज़ दें और सबमिट करें — 10 कॉइन मिलेंगे। हर क्विज़ से सिर्फ एक बार कॉइन मिलते हैं, इसलिए इसे रोज़ाना की आदत बनाएं।' },
                                            { icon: IoFlame,        title: '7 दिन स्ट्रीक (+50 कॉइन)',   desc: 'लगातार 7 दिन लॉग इन करके एक्टिव रहें और 50 कॉइन का स्ट्रीक बोनस पाएं। एक भी दिन छूटने पर स्ट्रीक रीसेट हो जाती है, इसलिए रोज़ आएं!' },
                                            { icon: IoBarChart,     title: 'मॉक टेस्ट (+20 कॉइन)',        desc: 'पूरा मॉक टेस्ट दें और सबमिट करें। टेस्ट जमा होते ही 20 कॉइन आपके वॉलेट में आ जाएंगे। नियमित अभ्यास करें और ज़्यादा कॉइन कमाएं।' },
                                            { icon: IoHardwareChip, title: 'AI टूल उपयोग (+5 कॉइन)',     desc: 'हर बार जब आप कोई AI टूल — जैसे Study Planner, Note Summarizer, Test Analyzer, या Current Affairs Quiz — उपयोग करते हैं, तो 5 कॉइन मिलते हैं। ये टूल AI Study Suite में उपलब्ध हैं।' },
                                        ].map(({ icon: Icon, title, desc }) => (
                                            <div key={title} className="flex gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Icon size={15} className="text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm mb-0.5">{title}</p>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">कॉइन कैसे रिडीम करें</p>
                                        {[
                                            { icon: IoWallet,       title: 'फीस डिस्काउंट',              desc: 'कॉइन रिडीम करके अपनी मासिक सीट फीस पर छूट पाएं। हर 100 कॉइन = ₹10 की छूट। अगली फीस के समय डिस्काउंट अप्लाई कर सकते हैं। एडमिन इसे वेरीफाई करके लागू करेगा।' },
                                            { icon: IoBarChart,     title: 'मॉक टेस्ट क्रेडिट',          desc: 'मॉक टेस्ट के प्रयास खत्म हो गए? कॉइन से और अटेम्प्ट अनलॉक करें। 200 कॉइन = 1 एक्स्ट्रा मॉक टेस्ट क्रेडिट।' },
                                            { icon: IoHandLeft,     title: 'डाउट / AI क्रेडिट',          desc: 'AI से और सवाल पूछना है? 50 कॉइन रिडीम करें और 1 एक्स्ट्रा डाउट क्रेडिट पाएं — बिना रुकावट के सीखते रहें।' },
                                        ].map(({ icon: Icon, title, desc }) => (
                                            <div key={title} className="flex gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Icon size={15} className="text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm mb-0.5">{title}</p>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                                        <IoAlert size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            <strong>ध्यान दें:</strong> कॉइन की एक्सपायरी डेट एडमिन द्वारा तय की जाती है। एक्टिव रहें ताकि आपके कॉइन वैलिड रहें। एक्सपायर हुए कॉइन वापस नहीं मिलेंगे।
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                    </motion.div>
                )}

                {/* ══════════════════════════ REFERRAL TAB ══════════════════════════ */}
                {tab === 'referral' && (
                    <motion.div key="referral" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {!referral?.enabled ? (
                            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
                                <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <IoPeople size={28} className="text-gray-400" />
                                </div>
                                <h3 className="font-bold text-gray-700 mb-1">Referral Program Not Active</h3>
                                <p className="text-gray-400 text-sm">The admin has not enabled the referral program yet. Check back later!</p>
                            </div>
                        ) : (
                            <>
                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3 mb-5">
                                    <StatCard icon={IoPeople}      label="Referred"     value={referral.stats?.totalReferrals || 0}       color="#6366f1" delay={0} />
                                    <StatCard icon={IoGift}        label="Rewarded"     value={referral.stats?.rewarded || 0}             color="#22c55e" delay={0.06} />
                                    <StatCard icon={IoWallet}      label="Coins Earned" value={fmt(referral.stats?.totalCoinsEarned)}     color="#f59e0b" delay={0.12} />
                                </div>

                                {/* Referral Code Card */}
                                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.14 }}
                                    className="relative rounded-3xl overflow-hidden mb-5 text-white"
                                    style={{ background: 'linear-gradient(135deg,#059669,#10b981,#34d399)', boxShadow: '0 20px 60px rgba(16,185,129,0.3)' }}>
                                    <div className="absolute inset-0 opacity-10"
                                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,rgba(255,255,255,0.5) 1px,transparent 0)', backgroundSize: '20px 20px' }} />
                                    <div className="relative px-6 py-7">
                                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Your Referral Code</p>
                                        <p className="text-4xl font-black tracking-widest mb-1 font-mono">{referral.referralCode}</p>
                                        <p className="text-white/60 text-xs mb-5">
                                            Earn <strong className="text-white">{referral.settings?.coinsPerReferral || 500} coins</strong> for every student who joins using your code
                                        </p>
                                        <div className="flex gap-2">
                                            <motion.button whileTap={{ scale: 0.96 }} onClick={copyCode}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-emerald-700 rounded-2xl font-bold text-sm shadow-md hover:bg-gray-50 transition-all">
                                                {copied ? <IoCheckmark size={16} className="text-emerald-600" /> : <IoCopy size={16} />}
                                                {copied ? 'Copied!' : 'Copy Code'}
                                            </motion.button>
                                            <motion.button whileTap={{ scale: 0.96 }} onClick={shareWhatsApp}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#1ebe5a] text-white rounded-2xl font-bold text-sm shadow-md transition-all">
                                                <IoLogoWhatsapp size={16} />
                                                <span>Share</span>
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>


                                {/* Referral list */}
                                {refList.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                                        className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                <IoPeople size={13} className="text-emerald-500" />
                                            </div>
                                            <p className="font-bold text-gray-900 text-sm">Referred Students</p>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            {visibleRefs.map((r) => {
                                                const sc = statusColor[r.status] || statusColor.pending;
                                                return (
                                                    <div key={r._id} className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{r.referee?.name || 'New Student'}</p>
                                                            <p className="text-xs text-gray-400">{fmtDate(r.createdAt)}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {r.coinsAwarded > 0 && (
                                                                <span className="flex items-center gap-1 text-sm font-black text-emerald-600">
                                                                    <IoWallet size={12} className="text-emerald-500" />
                                                                    +{r.coinsAwarded}
                                                                </span>
                                                            )}
                                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                                                                style={{ background: sc.bg, color: sc.text }}>
                                                                {sc.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {refList.length > 5 && (
                                            <div className="px-5 pb-4 flex justify-center">
                                                <button onClick={() => setShowAllReferrals(s => !s)}
                                                    className="flex items-center gap-1.5 text-indigo-600 text-sm font-bold hover:text-indigo-800 transition-colors">
                                                    {showAllReferrals ? <><IoChevronUp size={14}/> Show less</> : <><IoChevronDown size={14}/> Show all {refList.length}</>}
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}

                {/* ══════════════════════════ HISTORY TAB ══════════════════════════ */}
                {tab === 'history' && (
                    <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                                        <IoTimeOutline size={13} className="text-indigo-500" />
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">Transaction History</p>
                                </div>
                                <button onClick={() => fetchTransactions(txnPage)}
                                    className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
                                    <IoRefreshOutline size={15} className="text-gray-400" />
                                </button>
                            </div>

                            {txnLoading ? (
                                <div className="p-6 space-y-3">
                                    {[0,1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="py-16 text-center text-gray-400 text-sm">No transactions yet.</div>
                            ) : (
                                <div className="p-4 space-y-2">
                                    {transactions.map((t, i) => {
                                        const isEarn = t.coins > 0;
                                        const TxnIcon = activityIcon[t.activity] || (isEarn ? IoArrowUp : IoArrowDown);
                                        return (
                                            <motion.div key={t._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                                                style={{
                                                    background: isEarn ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)',
                                                    borderColor: isEarn ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'
                                                }}>
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                                    style={{ background: isEarn ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }}>
                                                    <TxnIcon size={16} style={{ color: isEarn ? '#16a34a' : '#dc2626' }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 text-sm truncate">
                                                        {activityLabel[t.activity] || t.activity}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400">{fmtDate(t.createdAt)}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className={`flex items-center gap-1 font-black text-base justify-end ${isEarn ? 'text-emerald-600' : 'text-red-500'}`}>
                                                        <IoWallet size={13} />
                                                        {isEarn ? '+' : ''}{t.coins}
                                                    </div>
                                                    <p className="text-[11px] text-gray-400">Bal: {fmt(t.balanceAfter)}</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pagination */}
                            {txnTotal > 20 && (
                                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                                    <p className="text-xs text-gray-400">{transactions.length} of {txnTotal}</p>
                                    <div className="flex gap-2">
                                        {txnPage > 1 && (
                                            <button onClick={() => changeTxnPage(txnPage - 1)}
                                                className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                                                Prev
                                            </button>
                                        )}
                                        {txnPage * 20 < txnTotal && (
                                            <button onClick={() => changeTxnPage(txnPage + 1)}
                                                className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                                                Next
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            {/* ══════════════════════════ REDEEM MODAL ══════════════════════════ */}
            <AnimatePresence>
            {redeemModal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setRedeemModal(false)}>
                    <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.96 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Redeem Coins</h3>
                                <div className="flex items-center gap-1 text-sm text-gray-400 mt-0.5">
                                    Balance: <IoWallet size={13} className="text-indigo-500 mx-0.5" />
                                    <strong className="text-indigo-600">{fmt(wallet?.coinBalance)}</strong>
                                </div>
                            </div>
                            <button onClick={() => setRedeemModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                                <IoClose size={20} />
                            </button>
                        </div>

                        {/* Category */}
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Redeem for</p>
                        <div className="grid grid-cols-2 gap-2 mb-5">
                            {redeemOptions.map(({ key, label, rate }) => (
                                <button key={key} onClick={() => setRedeemType(key)}
                                    className={`px-3 py-3 rounded-2xl text-left border-2 transition-all ${redeemType === key
                                        ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:border-indigo-200'}`}>
                                    <p className="text-sm font-bold text-gray-800">{label}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">{rate} coins / unit</p>
                                </button>
                            ))}
                        </div>

                        {/* Coins input */}
                        {redeemType && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Coins to use</p>
                                <input type="number" min="1" max={wallet?.coinBalance}
                                    value={redeemCoins}
                                    onChange={e => setRedeemCoins(e.target.value)}
                                    placeholder={`Max: ${wallet?.coinBalance}`}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-900 focus:border-indigo-400 focus:outline-none mb-2" />
                                {redeemType === 'feeDiscount' && redeemCoins > 0 && (
                                    <p className="text-sm text-emerald-600 font-bold mb-4">
                                        ≈ ₹{Math.floor(Number(redeemCoins) / 100) * 10} discount on your fee
                                    </p>
                                )}
                            </motion.div>
                        )}

                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleRedeem}
                            disabled={redeemLoading || !redeemType || !redeemCoins}
                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            {redeemLoading ? 'Processing...' : 'Confirm Redemption'}
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};

export default WalletPage;
