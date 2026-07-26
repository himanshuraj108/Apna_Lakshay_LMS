import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../../utils/api';

const Footer = () => {
    const [visitorCount, setVisitorCount] = useState(null);

    useEffect(() => {
        const fetchVisitorCount = async () => {
            try {
                // Only increment once per browser session (not per re-render)
                const alreadyCounted = sessionStorage.getItem('visitor_counted');
                let count;

                if (!alreadyCounted) {
                    // First visit this session — increment in DB
                    const res = await api.get('/public/visitor-count');
                    count = res.data.count;
                    sessionStorage.setItem('visitor_counted', 'true');
                } else {
                    // Already counted this session — just read current value without incrementing
                    // We show the last known count stored in sessionStorage
                    count = parseInt(sessionStorage.getItem('visitor_count_value') || '0', 10);
                    if (!count) {
                        const res = await api.get('/public/visitor-count');
                        count = res.data.count;
                    }
                }

                sessionStorage.setItem('visitor_count_value', String(count));
                setVisitorCount(count);
            } catch {
                // silently fail — don't break the footer
            }
        };

        fetchVisitorCount();
    }, []);

    return (
        <footer className="mt-20 border-t border-gray-800 py-8 text-center relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

            <div className="relative z-10">
                <p className="text-gray-500 text-sm mb-2">
                    &copy; {new Date().getFullYear()} Apna Lakshay Library Management System. All rights reserved.
                </p>
                <p className="text-gray-600 text-xs flex items-center justify-center gap-1">
                    Made for Students
                </p>

                {/* Visitor Counter */}
                {visitorCount !== null && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <span className="inline-flex items-center gap-1.5 bg-gray-800/60 border border-gray-700 rounded-full px-3 py-1 text-xs text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"></span>
                            <span>
                                <span className="font-semibold text-gray-300">
                                    {visitorCount.toLocaleString('en-IN')}
                                </span>
                                {' '}visitors
                            </span>
                        </span>
                    </div>
                )}

                <div className="flex justify-center gap-6 mt-4 opacity-50 hover:opacity-100 transition-opacity duration-300">
                    <Link to="/privacy" className="text-gray-400 hover:text-white text-xs">Privacy Policy</Link>
                    <Link to="/terms" className="text-gray-400 hover:text-white text-xs">Terms of Service</Link>
                    <Link to="/contact" className="text-gray-400 hover:text-white text-xs">Contact Admin</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
