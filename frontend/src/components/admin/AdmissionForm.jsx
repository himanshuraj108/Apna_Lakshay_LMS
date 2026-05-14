import { useRef } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { IoDownloadOutline, IoDocumentTextOutline, IoPrintOutline } from 'react-icons/io5';
import { BASE_URL } from '../../utils/api';

/* ─────────────────────────────────────────────────────────────
   AdmissionForm
   Props:
     profile – full student profile object from /auth/me
   ───────────────────────────────────────────────────────────── */
const AdmissionForm = ({ profile }) => {
    const formRef = useRef(null);

    /* ── derived values ── */
    const name           = profile?.name        || '';
    const fatherName     = profile?.fatherName  || profile?.guardianName || '';
    const motherName     = profile?.motherName  || '';
    const dob            = profile?.dob
        ? new Date(profile.dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
        : '';
    const classDesired   = profile?.classDesired   || profile?.classLevel || '';
    const schoolName     = profile?.schoolName     || '';
    const lastInstitution = profile?.lastInstitution || '';
    const fatherOcc      = profile?.fatherOccupation  || '';
    const motherOcc      = profile?.motherOccupation  || '';
    const permAddress    = profile?.address          || '';
    const tempAddress    = profile?.tempAddress      || '';
    const phone          = profile?.mobile           || '';
    const email          = profile?.email            || '';
    const bloodGroup     = profile?.bloodGroup       || '';
    const allergy        = profile?.allergy          || '';
    const medicalNotes   = profile?.medicalNotes     || '';

    const joinDate       = profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
        : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });

    const profileImgSrc  = profile?.profileImage
        ? (profile.profileImage.startsWith('http') ? profile.profileImage : `${BASE_URL}${profile.profileImage}`)
        : null;

    /* ── download helpers ── */
    const downloadPDF = async () => {
        if (!formRef.current) return;
        const canvas = await html2canvas(formRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        const img = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();
        // make it fill A4 with margins
        const margin = 10;
        const imgW = pdfW - margin * 2;
        const imgH = (canvas.height * imgW) / canvas.width;
        pdf.addImage(img, 'PNG', margin, margin, imgW, Math.min(imgH, pdfH - margin * 2));
        pdf.save(`Admission_Form_${name.replace(/\s+/g, '_')}.pdf`);
    };

    const downloadPNG = async () => {
        if (!formRef.current) return;
        const canvas = await html2canvas(formRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `Admission_Form_${name.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handlePrint = () => {
        const content = formRef.current?.innerHTML;
        const win = window.open('', '', 'width=750,height=1000');
        win.document.write(`
            <html><head>
            <style>
                *{box-sizing:border-box;margin:0;padding:0;}
                body{font-family:'Times New Roman',serif;background:#fff;padding:10mm;}
                @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
            </style>
            </head><body>${content}</body></html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    /* ── helper components (inline styles only — for html2canvas) ── */
    const DotField = ({ value, flex = 1, style = {} }) => (
        <span style={{
            flex,
            borderBottom: '1.5px dotted #1e3a8a',
            display: 'inline-block',
            minWidth: 60,
            paddingBottom: 1,
            fontSize: 12,
            color: '#1e1b4b',
            fontWeight: '600',
            fontStyle: 'italic',
            ...style
        }}>
            {value}&nbsp;
        </span>
    );

    const FieldRow = ({ label, value, children }) => (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, color: '#1e3a8a', fontWeight: '700', whiteSpace: 'nowrap', fontFamily: 'Arial, sans-serif' }}>
                {label}
            </span>
            {children || <DotField value={value} />}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

            {/* ── Action Buttons ── */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25"
                >
                    <IoDocumentTextOutline size={16} /> Download PDF
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={downloadPNG}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/25"
                >
                    <IoDownloadOutline size={16} /> Download Image
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-white/15 border border-white/15 text-gray-700 rounded-xl text-sm font-semibold"
                >
                    <IoPrintOutline size={16} /> Print
                </motion.button>
            </div>

            {/* ── The Printable Form ── */}
            <div
                ref={formRef}
                id="admission-form-preview"
                style={{
                    width: 680,
                    backgroundColor: '#ffffff',
                    border: '2.5px solid #1e3a8a',
                    borderRadius: 4,
                    padding: '16px 18px 18px',
                    fontFamily: "'Times New Roman', Georgia, serif",
                    boxShadow: '0 4px 40px rgba(30,58,138,0.15)',
                    position: 'relative',
                    color: '#1e3a8a',
                }}
            >

                {/* ══════════════════ HEADER ══════════════════ */}
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                    {/* Top row: Director left | Managing right */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 10.5, color: '#1e3a8a', fontFamily: 'Arial,sans-serif', fontWeight: '700' }}>
                            Director.: Mahesh Ray
                        </span>
                        <span style={{ fontSize: 10.5, color: '#1e3a8a', fontFamily: 'Arial,sans-serif', textAlign: 'right' }}>
                            <span style={{ fontWeight: '700' }}>Managing by : D.K.</span>
                            &nbsp;&nbsp;Mob.:9798908881, 6205772574
                        </span>
                    </div>
                    {/* Main title — single line */}
                    <div style={{
                        fontSize: 34,
                        fontWeight: '900',
                        color: '#1e3a8a',
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        lineHeight: 1,
                        fontFamily: 'Arial Black, Arial, sans-serif',
                        whiteSpace: 'nowrap',
                    }}>
                        APNA LAKSHAY LIBRARY
                    </div>
                    <div style={{ fontSize: 12, color: '#1e3a8a', letterSpacing: 3, fontFamily: 'Arial,sans-serif', marginTop: 2 }}>
                        Self Study Point
                    </div>
                </div>

                {/* ── ADMISSION FORM Banner ── */}
                <div style={{
                    background: '#1e3a8a',
                    color: '#ffffff',
                    textAlign: 'center',
                    padding: '5px 0',
                    borderRadius: 3,
                    fontSize: 16,
                    fontWeight: '900',
                    letterSpacing: 4,
                    textTransform: 'uppercase',
                    marginBottom: 12,
                    fontFamily: 'Arial Black, Arial, sans-serif',
                }}>
                    ADMISSION FORM
                </div>

                {/* ══════════════════ MAIN BODY ══════════════════ */}
                <div style={{ display: 'flex', gap: 12 }}>

                    {/* ── Left: form fields ── */}
                    <div style={{ flex: 1 }}>

                        <FieldRow label="Name of Student" value={name} />
                        <FieldRow label="Father's Name" value={fatherName} />
                        <FieldRow label="Mother's Name" value={motherName} />
                        <FieldRow label="Date of Birth" value={dob} />
                        <FieldRow label="Class which admission desired" value={classDesired} />
                        <FieldRow label="School's Name" value={schoolName} />
                        <FieldRow label="Institution the Student was last studying in" value={lastInstitution} />

                        {/* Father + Mother occupation on same line */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 8 }}>
                            <span style={{ fontSize: 11.5, color: '#1e3a8a', fontWeight: '700', whiteSpace: 'nowrap', fontFamily: 'Arial,sans-serif' }}>
                                Father's Occupation
                            </span>
                            <DotField value={fatherOcc} flex={1} />
                            <span style={{ fontSize: 11.5, color: '#1e3a8a', fontWeight: '700', whiteSpace: 'nowrap', fontFamily: 'Arial,sans-serif' }}>
                                Mother's Occupation
                            </span>
                            <DotField value={motherOcc} flex={1} />
                        </div>

                        <FieldRow label="Permanent Address" value={permAddress} />
                        <FieldRow label="Temporary Address" value={tempAddress} />

                        {/* Phone + Email on same line */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 10 }}>
                            <span style={{ fontSize: 11.5, color: '#1e3a8a', fontWeight: '700', whiteSpace: 'nowrap', fontFamily: 'Arial,sans-serif' }}>
                                Phone No.
                            </span>
                            <DotField value={phone} flex={1} />
                            <span style={{ fontSize: 11.5, color: '#1e3a8a', fontWeight: '700', whiteSpace: 'nowrap', fontFamily: 'Arial,sans-serif' }}>
                                Email ID
                            </span>
                            <DotField value={email} flex={1.5} />
                        </div>

                        {/* ── Medical Information Box ── */}
                        <div style={{ border: '2px solid #1e3a8a', borderRadius: 3, padding: '6px 10px', marginBottom: 10 }}>
                            <div style={{
                                display: 'inline-block',
                                background: '#1e3a8a',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: '800',
                                padding: '2px 8px',
                                borderRadius: 2,
                                marginBottom: 6,
                                fontFamily: 'Arial,sans-serif',
                                letterSpacing: 0.5
                            }}>
                                Medical Information :
                            </div>

                            {/* A + B */}
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 11.5, color: '#1e3a8a', fontWeight: '700', whiteSpace: 'nowrap', fontFamily: 'Arial,sans-serif' }}>A. &nbsp;Blood Group</span>
                                <DotField value={bloodGroup} flex={1.5} />
                                <span style={{ fontSize: 11.5, color: '#1e3a8a', fontWeight: '700', whiteSpace: 'nowrap', fontFamily: 'Arial,sans-serif' }}>B. &nbsp;Allergy</span>
                                <DotField value={allergy} flex={1.5} />
                            </div>

                            {/* C */}
                            <div style={{ fontSize: 11, color: '#1e3a8a', fontWeight: '700', marginBottom: 4, fontFamily: 'Arial,sans-serif' }}>
                                C. &nbsp;Any other special or essential information which you want to mention here.
                            </div>
                            <div style={{ borderBottom: '1.5px dotted #1e3a8a', paddingBottom: 2, minHeight: 18, fontSize: 12, fontStyle: 'italic', color: '#1e1b4b', fontWeight: '600' }}>
                                {medicalNotes}&nbsp;
                            </div>
                        </div>

                        {/* ── Declaration ── */}
                        <div style={{
                            border: '1.5px solid #1e3a8a',
                            borderRadius: 3,
                            padding: '8px 10px',
                            fontSize: 11,
                            color: '#1e3a8a',
                            fontFamily: 'Arial,sans-serif',
                            lineHeight: 1.6,
                            marginBottom: 14,
                        }}>
                            <span style={{ borderBottom: '1px dotted #1e3a8a', display: 'inline-block', minWidth: 160 }}>{name}&nbsp;</span>
                            {' '}as hereby declare that all the contents are true and I shall duly obey the rules and regulations of the coaching. If any content would be false, my ward should be expelled without refunding the paid amount. I have gone through the rules &amp; regulations of the institution. I shall abide by them and take stock of ward homework properly.{' '}
                            <span style={{ whiteSpace: 'nowrap' }}>
                                Email ID{' '}
                                <span style={{ borderBottom: '1px dotted #1e3a8a', display: 'inline-block', minWidth: 140, fontStyle: 'italic', fontWeight: '600' }}>{email}&nbsp;</span>
                            </span>
                        </div>

                        {/* ── Signature Section ── */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>

                            {/* Left: Director */}
                            <div style={{ textAlign: 'left', minWidth: 130 }}>
                                <div style={{ fontSize: 11, fontWeight: '700', color: '#1e3a8a', fontFamily: 'Arial,sans-serif', marginBottom: 18 }}>
                                    Sign. of Director
                                </div>
                                <div style={{ borderTop: '1.5px solid #1e3a8a', paddingTop: 3, fontSize: 10.5, color: '#1e3a8a', fontFamily: 'Arial,sans-serif' }}>
                                    Date______________
                                </div>
                            </div>

                            {/* Centre: Others */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 11, fontWeight: '700', color: '#1e3a8a', fontFamily: 'Arial,sans-serif', marginBottom: 18 }}>
                                    Sign. of others
                                </div>
                                <div style={{ borderTop: '1.5px solid #1e3a8a', paddingTop: 3 }}>
                                    <div style={{ fontSize: 10.5, color: '#1e3a8a', fontFamily: 'Arial,sans-serif' }}>Relation______________</div>
                                    <div style={{ fontSize: 10.5, color: '#1e3a8a', fontFamily: 'Arial,sans-serif', marginTop: 4 }}>Date______________</div>
                                </div>
                            </div>

                            {/* Right: Parent */}
                            <div style={{ textAlign: 'right', minWidth: 130 }}>
                                <div style={{ fontSize: 11, fontWeight: '700', color: '#1e3a8a', fontFamily: 'Arial,sans-serif', marginBottom: 18 }}>
                                    Sign. of Parent's
                                </div>
                                <div style={{ borderTop: '1.5px solid #1e3a8a', paddingTop: 3, fontSize: 10.5, color: '#1e3a8a', fontFamily: 'Arial,sans-serif' }}>
                                    Date______________
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Passport Photo box ── */}
                    <div style={{ width: 90, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                        <div style={{
                            width: 86,
                            height: 108,
                            border: '2px solid #1e3a8a',
                            borderRadius: 3,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#eff6ff',
                        }}>
                            {profileImgSrc ? (
                                <img
                                    src={profileImgSrc}
                                    alt={name}
                                    crossOrigin="anonymous"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: 4 }}>
                                    <div style={{ fontSize: 24 }}>📷</div>
                                    <div style={{ fontSize: 9, color: '#1e3a8a', fontFamily: 'Arial,sans-serif', fontWeight: '700', marginTop: 4, lineHeight: 1.3 }}>
                                        Passport<br />Size<br />Photo
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Admission date */}
                        <div style={{ marginTop: 8, fontSize: 9.5, color: '#1e3a8a', fontFamily: 'Arial,sans-serif', textAlign: 'center' }}>
                            <div style={{ fontWeight: '700' }}>Date of Admission</div>
                            <div style={{ fontStyle: 'italic', fontWeight: '600', marginTop: 2 }}>{joinDate}</div>
                        </div>
                    </div>
                </div>

                {/* ── Bottom accent ── */}
                <div style={{
                    height: 5,
                    background: 'linear-gradient(to right, #1e3a8a, #3b82f6, #1e3a8a)',
                    borderRadius: '0 0 3px 3px',
                    marginLeft: -18,
                    marginRight: -18,
                    marginBottom: -4,
                    marginTop: 12,
                }} />
            </div>
        </div>
    );
};

export default AdmissionForm;
