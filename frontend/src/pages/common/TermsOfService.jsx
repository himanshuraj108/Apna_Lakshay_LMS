import { motion } from 'framer-motion';
import { IoArrowBack, IoDocumentText, IoVolumeHigh, IoFastFood, IoBrush, IoTime, IoCash, IoWarning, IoPerson } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import Footer from '../../components/layout/Footer';

const SECTIONS = [
    {
        num: '01',
        title: 'Acceptance of Terms',
        color: '#EA580C',
        bg: 'linear-gradient(135deg, #FFF7ED, #FED7AA)',
        icon: IoDocumentText,
        content: 'By accessing and using the Apna Lakshay Library Management System and facilities, you agree to comply with and be bound by these Terms of Service. Continued use of the facility constitutes acceptance of any updates to these terms.',
        list: null,
    },
    {
        num: '02',
        title: 'Facility Usage Rules',
        color: '#2563EB',
        bg: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
        icon: IoBrush,
        content: null,
        list: [
            { icon: IoVolumeHigh, label: 'Silence', desc: 'Maintain strict silence in reading areas at all times.' },
            { icon: IoFastFood, label: 'Food & Drink', desc: 'No edibles allowed at desks; only sealed water bottles are permitted.' },
            { icon: IoBrush, label: 'Cleanliness', desc: 'Keep your assigned seat and surroundings clean and damage-free.' },
            { icon: IoTime, label: 'Timings', desc: 'Adhere strictly to your assigned shift timings. Late entries may be denied.' },
        ],
        isFacility: true,
    },
    {
        num: '03',
        title: 'Membership & Fees',
        color: '#059669',
        bg: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
        icon: IoCash,
        content: 'Membership fees are non-refundable once paid. Fees must be paid on or before the due date to avoid penalties or suspension of facility access. Late payment may result in temporary deactivation of your seat and profile.',
        list: null,
    },
    {
        num: '04',
        title: 'Disciplinary Action',
        color: '#DC2626',
        bg: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
        icon: IoWarning,
        content: 'Violation of library rules may result in a formal warning, monetary fine, or permanent termination of membership without any refund, at the sole discretion of the administration. Repeated violations will lead to escalated action.',
        list: null,
    },
    {
        num: '05',
        title: 'Personal Integrity & Liability',
        color: '#7C3AED',
        bg: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
        icon: IoPerson,
        content: 'You are fully responsible for your personal belongings. The management shall not be liable for any loss, theft, or damage to personal property within or around the library premises.',
        list: null,
    },
];

const TermsOfService = () => {
    return (
        <div className="min-h-screen text-[#0F172A] relative overflow-x-hidden" style={{ background: '#FAF6F0' }}>

            {/* Warm dot-grid background */}
            <div className="fixed inset-0 z-0 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle, #D6C8B8 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                opacity: 0.35
            }} />
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: 'rgba(249,115,22,0.08)' }} />
                <div className="absolute top-[30%] left-[5%] w-[380px] h-[380px] rounded-full blur-[120px]" style={{ background: 'rgba(37,99,235,0.05)' }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-5 py-12">

                {/* Back link */}
                <Link
                    to="/student/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors"
                    style={{ color: '#EA580C' }}
                >
                    <IoArrowBack size={16} />
                    Back to Dashboard
                </Link>

                {/* Main card */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative overflow-hidden rounded-2xl"
                    style={{ background: '#FFFFFF', border: '1.5px solid #EDE8E0', boxShadow: '0 8px 32px rgba(120,80,30,0.08)' }}
                >
                    {/* 3px gradient accent top bar */}
                    <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #F97316, #F59E0B, #EA580C)' }} />

                    <div className="p-8 md:p-12">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #FFF7ED, #FED7AA)' }}>
                                <IoDocumentText size={36} style={{ color: '#EA580C' }} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#0F172A' }}>Terms of Service</h1>
                                <p className="mt-1 text-sm font-medium" style={{ color: '#786D62' }}>
                                    Effective Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Intro */}
                        <p className="text-sm leading-relaxed mb-10 px-1" style={{ color: '#574E45' }}>
                            These Terms of Service govern your use of the{' '}
                            <span className="font-bold" style={{ color: '#0F172A' }}>Apna Lakshya Library</span>{' '}
                            facilities and the associated digital management platform. Please read these terms carefully before using our services.
                        </p>

                        {/* Sections */}
                        <div className="space-y-5">
                            {SECTIONS.map((sec, idx) => {
                                const Icon = sec.icon;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: idx * 0.07 }}
                                        className="rounded-xl overflow-hidden"
                                        style={{ border: '1.5px solid #EDE8E0' }}
                                    >
                                        {/* Section header */}
                                        <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: '#FAF6F0', borderBottom: '1px solid #EDE8E0' }}>
                                            <div className="p-2 rounded-lg shrink-0" style={{ background: sec.bg, color: sec.color }}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: sec.color }}>{sec.num}</span>
                                                <h2 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: '#0F172A' }}>{sec.title}</h2>
                                            </div>
                                        </div>

                                        {/* Section body */}
                                        <div className="px-5 py-4 bg-white space-y-3">
                                            {sec.content && (
                                                <p className="text-sm leading-relaxed" style={{ color: '#574E45' }}>{sec.content}</p>
                                            )}
                                            {sec.isFacility && sec.list && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {sec.list.map((item, i) => {
                                                        const ItemIcon = item.icon;
                                                        return (
                                                            <div
                                                                key={i}
                                                                className="flex items-start gap-3 p-3 rounded-xl"
                                                                style={{ background: '#FAF6F0', border: '1px solid #EDE8E0' }}
                                                            >
                                                                <div className="p-2 rounded-lg shrink-0" style={{ background: sec.bg, color: sec.color }}>
                                                                    <ItemIcon size={15} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-extrabold uppercase tracking-wide mb-0.5" style={{ color: '#0F172A' }}>{item.label}</p>
                                                                    <p className="text-xs leading-relaxed" style={{ color: '#786D62' }}>{item.desc}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Footer note */}
                        <div className="mt-8 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, #FFFDF9, #FFF7ED)', border: '1.5px solid #FED7AA' }}>
                            <p className="text-xs leading-relaxed text-center" style={{ color: '#786D62' }}>
                                By continuing to use the facility, you acknowledge that you have read, understood, and agreed to these Terms of Service.
                                For any queries, please contact <span className="font-bold" style={{ color: '#0F172A' }}>apnalakshaylms@gmail.com</span>.
                            </p>
                        </div>
                    </div>
                </motion.div>

                <Footer />
            </div>
        </div>
    );
};

export default TermsOfService;
