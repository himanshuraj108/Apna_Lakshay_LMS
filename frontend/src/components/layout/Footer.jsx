import { IoHeart } from 'react-icons/io5';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="mt-20 border-t border-gray-800 py-8 text-center relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

            <div className="relative z-10">
                <p className="text-gray-500 text-sm mb-2">
                    &copy; {new Date().getFullYear()} Apna Lakshay Library Management System. All rights reserved.
                </p>
                <p className="text-gray-600 text-xs flex items-center justify-center gap-1">
                    Made with <IoHeart className="text-red-500 animate-pulse" /> for Students
                </p>

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
