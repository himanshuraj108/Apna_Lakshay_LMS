import { useState, useEffect } from 'react';
import api from '../utils/api';

const useShifts = () => {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCustom, setIsCustom] = useState(true); // Always custom now

    const fetchShifts = async () => {
        try {
            const response = await api.get('/public/shifts'); // Use public endpoint for all users (view only)

            if (response.data.success) {
                const customShifts = response.data.shifts.map(s => ({
                    id: s._id,
                    name: s.name,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    isCustom: true
                }));
                setShifts(customShifts);
            } else {
                setShifts([]);
            }
        } catch (error) {
            console.error('Failed to fetch shifts configuration:', error);
            setShifts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    // Helper to get formatted time range
    const getShiftTimeRange = (shift) => {
        if (!shift) return '';
        if (shift.startTime && shift.endTime) {
            return `${shift.startTime} - ${shift.endTime}`;
        }
        return '';
    };

    // Helper to get shift name by ID
    const getShiftName = (id) => {
        if (!id) return 'N/A';
        const found = shifts.find(s => s.id === id || s._id === id);
        return found ? found.name : id; // Fallback to ID if name not found
    };

    return {
        shifts,
        isCustom,
        loading,
        refreshShifts: fetchShifts,
        getShiftTimeRange,
        getShiftName
    };
};

export default useShifts;
