import { Link } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import PasswordActivityLog from '../../components/admin/PasswordActivityLog';

const PasswordActivityPage = () => {
    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/dashboard">
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <IoArrowBack size={24} />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                                Password Activity
                            </h1>
                            <p className="text-gray-400 mt-2">Track all student password changes</p>
                        </div>
                    </div>
                </div>

                {/* Password Activity Log Component */}
                <PasswordActivityLog />
            </div>
        </div>
    );
};

export default PasswordActivityPage;
