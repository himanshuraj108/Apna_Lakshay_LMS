import { useRef } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { IoDownloadOutline, IoDocumentTextOutline, IoPrintOutline } from 'react-icons/io5';

/* ─────────────────────────────────────────────────────────────
   PaymentReceipt  —  exact replica of Apna Lakshya Library
                       physical payment receipt (English)
   Props:
     student  – student object
     fee      – fee object { amount, status, paidDate, dueDate,
                             cycleStart, cycleEnd, registrationFee?,
                             due?, lockerNo? }
     slNo     – serial number (e.g. 205)
   ───────────────────────────────────────────────────────────── */
const PaymentReceipt = ({ student, fee, slNo = 1 }) => {
    const receiptRef = useRef(null);

    /* ── Derived values ── */
    const name       = student?.name      || '';
    const fatherName = student?.fatherName || student?.guardianName || '';
    const mobile     = student?.mobile    || '';
    const aadharNo   = student?.aadharNo  || student?.idNumber || '';
    const address    = student?.address   || '';
    const dob        = student?.dob
        ? new Date(student.dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
        : '';
    const seatNo     = student?.seat?.number || student?.seatNumber || '';
    const shiftName  = (() => {
        if (student?.shift?.name) return student.shift.name;
        if (typeof student?.shift === 'string') return student.shift;
        if (student?.shiftName) return student.shiftName;
        return 'Full Shift';
    })();
    const lockerNo   = fee?.lockerNo || student?.lockerNo || '';

    const paidDate   = fee?.paidDate
        ? new Date(fee.paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
        : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });

    const monthlyFee      = fee?.amount          || 0;
    const registrationFee = fee?.registrationFee || 0;
    const due             = fee?.due             || 0;
    const total           = monthlyFee + registrationFee - due;
    const isPaid          = fee?.status === 'paid';

    /* ── Download/Print helpers ── */
    const downloadPDF = async () => {
        if (!receiptRef.current) return;
        const canvas = await html2canvas(receiptRef.current, { scale: 3, useCORS: true, backgroundColor: '#fef9f0' });
        const img = canvas.toDataURL('image/png');
        // receipt is landscape ~ 3.35" x 2.1"
        const pdf = new jsPDF('landscape', 'mm', [90, 56]);
        pdf.addImage(img, 'PNG', 0, 0, 90, 56);
        pdf.save(`Receipt_${slNo}_${name.replace(/\s+/g, '_')}.pdf`);
    };

    const downloadPNG = async () => {
        if (!receiptRef.current) return;
        const canvas = await html2canvas(receiptRef.current, { scale: 3, useCORS: true, backgroundColor: '#fef9f0' });
        const link = document.createElement('a');
        link.download = `Receipt_${slNo}_${name.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handlePrint = () => {
        const win = window.open('', '', 'width=700,height=500');
        win.document.write(`<html><head><style>
            *{box-sizing:border-box;margin:0;padding:0;}
            body{font-family:Georgia,serif;background:#fef9f0;padding:8px;}
            @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
        </style></head><body>${receiptRef.current?.innerHTML}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 300);
    };

    /* ── Inline-style constants ── */
    const RED    = '#b91c1c';
    const CREAM  = '#fef9f0';
    const DARK   = '#1c1917';
    const FADED  = '#7f1d1d';

    const dotLine = {
        borderBottom: `1.5px dotted ${RED}`,
        display: 'inline-block',
        minWidth: 60,
        paddingBottom: 1,
        flex: 1,
        fontSize: 10,
        fontWeight: '700',
        color: DARK,
        fontStyle: 'italic',
    };

    const labelStyle = {
        fontSize: 9,
        color: FADED,
        fontFamily: 'Arial,sans-serif',
        whiteSpace: 'nowrap',
        letterSpacing: 0.2,
    };

    const FieldRow = ({ label, value }) => (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 5 }}>
            <span style={labelStyle}>{label}</span>
            <span style={{ ...dotLine }}>{value}&nbsp;</span>
        </div>
    );

    const DualField = ({ l1, v1, l2, v2 }) => (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 5 }}>
            <span style={labelStyle}>{l1}</span>
            <span style={{ ...dotLine }}>{v1}&nbsp;</span>
            <span style={labelStyle}>{l2}</span>
            <span style={{ ...dotLine }}>{v2}&nbsp;</span>
        </div>
    );

    const FeeBox = ({ label, value, highlight }) => (
        <div style={{
            flex: 1,
            border: `1.5px solid ${highlight ? RED : '#d4b8a0'}`,
            borderRadius: 3,
            padding: '3px 5px',
            textAlign: 'center',
            backgroundColor: highlight ? '#fee2e2' : 'transparent',
        }}>
            <div style={{ fontSize: 7.5, color: highlight ? RED : '#78716c', fontFamily: 'Arial,sans-serif', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: highlight ? 13 : 10, fontWeight: '800', color: highlight ? RED : DARK, fontFamily: 'Arial,sans-serif' }}>{value}</div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

            {/* ── Action Buttons ── */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={downloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl text-sm font-bold shadow-lg">
                    <IoDocumentTextOutline size={15} /> Download PDF
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={downloadPNG}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg">
                    <IoDownloadOutline size={15} /> Download Image
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-white/15 border border-white/15 text-gray-700 rounded-xl text-sm font-semibold">
                    <IoPrintOutline size={15} /> Print
                </motion.button>
            </div>

            {/* ════════════════════════════
                RECEIPT (matches physical)
                ════════════════════════════ */}
            <div
                ref={receiptRef}
                id="payment-receipt-preview"
                style={{
                    width: 400,
                    backgroundColor: CREAM,
                    border: `3px solid ${RED}`,
                    borderRadius: 6,
                    overflow: 'hidden',
                    fontFamily: 'Georgia, serif',
                    boxShadow: '0 8px 40px rgba(185,28,28,0.2)',
                }}
            >
                {/* ── TOP HEADER ── */}
                <div style={{
                    background: CREAM,
                    borderBottom: `2px solid ${RED}`,
                    padding: '10px 14px 7px',
                    textAlign: 'center',
                }}>
                    {/* Director & Managing side by side */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: FADED, fontFamily: 'Arial,sans-serif', marginBottom: 3 }}>
                        <span style={{ fontWeight: '700' }}>Director.: Mahesh Ray</span>
                        <span>Managing by : D.K. &nbsp; Mob.:9798908881, 6205772574</span>
                    </div>
                    {/* Library name — big, single line */}
                    <div style={{
                        fontSize: 24,
                        fontWeight: '900',
                        color: RED,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        lineHeight: 1,
                        fontFamily: 'Arial Black, Arial, sans-serif',
                    }}>
                        Apna Lakshya Library
                    </div>
                    <div style={{ fontSize: 10, color: RED, letterSpacing: 2, fontFamily: 'Arial,sans-serif', marginTop: 2, fontWeight: '700' }}>
                        Self Study Point
                    </div>
                    <div style={{ height: 1.5, background: `linear-gradient(to right, transparent, ${RED}, transparent)`, marginTop: 5 }} />
                </div>

                {/* ── BODY ── */}
                <div style={{ padding: '10px 14px 12px' }}>

                    {/* Sl.No + PAID + Date row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 9, color: FADED, fontFamily: 'Arial,sans-serif' }}>Sl. No.</span>
                            <span style={{ fontSize: 18, fontWeight: '900', color: RED, fontFamily: 'Arial Black, sans-serif' }}>{slNo}</span>
                        </div>

                        {isPaid && (
                            <div style={{
                                border: `2px solid #15803d`,
                                color: '#15803d',
                                padding: '1px 8px',
                                borderRadius: 3,
                                fontSize: 9,
                                fontWeight: '900',
                                letterSpacing: 2,
                                textTransform: 'uppercase',
                                transform: 'rotate(-8deg)',
                                fontFamily: 'Arial,sans-serif',
                            }}>PAID</div>
                        )}

                        <div>
                            <span style={{ fontSize: 9, color: FADED, fontFamily: 'Arial,sans-serif' }}>Date </span>
                            <span style={{ fontSize: 10, fontWeight: '700', color: DARK }}>{paidDate}</span>
                        </div>
                    </div>

                    {/* Dotted separator */}
                    <div style={{ borderTop: `1.5px dotted ${RED}`, marginBottom: 7 }} />

                    {/* Fields */}
                    <FieldRow label="Name" value={name} />
                    <FieldRow label="Father's Name" value={fatherName} />
                    <DualField l1="DOB" v1={dob} l2="Seat No." v2={seatNo} />
                    <DualField l1="Mobile No." v1={mobile} l2="Shift" v2={shiftName} />
                    <FieldRow label="Adhar No." value={aadharNo} />
                    <FieldRow label="Address" value={address} />

                    {/* Locker + Registration Fee */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, marginTop: 4 }}>
                        <div style={{ flex: 1, border: `1.5px solid ${RED}`, borderRadius: 3, padding: '3px 6px' }}>
                            <div style={{ fontSize: 7.5, color: FADED, fontFamily: 'Arial,sans-serif' }}>Registration Fee</div>
                            <div style={{ borderBottom: `1px dotted ${RED}`, minHeight: 14, fontSize: 10, fontWeight: '700', color: DARK }}>
                                {registrationFee > 0 ? `₹${registrationFee}` : ''}&nbsp;
                            </div>
                        </div>
                        <div style={{ flex: 1, border: `1.5px solid ${RED}`, borderRadius: 3, padding: '3px 6px' }}>
                            <div style={{ fontSize: 7.5, color: FADED, fontFamily: 'Arial,sans-serif' }}>Locker No.</div>
                            <div style={{ borderBottom: `1px dotted ${RED}`, minHeight: 14, fontSize: 10, fontWeight: '700', color: DARK }}>
                                {lockerNo}&nbsp;
                            </div>
                        </div>
                    </div>

                    {/* Fee boxes */}
                    <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                        <FeeBox label="Monthly Fee" value={monthlyFee > 0 ? `₹${monthlyFee}` : '—'} />
                        <FeeBox label="Due" value={due > 0 ? `₹${due}` : '—'} />
                        <FeeBox label="Total" value={`₹${total}`} highlight />
                    </div>

                    {/* Footer */}
                    <div style={{ borderTop: `1.5px solid ${RED}`, paddingTop: 7, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: 8, color: FADED, fontFamily: 'Arial,sans-serif', fontStyle: 'italic' }}>Director:</div>
                            <div style={{ fontSize: 11, fontWeight: '800', color: DARK, fontFamily: 'Arial,sans-serif' }}>Mahesh Ray</div>
                        </div>
                        <div style={{
                            background: RED,
                            color: '#fff',
                            borderRadius: 3,
                            padding: '4px 8px',
                            textAlign: 'right',
                            fontSize: 8,
                            fontFamily: 'Arial,sans-serif',
                            lineHeight: 1.6,
                        }}>
                            <div style={{ fontWeight: '700' }}>Managing by : D.K.</div>
                            <div>Mob.:9798908881</div>
                            <div>6205772574</div>
                            <div style={{ marginTop: 2, fontStyle: 'italic', fontSize: 7 }}>Near Nahar, Sitamarhi</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentReceipt;
