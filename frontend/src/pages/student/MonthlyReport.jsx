import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    IoArrowBack, IoDownloadOutline, IoCalendarOutline,
    IoTimeOutline, IoTrophyOutline, IoCashOutline,
    IoCheckmarkCircle, IoCloseCircle, IoChevronDown
} from 'react-icons/io5';
import api from '../../utils/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const generatePDF = async (r) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const YELLOW = [250, 204, 21];
    const BLACK  = [10, 10, 10];
    const WHITE  = [255, 255, 255];
    const LGRAY  = [180, 180, 180];
    const BGRAY  = [248, 248, 248];

    /* Header */
    doc.setFillColor(...BLACK);
    doc.rect(0, 0, W, 56, 'F');
    doc.setFillColor(...YELLOW);
    doc.rect(0, 0, 6, 56, 'F');

    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('APNA LAKSHAY', 16, 20);

    doc.setTextColor(...YELLOW);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('LIBRARY MANAGEMENT SYSTEM', 16, 28);

    doc.setFillColor(...YELLOW);
    doc.rect(16, 34, 54, 8, 'F');
    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('MONTHLY PERFORMANCE REPORT', 43, 39.6, { align: 'center' });

    /* Student info row */
    doc.setFillColor(...WHITE);
    doc.rect(0, 56, W, 24, 'F');
    doc.setTextColor(...LGRAY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('STUDENT NAME', 14, 63);
    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(r.student.name, 14, 70);

    doc.setTextColor(...LGRAY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('REPORT PERIOD', W - 14, 63, { align: 'right' });
    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${r.monthName} ${r.year}`, W - 14, 70, { align: 'right' });

    /* Yellow stats band */
    doc.setFillColor(...YELLOW);
    doc.rect(0, 80, W, 40, 'F');

    const stats = [
        { label: 'ATTENDANCE', value: `${r.percentage}%` },
        { label: 'DAYS PRESENT', value: `${r.presentDays}/${r.totalDays}` },
        { label: 'STUDY HOURS', value: `${r.totalStudyHours}h ${r.totalStudyMins}m` },
        { label: 'OVERALL RANK', value: r.rank ? `#${r.rank}` : 'N/A' },
    ];
    const colW = W / 4;
    stats.forEach((s, i) => {
        const cx = i * colW + colW / 2;
        doc.setTextColor(...BLACK);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.text(s.label, cx, 90, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(s.value, cx, 112, { align: 'center' });
    });

    /* Fee status */
    const feeY = 126;
    doc.setFillColor(...BGRAY);
    doc.rect(0, feeY, W, 18, 'F');
    doc.setFillColor(...YELLOW);
    doc.rect(0, feeY, 4, 18, 'F');
    doc.setTextColor(...LGRAY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('FEE STATUS', 14, feeY + 6);
    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    if (r.fee) {
        doc.text(`₹${r.fee.amount} — ${r.fee.status.toUpperCase()}`, 14, feeY + 14);
    } else {
        doc.text('No fee record for this month', 14, feeY + 14);
    }

    /* Attendance breakdown table */
    const tableY = 152;
    doc.setFillColor(...BLACK);
    doc.rect(0, tableY, W, 10, 'F');
    doc.setFillColor(...YELLOW);
    doc.rect(0, tableY, 4, 10, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DAILY ATTENDANCE BREAKDOWN', 14, tableY + 7);

    const cols = [{ label: 'DATE', x: 14 }, { label: 'STATUS', x: 70 }, { label: 'ENTRY', x: 110 }, { label: 'EXIT', x: 145 }, { label: 'HOURS', x: 175 }];

    // Column headers
    let rowY = tableY + 16;
    cols.forEach(c => {
        doc.setTextColor(...LGRAY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.text(c.label, c.x, rowY);
    });
    rowY += 5;

    const maxRows = Math.min(r.dailyBreakdown.length, 20);
    r.dailyBreakdown.slice(0, maxRows).forEach((day, i) => {
        const y = rowY + i * 9;
        if (i % 2 === 0) { doc.setFillColor(252, 252, 252); doc.rect(0, y - 5, W, 9, 'F'); }
        doc.setFillColor(...YELLOW);
        doc.rect(0, y - 5, 4, 9, 'F');

        const d = new Date(day.date);
        const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const hrs = Math.floor((day.durationMins || 0) / 60);
        const mins = (day.durationMins || 0) % 60;
        const statusColor = day.status === 'present' ? [22, 163, 74] : [239, 68, 68];

        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(dateStr, cols[0].x, y);
        doc.setTextColor(...statusColor);
        doc.setFont('helvetica', 'bold');
        doc.text(day.status.toUpperCase(), cols[1].x, y);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'normal');
        doc.text(day.entryTime || '—', cols[2].x, y);
        doc.text(day.exitTime  || '—', cols[3].x, y);
        doc.text(day.durationMins > 0 ? `${hrs}h ${mins}m` : '—', cols[4].x, y);
    });

    /* Footer */
    doc.setFillColor(...BLACK);
    doc.rect(0, 268, W, 29, 'F');
    doc.setFillColor(...YELLOW);
    doc.rect(0, 268, W, 3, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Apna Lakshay Library — Monthly Performance Report', W / 2, 280, { align: 'center' });
    doc.setTextColor(...LGRAY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Generated: ${new Date(r.generatedAt).toLocaleString('en-IN')}`, W / 2, 287, { align: 'center' });
    doc.text(`© ${new Date().getFullYear()} Apna Lakshay Library Management System`, W / 2, 293, { align: 'center' });

    doc.save(`Report_${r.monthName}_${r.year}_${r.student.name.replace(/\s/g, '_')}.pdf`);
};

const MonthlyReport = () => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear]   = useState(now.getFullYear());
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => { fetchReport(); }, [month, year]);

    const fetchReport = async () => {
        setLoading(true); setError(null);
        try {
            const res = await api.get(`/student/report?month=${month}&year=${year}`);
            setReport(res.data.report);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load report');
        } finally { setLoading(false); }
    };

    const handleDownload = async () => {
        if (!report) return;
        setDownloading(true);
        try { await generatePDF(report); }
        catch (e) { console.error(e); }
        finally { setDownloading(false); }
    };

    const years = [];
    for (let y = now.getFullYear(); y >= now.getFullYear() - 2; y--) years.push(y);

    const attColor = !report ? '#fff' : report.percentage >= 75 ? '#22c55e' : report.percentage >= 50 ? '#f59e0b' : '#ef4444';

    return (
        <div className="min-h-screen" style={{ background: '#070a10' }}>
            {/* Header */}
            <div className="sticky top-0 z-30 border-b border-white/5" style={{ background: 'rgba(7,10,16,0.9)', backdropFilter: 'blur(16px)' }}>
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/student" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all">
                        <IoArrowBack size={18} />
                    </Link>
                    <h1 className="text-white font-bold text-base flex-1">Monthly Performance Report</h1>
                    <button
                        onClick={handleDownload}
                        disabled={!report || downloading || loading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        style={{ background: '#FACC15', color: '#000' }}
                    >
                        {downloading ? <IoTimeOutline size={14} className="animate-spin" /> : <IoDownloadOutline size={14} />}
                        {downloading ? 'Generating…' : 'Download PDF'}
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
                {/* Month/Year picker */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3">
                    {/* Month */}
                    <div className="relative flex-1">
                        <select value={month} onChange={e => setMonth(Number(e.target.value))}
                            className="w-full appearance-none rounded-xl px-4 py-3 text-white text-sm font-medium pr-9 border border-white/8 focus:outline-none focus:border-yellow-400/40 transition-all cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            {MONTHS.map((m, i) => <option key={i} value={i + 1} style={{ background: '#111' }}>{m}</option>)}
                        </select>
                        <IoChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {/* Year */}
                    <div className="relative">
                        <select value={year} onChange={e => setYear(Number(e.target.value))}
                            className="appearance-none rounded-xl px-4 py-3 text-white text-sm font-medium pr-9 border border-white/8 focus:outline-none focus:border-yellow-400/40 transition-all cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            {years.map(y => <option key={y} value={y} style={{ background: '#111' }}>{y}</option>)}
                        </select>
                        <IoChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </motion.div>

                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 rounded-full border-2 border-yellow-400/30 border-t-yellow-400 animate-spin" />
                    </div>
                )}

                {error && !loading && (
                    <div className="rounded-xl p-4 text-red-400 text-sm border border-red-500/20 bg-red-500/8">{error}</div>
                )}

                {report && !loading && (
                    <>
                        {/* Black header card with yellow accent */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl overflow-hidden border border-white/6">
                            <div className="p-5" style={{ background: '#0d0d0d' }}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1 h-8 rounded-full" style={{ background: '#FACC15' }} />
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Report for</p>
                                        <h2 className="text-white font-black text-lg">{report.monthName} {report.year}</h2>
                                    </div>
                                </div>
                                {/* 4 stat boxes */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { icon: IoCalendarOutline, label: 'Attendance', value: `${report.percentage}%`, color: attColor },
                                        { icon: IoCalendarOutline, label: 'Days Present', value: `${report.presentDays}/${report.totalDays}`, color: '#fff' },
                                        { icon: IoTimeOutline,     label: 'Study Hours', value: `${report.totalStudyHours}h ${report.totalStudyMins}m`, color: '#a78bfa' },
                                        { icon: IoTrophyOutline,   label: 'Overall Rank', value: report.rank ? `#${report.rank}` : 'N/A', color: '#FACC15' },
                                    ].map((s, i) => (
                                        <div key={i} className="rounded-xl p-3 border border-white/6" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                                            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Yellow fee bar */}
                            <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#FACC15' }}>
                                <div className="flex items-center gap-2">
                                    <IoCashOutline size={16} className="text-black" />
                                    <span className="text-black font-bold text-sm">Fee Status</span>
                                </div>
                                {report.fee ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-black font-black">₹{report.fee.amount}</span>
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${report.fee.status === 'paid' ? 'bg-black text-yellow-400' : 'bg-red-600 text-white'}`}>
                                            {report.fee.status.toUpperCase()}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-black/60 text-sm">No record</span>
                                )}
                            </div>
                        </motion.div>

                        {/* Daily breakdown table */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="rounded-2xl overflow-hidden border border-white/6" style={{ background: 'rgba(255,255,255,0.025)' }}>
                            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                                <div className="w-1 h-5 rounded-full" style={{ background: '#FACC15' }} />
                                <h3 className="text-white font-bold text-sm">Daily Breakdown</h3>
                                <span className="ml-auto text-xs text-gray-500">{report.dailyBreakdown.length} records</span>
                            </div>
                            {report.dailyBreakdown.length === 0 ? (
                                <div className="py-10 text-center text-gray-500 text-sm">No attendance records for this month</div>
                            ) : (
                                <div className="divide-y divide-white/4 max-h-96 overflow-y-auto">
                                    {report.dailyBreakdown.map((day, i) => {
                                        const d = new Date(day.date);
                                        const hrs = Math.floor((day.durationMins || 0) / 60);
                                        const mins = (day.durationMins || 0) % 60;
                                        const isPresent = day.status === 'present' || day.status === 'holiday';
                                        return (
                                            <div key={i} className="flex items-center gap-3 px-5 py-3">
                                                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: '#FACC15', opacity: isPresent ? 1 : 0.2 }} />
                                                <div className="min-w-[56px]">
                                                    <p className="text-white text-sm font-bold">{d.getDate()} {MONTHS[d.getMonth()].slice(0,3)}</p>
                                                    <p className="text-gray-500 text-[10px]">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                                                </div>
                                                <div className="flex-1 flex items-center gap-2 flex-wrap">
                                                    {day.entryTime && <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">In {day.entryTime}</span>}
                                                    {day.exitTime  && <span className="text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Out {day.exitTime}</span>}
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    {isPresent ? (
                                                        <IoCheckmarkCircle size={16} className="text-emerald-400 inline" />
                                                    ) : (
                                                        <IoCloseCircle size={16} className="text-red-400 inline" />
                                                    )}
                                                    {day.durationMins > 0 && <p className="text-[10px] text-gray-400 mt-0.5">{hrs}h {mins}m</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MonthlyReport;
