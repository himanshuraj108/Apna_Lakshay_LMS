import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../../utils/api';

const Footer = () => {
    const [visitorCount, setVisitorCount] = useState(null);

    useEffect(() => {
        const fetchVisitorCount = async () => {
            try {
                const alreadyCounted = sessionStorage.getItem('visitor_counted');
                let count;
                if (!alreadyCounted) {
                    const res = await api.get('/public/visitor-count');
                    count = res.data.count;
                    sessionStorage.setItem('visitor_counted', 'true');
                } else {
                    count = parseInt(sessionStorage.getItem('visitor_count_value') || '0', 10);
                    if (!count) {
                        const res = await api.get('/public/visitor-count');
                        count = res.data.count;
                    }
                }
                sessionStorage.setItem('visitor_count_value', String(count));
                setVisitorCount(count);
            } catch {
                // silently fail
            }
        };
        fetchVisitorCount();
    }, []);

    return (
        <footer className="mt-16 relative overflow-hidden" style={{ borderTop: '1px solid rgba(249,115,22,0.12)' }}>
            <style>{`@keyframes footer-shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}@keyframes footer-shimmer-ltr{0%{background-position:0% center;}100%{background-position:-200% center;}}`}</style>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.5) 30%, rgba(251,146,60,0.7) 50%, rgba(249,115,22,0.5) 70%, transparent)' }} />

            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.07) 0%, transparent 70%)' }} />

            <div className="relative z-10 py-8 text-center">
                {/* Brand name only */}
                <div className="mb-3">
                    <span className="text-base font-black" style={{
                        background: 'linear-gradient(90deg, #ea580c 0%, #f97316 15%, #fdba74 35%, #fff7ed 50%, #fdba74 65%, #f97316 85%, #ea580c 100%)',
                        backgroundSize: '300% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        animation: 'footer-shimmer-ltr 2.2s linear infinite',
                    }}>Apna Lakshay</span>
                </div>

                <p className="text-xs font-medium mb-1" style={{ color: '#9ca3af' }}>
                    © {new Date().getFullYear()} Apna Lakshay Library Management System. All rights reserved.
                </p>
                <p className="text-xs font-semibold mb-4" style={{ color: '#d1d5db' }}>
                    Made for Students
                </p>

                {/* Visitor Counter */}
                {visitorCount !== null && (
                    <div className="flex items-center justify-center mb-4">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
                            style={{
                                background: 'linear-gradient(135deg,rgba(249,115,22,0.08),rgba(251,146,60,0.05))',
                                border: '1px solid rgba(249,115,22,0.2)',
                                color: '#ea580c',
                            }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#f97316' }} />
                            <span className="font-black">{visitorCount.toLocaleString('en-IN')}</span>
                            <span style={{ color: '#f9a55a' }}>visitors</span>
                        </span>
                    </div>
                )}

                {/* Links */}
                <div className="flex justify-center gap-6 opacity-60 hover:opacity-100 transition-opacity duration-300">
                    {[
                        { to: '/privacy', label: 'Privacy Policy' },
                        { to: '/terms', label: 'Terms of Service' },
                        { to: '/contact', label: 'Contact Admin' },
                    ].map(link => (
                        <Link key={link.to} to={link.to}
                            className="text-xs font-semibold transition-colors duration-200 hover:text-orange-500"
                            style={{ color: '#6b7280' }}>
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
