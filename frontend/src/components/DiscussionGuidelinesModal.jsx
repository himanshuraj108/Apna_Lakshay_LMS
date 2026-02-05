import React from 'react';
import { IoInformationCircle, IoWarning } from 'react-icons/io5';
import Modal from './ui/Modal';
import Button from './ui/Button';

const DiscussionGuidelinesModal = ({ isOpen, onClose }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Study Discussion Guidelines"
            maxWidth="max-w-xl"
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4 bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
                    <div className="bg-orange-500/20 p-2 rounded-full shrink-0">
                        <IoWarning className="text-orange-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-orange-200 mb-1">Important Notice</h4>
                        <p className="text-sm text-gray-300">
                            Welcome to the Study Discussion Room! This is a professional space for learning and collaboration.
                        </p>
                    </div>
                </div>

                <div className="space-y-3 text-gray-300">
                    <p className="font-medium text-white border-b border-white/10 pb-2">Please follow these rules:</p>
                    <ul className="space-y-3">
                        <li className="flex gap-3 items-start">
                            <span className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                            <span><strong>Be Respectful:</strong> Treat everyone with courtesy. No harassment, hate speech, or bullying.</span>
                        </li>
                        <li className="flex gap-3 items-start">
                            <span className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                            <span><strong>Stay on Topic:</strong> Keep discussions relevant to course materials, assignments, and study topics.</span>
                        </li>
                        <li className="flex gap-3 items-start">
                            <span className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                            <span><strong>No Spam:</strong> Avoid repetitive messages or promotional content.</span>
                        </li>
                        <li className="flex gap-3 items-start">
                            <span className="bg-white/10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                            <span><strong>Privacy First:</strong> Do not share personal contact information like phone numbers or addresses.</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mt-2 flex gap-3 items-center">
                    <IoInformationCircle className="text-blue-400 shrink-0" size={20} />
                    <p className="text-sm text-blue-300">
                        Admins monitor this chat. Violations may result in suspension of chat privileges.
                    </p>
                </div>

                <div className="mt-4 flex justify-end">
                    <Button onClick={onClose} variant="primary" className="w-full sm:w-auto">
                        I Understand & Agree
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DiscussionGuidelinesModal;
