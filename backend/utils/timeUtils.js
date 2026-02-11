/**
 * Time utility functions for shift management
 */

/**
 * Convert time string to minutes since midnight
 * @param {string} time - Time in HH:MM format (e.g., "09:30")
 * @returns {number} Minutes since midnight
 */
const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Check if two time ranges overlap
 * @param {string} start1 - Start time of first range (HH:MM format)
 * @param {string} end1 - End time of first range (HH:MM format)
 * @param {string} start2 - Start time of second range (HH:MM format)
 * @param {string} end2 - End time of second range (HH:MM format)
 * @returns {boolean} True if the time ranges overlap
 * 
 * @example
 * doTimeRangesOverlap("06:00", "11:00", "09:00", "14:00") // true (overlaps 9-11)
 * doTimeRangesOverlap("06:00", "11:00", "11:00", "16:00") // false (touching but not overlapping)
 * doTimeRangesOverlap("06:00", "16:00", "11:00", "14:00") // true (second is enclosed)
 */
const doTimeRangesOverlap = (start1, end1, start2, end2) => {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);

    // Two ranges overlap if: start1 < end2 AND start2 < end1
    // This handles all cases including:
    // - Partial overlap
    // - Complete enclosure
    // - Identical ranges
    // Touching boundaries (e.g., 11:00-16:00 and 06:00-11:00) return false
    return s1 < e2 && s2 < e1;
};

/**
 * Format time range for display
 * @param {string} start - Start time (HH:MM format)
 * @param {string} end - End time (HH:MM format)
 * @returns {string} Formatted time range (e.g., "6:00 AM - 11:00 AM")
 */
const formatTimeRange = (start, end) => {
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
};

module.exports = {
    timeToMinutes,
    doTimeRangesOverlap,
    formatTimeRange
};
