import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBack, IoMail, IoCall, IoLocation, IoTime,
    IoShieldCheckmark, IoClose, IoNavigate, IoChatbubbleEllipses
} from 'react-icons/io5';
import { Link } from 'react-router-dom';
import Footer from '../../components/layout/Footer';

const ContactAdmin = () => {
    const [showMap, setShowMap] = useState(false);

    return (
        <div className="min-h-screen text-[#0F172A] relative overflow-x-hidden" style={{ background: '#FAF6F0' }}>

            {/* Warm dot-grid background */}
            <div className="fixed inset-0 z-0 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle, #D6C8B8 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                opacity: 0.35
            }} />
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: 'rgba(249,115,22,0.08)' }} />
                <div className="absolute top-[30%] right-[5%] w-[380px] h-[380px] rounded-full blur-[120px]" style={{ background: 'rgba(245,158,11,0.06)' }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-5 py-12">

                {/* Back link */}
                <Link
                    to="/student/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-semibold mb-8 transition-colors"
                    style={{ color: '#EA580C' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#C2410C'}
                    onMouseLeave={e => e.currentTarget.style.color = '#EA580C'}
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
                                <IoMail size={36} style={{ color: '#EA580C' }} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#0F172A' }}>Contact Administration</h1>
                                <p className="mt-1 text-sm font-medium" style={{ color: '#786D62' }}>We are here to help you — anytime you need</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Left — Get in Touch */}
                            <div className="space-y-5">
                                <h2 className="text-base font-extrabold uppercase tracking-wider pb-2" style={{ color: '#0F172A', borderBottom: '1.5px solid #EDE8E0' }}>
                                    Get in Touch
                                </h2>

                                {/* Visit Us + Map */}
                                <div className="rounded-xl p-4" style={{ background: '#FAF6F0', border: '1.5px solid #EDE8E0' }}>
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="p-2.5 rounded-xl shrink-0" style={{ background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)', color: '#2563EB' }}>
                                            <IoLocation size={22} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-sm mb-0.5" style={{ color: '#0F172A' }}>Visit Us</h3>
                                            <p className="text-sm leading-relaxed" style={{ color: '#786D62' }}>
                                                Basbariya Chawk Near Nahar<br />
                                                Sitamarhi, Bihar – 843302
                                            </p>
                                        </div>
                                    </div>

                                    <motion.button
                                        onClick={() => setShowMap(prev => !prev)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-white text-sm font-bold shadow-md transition-all"
                                        style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', boxShadow: '0 4px 14px rgba(234,88,12,0.30)' }}
                                    >
                                        <IoShieldCheckmark size={18} />
                                        {showMap ? 'HIDE MAP' : 'CHECK IN LOCATION'}
                                    </motion.button>

                                    <AnimatePresence>
                                        {showMap && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.35, ease: 'easeInOut' }}
                                                className="overflow-hidden mt-4"
                                            >
                                                <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #EDE8E0', boxShadow: '0 4px 16px rgba(120,80,30,0.10)' }}>
                                                    {/* Map header */}
                                                    <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'linear-gradient(90deg, #F97316, #F59E0B)' }}>
                                                        <div className="flex items-center gap-2 text-white text-xs font-bold">
                                                            <IoNavigate size={14} />
                                                            Apna Lakshya Library
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <a
                                                                href="https://maps.google.com/?q=Apna+Lakshya+Library+Sitamarhi"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-white/90 hover:text-white text-[11px] font-semibold underline"
                                                            >
                                                                Open in Maps ↗
                                                            </a>
                                                            <button
                                                                onClick={() => setShowMap(false)}
                                                                className="p-1 rounded-full text-white transition-colors"
                                                                style={{ background: 'rgba(255,255,255,0.20)' }}
                                                            >
                                                                <IoClose size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {/* Iframe */}
                                                    <iframe
                                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2977.556561511588!2d85.51155217449308!3d26.60061867343488!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ecf10029354d93%3A0x8b4252d4f2a1305!2sApna%20Lakshya%20Library!5e1!3m2!1sen!2sin!4v1789836157315!5m2!1sen!2sin"
                                                        width="100%"
                                                        height="280"
                                                        style={{ border: 0, display: 'block' }}
                                                        allowFullScreen
                                                        loading="lazy"
                                                        referrerPolicy="strict-origin-when-cross-origin"
                                                        title="Apna Lakshya Library Location"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Call Us */}
                                <div className="flex items-start gap-3 p-4 rounded-xl transition-all" style={{ background: '#FAF6F0', border: '1.5px solid #EDE8E0' }}>
                                    <div className="p-2.5 rounded-xl shrink-0" style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', color: '#059669' }}>
                                        <IoCall size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm mb-1" style={{ color: '#0F172A' }}>Call Us</h3>
                                        <p className="text-sm font-medium" style={{ color: '#786D62' }}>+91 97989 08881</p>
                                        <p className="text-sm font-medium" style={{ color: '#786D62' }}>+91 62057 72574</p>
                                    </div>
                                </div>

                                {/* Email Us */}
                                <div className="flex items-start gap-3 p-4 rounded-xl transition-all" style={{ background: '#FAF6F0', border: '1.5px solid #EDE8E0' }}>
                                    <div className="p-2.5 rounded-xl shrink-0" style={{ background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)', color: '#7C3AED' }}>
                                        <IoMail size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm mb-1" style={{ color: '#0F172A' }}>Email Us</h3>
                                        <p className="text-sm font-medium" style={{ color: '#786D62' }}>apnalakshaylms@gmail.com</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right — Office Hours */}
                            <div className="space-y-5">
                                <h2 className="text-base font-extrabold uppercase tracking-wider pb-2" style={{ color: '#0F172A', borderBottom: '1.5px solid #EDE8E0' }}>
                                    Office Hours
                                </h2>

                                <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #EDE8E0' }}>
                                    {/* Mon-Sat */}
                                    <div className="flex items-center justify-between px-5 py-4" style={{ background: '#FAF6F0', borderBottom: '1px solid #EDE8E0' }}>
                                        <div className="flex items-center gap-3">
                                            <IoTime style={{ color: '#D97706' }} size={18} />
                                            <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>Monday – Saturday</span>
                                        </div>
                                        <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }}>8:00 AM – 8:00 PM</span>
                                    </div>
                                    {/* Sunday */}
                                    <div className="flex items-center justify-between px-5 py-4" style={{ background: '#FFFFFF' }}>
                                        <div className="flex items-center gap-3">
                                            <IoTime style={{ color: '#EF4444' }} size={18} />
                                            <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>Sunday</span>
                                        </div>
                                        <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: '#FFF1F2', color: '#EF4444', border: '1px solid #FECDD3' }}>10:00 AM – 4:00 PM</span>
                                    </div>
                                </div>

                                {/* Help note */}
                                <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, #FFFDF9, #FFF7ED)', border: '1.5px solid #FED7AA' }}>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 rounded-xl shrink-0" style={{ background: 'linear-gradient(135deg, #FFF7ED, #FED7AA)', color: '#EA580C' }}>
                                            <IoChatbubbleEllipses size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#EA580C' }}>After Hours?</p>
                                            <p className="text-sm leading-relaxed" style={{ color: '#574E45' }}>
                                                For urgent issues outside office hours, please use the{' '}
                                                <span className="font-bold" style={{ color: '#0F172A' }}>Help &amp; Support</span>{' '}
                                                feature in your student dashboard.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <Footer />
            </div>
        </div>
    );
};

export default ContactAdmin;
