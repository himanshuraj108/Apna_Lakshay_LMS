import { useState } from 'react';
import { motion } from 'framer-motion';
import { IoPersonCircleOutline, IoWarning } from 'react-icons/io5';
import { QRCodeCanvas } from 'qrcode.react';
import { FaWind, FaBan } from 'react-icons/fa';
import useShifts from '../../hooks/useShifts';
import { BASE_URL, getDeterministicAvatar } from '../../utils/api';

/* ─────────────────────────────────────────────────────────────────────────────
   AL  LOGO  — Official brand logo from /public/app-icon-192.png
   light=true  → white circular bg (for dark left band / stripe)
   light=false → plain logo (for white/light surfaces)
─────────────────────────────────────────────────────────────────────────────── */
const ALLogo = ({ size = 40, light = false }) => (
    <div style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22) + 'px',
        overflow: 'hidden',
        background: light ? 'rgba(255,255,255,0.15)' : 'transparent',
        border: light ? '1.5px solid rgba(255,255,255,0.3)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    }}>
        <img
            src="/app-icon-192.png"
            alt="Apna Lakshay"
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
            }}
        />
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   SEAT CHIP PALETTE  (multi-shift)
─────────────────────────────────────────────────────────────────────────────── */
const SEAT_COLORS = [
    { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' },
    { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
    { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4' },
    { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   STATUS THEME
─────────────────────────────────────────────────────────────────────────────── */
const getTheme = (student, isTemporary, isPending) => {
    if (!student.isActive) return {
        headerBg:    'linear-gradient(160deg, #b91c1c 0%, #dc2626 55%, #991b1b 100%)',
        accentColor: '#ef4444',
        accentLight: '#fee2e2',
        accentText:  '#b91c1c',
        statusLabel: 'INACTIVE',
        stripeBg:    'linear-gradient(90deg, #b91c1c 0%, #dc2626 50%, #b91c1c 100%)',
    };
    if (isTemporary) return {
        headerBg:    'linear-gradient(160deg, #92400e 0%, #d97706 55%, #78350f 100%)',
        accentColor: '#f59e0b',
        accentLight: '#fffbeb',
        accentText:  '#92400e',
        statusLabel: 'TEMPORARY',
        stripeBg:    'linear-gradient(90deg, #92400e 0%, #d97706 50%, #92400e 100%)',
    };
    if (isPending) return {
        headerBg:    'linear-gradient(160deg, #854d0e 0%, #ca8a04 55%, #713f12 100%)',
        accentColor: '#eab308',
        accentLight: '#fefce8',
        accentText:  '#854d0e',
        statusLabel: 'PENDING',
        stripeBg:    'linear-gradient(90deg, #854d0e 0%, #ca8a04 50%, #854d0e 100%)',
    };
    return {
        headerBg:    'linear-gradient(160deg, #065f46 0%, #059669 55%, #047857 100%)',
        accentColor: '#10b981',
        accentLight: '#ecfdf5',
        accentText:  '#065f46',
        statusLabel: 'ACTIVE',
        stripeBg:    'linear-gradient(90deg, #065f46 0%, #059669 50%, #065f46 100%)',
    };
};

/* ─────────────────────────────────────────────────────────────────────────────
   BACK OF CARD  — Legal / Notice text (no icons, professional bullet points)
─────────────────────────────────────────────────────────────────────────────── */
const CardBack = ({ theme, studentId, validTillDate, validTillLabel }) => (
    <div
        style={{
            width: '380px',
            height: '240px',
            borderRadius: '14px',
            background: theme.headerBg,
            boxShadow: '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14)',
            border: '1px solid rgba(0,0,0,0.10)',
            overflow: 'hidden',
            fontFamily: "'Inter', -apple-system, sans-serif",
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
        }}
    >
        {/* Subtle dot-grid pattern */}
        <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 0)',
            backgroundSize: '20px 20px',
            pointerEvents: 'none',
        }} />

        {/* Top logo strip */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.18)',
        }}>
            <ALLogo size={28} light />
            <div>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Apna Lakshay
                </div>
                <div style={{ fontSize: '7.5px', fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Library Management System
                </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>ID</div>
                <div style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace', letterSpacing: '0.06em' }}>AL-{studentId}</div>
                <div style={{ fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>{validTillLabel}</div>
                <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace' }}>{validTillDate}</div>
            </div>
        </div>

        {/* Legal notice body */}
        <div style={{ flex: 1, padding: '10px 20px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px', borderLeft: '2px solid rgba(255,255,255,0.5)', paddingLeft: '7px' }}>
                Important Notice
            </div>
            {[
                'This card is the property of Apna Lakshay Library and is issued exclusively to the cardholder named on the front side.',
                'This card is valid only for the period shown and must be carried during all library visits. Validity expires automatically upon membership termination.',
                'This card is strictly non-transferable. Sharing, lending, or allowing any other person to use this card is strictly prohibited.',
                'In the event that this card is lost, stolen, or found, the finder is requested to return it immediately to the Library Administration.',
                'Misuse of this card may result in immediate cancellation of membership and further disciplinary action as deemed fit by the library authority.',
            ].map((line, i) => (
                <div key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '7px',
                    marginBottom: '5px',
                }}>
                    <div style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.7)',
                        marginTop: '4px',
                        flexShrink: 0,
                    }} />
                    <p style={{
                        margin: 0,
                        fontSize: '7px',
                        lineHeight: '1.55',
                        color: 'rgba(255,255,255,0.82)',
                        fontWeight: 500,
                    }}>
                        {line}
                    </p>
                </div>
            ))}
        </div>

        {/* Bottom strip */}
        <div style={{
            background: 'rgba(0,0,0,0.25)',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            padding: '5px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
        }}>
            <span style={{ fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                If found, return to Library Admin - apnalakshay.com
            </span>
            <span style={{ fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em' }}>
                {theme.statusLabel}
            </span>
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN  COMPONENT
─────────────────────────────────────────────────────────────────────────────── */
const StudentIdCard = ({ student }) => {
    const { getShiftName } = useShifts();
    const [flipped, setFlipped] = useState(false);

    const id              = student._id || student.id || '';
    const studentId       = id ? id.slice(-8).toUpperCase() : '--------';
    const verificationUrl = `${window.location.origin}/admin/verify/${id}`;

    const tempAssignments = student.tempAssignments || [];
    const isTemporary     = Boolean(
        student.isTemporary ||
        student.isTemporarySeat ||
        student.seat?.isTemporary ||
        tempAssignments.length > 0
    );

    const firstTemp          = tempAssignments[0];
    const resolvedSeatNumber = student.seat?.number || student.seatNumber || firstTemp?.seat?.number || firstTemp?.seatNumber || null;
    const resolvedRoomId     = student.roomId || student.seat?.room?.roomId || student.seat?.roomId || firstTemp?.seat?.room?.roomId || firstTemp?.room || null;
    const hasSeatAssigned    = Boolean(resolvedSeatNumber);
    const hasShiftAssigned   = Boolean(student.shift || student.shifts?.length > 0 || firstTemp?.shift?.name || firstTemp?.shiftName);
    const isPending          = !isTemporary && (!hasSeatAssigned || !hasShiftAssigned);

    const theme = getTheme(student, isTemporary, isPending);

    const hasAc = student.seat?.roomHasAc || student.seat?.room?.hasAc || student.room?.hasAc || firstTemp?.seat?.room?.hasAc;

    const photoSrc = (() => {
        const img = (!student.profileImage || student.profileImage === '/uploads/avatars/avatar1.svg')
            ? getDeterministicAvatar(id, student.gender)
            : student.profileImage;
        return img.startsWith('http') ? img : `${BASE_URL}${img}`;
    })();

    const getFormattedShift = () => {
        let shiftName = 'Not Assigned';
        if (student.shift && typeof student.shift === 'string') shiftName = student.shift;
        else if (student.shift?.name) shiftName = student.shift.name;
        else if (firstTemp?.shift?.name || firstTemp?.shiftName) shiftName = firstTemp.shift?.name || firstTemp.shiftName;
        else {
            const sv = student.shift?._id || student.shift || student.seat?.shift;
            if (sv) shiftName = getShiftName(sv);
        }
        const s = student.shift?.startTime || student.shiftDetails?.startTime || firstTemp?.shift?.startTime || firstTemp?.startTime;
        const e = student.shift?.endTime   || student.shiftDetails?.endTime   || firstTemp?.shift?.endTime   || firstTemp?.endTime;
        if (s && e) return `${shiftName}  ${s}–${e}`;
        return typeof shiftName === 'string' ? shiftName : 'Not Assigned';
    };

    const joinedDate = (student.admissionDate || student.createdAt)
        ? new Date(student.admissionDate || student.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A';

    /* ── Membership validity — shows live status, not a computed date ── */
    const { validTillDate, validTillLabel } = (() => {
        if (!student.isActive) {
            return { validTillDate: 'Inactive', validTillLabel: 'MEMBERSHIP STATUS' };
        }
        if (isTemporary) {
            return { validTillDate: 'Temporary Access', validTillLabel: 'MEMBERSHIP STATUS' };
        }
        if (isPending) {
            return { validTillDate: 'Pending Approval', validTillLabel: 'MEMBERSHIP STATUS' };
        }
        return { validTillDate: 'Active Membership', validTillLabel: 'MEMBERSHIP STATUS' };
    })();

    /* ── Card dimensions ── */
    const CARD_W = 380;
    const CARD_H = 240;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.38, type: 'spring', stiffness: 145 }}
            style={{ width: CARD_W, height: CARD_H, perspective: '1200px', cursor: 'pointer', position: 'relative' }}
            onClick={() => setFlipped(f => !f)}
            title="Click to flip card"
        >
            <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* ════════════════════════════════════════════════════════════
                    FRONT FACE
                ════════════════════════════════════════════════════════════ */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        borderRadius: '14px',
                        background: '#ffffff',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
                        border: '1px solid rgba(0,0,0,0.07)',
                        overflow: 'hidden',
                        fontFamily: "'Inter', -apple-system, sans-serif",
                    }}
                >
                    {/* Holographic shimmer */}
                    <style>{`
                        @keyframes holoshimmer {
                            0%   { background-position: 250% center; }
                            100% { background-position: -50% center; }
                        }
                        @keyframes flipHint {
                            0%,85%,100% { opacity: 0; transform: translateY(0); }
                            90%  { opacity: 1; transform: translateY(-3px); }
                            95%  { opacity: 0.6; transform: translateY(0); }
                        }
                    `}</style>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.07) 55%, transparent 70%)',
                        backgroundSize: '300% 100%',
                        animation: 'holoshimmer 5s linear infinite',
                        borderRadius: '14px',
                        zIndex: 20,
                        pointerEvents: 'none',
                    }} />

                    {/* ── Left vertical band ── */}
                    <div style={{
                        position: 'absolute',
                        left: 0, top: 0, bottom: 0,
                        width: '54px',
                        background: theme.headerBg,
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 0 10px',
                    }}>
                        {/* AL Logo + brand */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                            <ALLogo size={32} light />
                            <span style={{
                                fontSize: '5.5px',
                                fontWeight: 900,
                                color: 'rgba(255,255,255,0.88)',
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                                lineHeight: 1.3,
                            }}>
                                APNA<br />LAKSHAY
                            </span>
                        </div>

                        {/* Vertical rotated text */}
                        <span style={{
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)',
                            fontSize: '6.5px',
                            fontWeight: 700,
                            color: 'rgba(255,255,255,0.5)',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                        }}>
                            LIBRARY MANAGEMENT SYSTEM
                        </span>

                        {/* Status pill */}
                        <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.28)',
                            borderRadius: '5px',
                            padding: '3px 6px',
                            fontSize: '6px',
                            fontWeight: 900,
                            color: '#ffffff',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}>
                            {theme.statusLabel}
                        </div>
                    </div>

                    {/* ── Photo column ── */}
                    <div style={{
                        position: 'absolute',
                        left: '66px',
                        top: '16px',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}>
                        {/* Photo frame — circular */}
                        <div style={{
                            width: '82px',
                            height: '82px',
                            borderRadius: '50%',
                            border: `3px solid ${theme.accentColor}`,
                            overflow: 'hidden',
                            background: '#f3f4f6',
                            boxShadow: `0 0 0 3px ${theme.accentColor}25, 0 3px 12px ${theme.accentColor}30`,
                            flexShrink: 0,
                        }}>
                            {(student.profileImage || id) ? (
                                <img
                                    src={photoSrc}
                                    alt={student.name}
                                    crossOrigin="anonymous"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                                />
                            ) : (
                                <IoPersonCircleOutline style={{ width: '100%', height: '100%', color: '#9ca3af' }} />
                            )}
                        </div>

                        {/* Gap between photo and QR */}
                        <div style={{ height: '16px' }} />

                        {/* QR code */}
                        <div style={{
                            background: '#ffffff',
                            padding: '4px',
                            borderRadius: '6px',
                            border: `1.5px solid ${theme.accentColor}55`,
                            boxShadow: '0 1px 6px rgba(0,0,0,0.09)',
                        }}>
                            <QRCodeCanvas
                                value={verificationUrl}
                                size={56}
                                level="H"
                                includeMargin={false}
                                fgColor="#111827"
                            />
                        </div>
                    </div>

                    {/* ── Info section ── */}
                    <div style={{
                        position: 'absolute',
                        left: '156px',
                        top: '12px',
                        right: '12px',
                        bottom: '30px',
                        zIndex: 10,
                        overflow: 'hidden',
                    }}>
                        {/* Name */}
                        <div style={{
                            fontSize: '16px',
                            fontWeight: 900,
                            color: '#111827',
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {student.name}
                        </div>

                        {/* Role badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <span style={{
                                fontSize: '8px', fontWeight: 800,
                                color: theme.accentText,
                                background: theme.accentLight,
                                border: `1px solid ${theme.accentColor}`,
                                borderRadius: '4px', padding: '1.5px 6px',
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                            }}>STUDENT</span>
                            {resolvedSeatNumber && (
                                <span style={{
                                    fontSize: '8px', fontWeight: 700,
                                    color: hasAc ? '#1d4ed8' : '#6b7280',
                                    background: hasAc ? '#eff6ff' : '#f9fafb',
                                    border: `1px solid ${hasAc ? '#bfdbfe' : '#e5e7eb'}`,
                                    borderRadius: '4px', padding: '1.5px 6px',
                                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                                }}>
                                    {hasAc ? <FaWind size={7} /> : <FaBan size={7} />}
                                    {hasAc ? 'AC' : 'Non-AC'}
                                </span>
                            )}
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1.5px', background: `linear-gradient(90deg, ${theme.accentColor}, transparent)`, marginBottom: '7px', borderRadius: '2px' }} />

                        {/* Data grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 10px' }}>
                            {/* ID */}
                            <div>
                                <div style={LABEL_STYLE}>ID No.</div>
                                <div style={{ ...VAL_STYLE, fontFamily: 'monospace', fontSize: '10.5px' }}>AL-{studentId}</div>
                            </div>
                            {/* Seat */}
                            <div>
                                <div style={LABEL_STYLE}>{isTemporary ? 'Temp Desk' : (student.seatNumbers?.length > 1 ? 'Desks' : 'Seat No.')}</div>
                                {student.seatNumbers && student.seatNumbers.length > 1 ? (
                                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                                        {[...student.seatNumbers].sort((a, b) => Number(a) - Number(b)).map((sn, i) => {
                                            const c = SEAT_COLORS[i % SEAT_COLORS.length];
                                            return (
                                                <span key={i} style={{ fontSize: '8px', fontWeight: 800, color: c.text, background: c.bg, border: `1px solid ${c.border}`, borderRadius: '3px', padding: '2px 5px' }}>
                                                    {sn}
                                                </span>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ ...VAL_STYLE, color: isTemporary ? '#b45309' : (resolvedSeatNumber ? theme.accentText : '#9ca3af') }}>
                                        {resolvedSeatNumber
                                            ? (resolvedRoomId ? `${resolvedRoomId}-${resolvedSeatNumber}` : resolvedSeatNumber)
                                            : 'N/A'}
                                    </div>
                                )}
                            </div>
                            {/* Mobile */}
                            <div>
                                <div style={LABEL_STYLE}>Mobile</div>
                                <div style={{ ...VAL_STYLE, fontFamily: 'monospace', fontSize: '9.5px' }}>{student.mobile || '----------'}</div>
                            </div>
                            {/* Gender */}
                            <div>
                                <div style={LABEL_STYLE}>Gender</div>
                                <div style={{ ...VAL_STYLE, textTransform: 'capitalize' }}>{student.gender || 'Male'}</div>
                            </div>
                            {/* Issued */}
                            <div>
                                <div style={LABEL_STYLE}>Issued</div>
                                <div style={{ ...VAL_STYLE, fontSize: '9px' }}>{joinedDate}</div>
                            </div>
                            {/* Valid Till Membership */}
                            <div>
                                <div style={LABEL_STYLE}>{validTillLabel}</div>
                                <div style={{ ...VAL_STYLE, color: theme.accentText, fontWeight: 900, fontSize: '9px' }}>{validTillDate}</div>
                            </div>

                            {/* Shift — full width */}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ ...LABEL_STYLE, marginBottom: '3px' }}>Shift</div>
                                {student.shifts && student.shifts.length > 0 ? (
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {[...student.shifts].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')).map((s, i) => {
                                            const c = SEAT_COLORS[i % SEAT_COLORS.length];
                                            return (
                                                <span key={i} style={{
                                                    fontSize: '8px', fontWeight: 800,
                                                    color: c.text, background: c.bg,
                                                    border: `1px solid ${c.border}`,
                                                    borderRadius: '3px', padding: '2px 6px',
                                                }}>
                                                    {s.name}{s.startTime && s.endTime ? ` ${s.startTime}–${s.endTime}` : ''}
                                                </span>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{
                                        fontSize: '9px', fontWeight: 700,
                                        color: resolvedSeatNumber ? theme.accentText : '#9ca3af',
                                        background: resolvedSeatNumber ? theme.accentLight : '#f9fafb',
                                        border: `1px solid ${resolvedSeatNumber ? theme.accentColor : '#e5e7eb'}`,
                                        borderRadius: '4px', padding: '2px 7px',
                                        display: 'inline-block',
                                        maxWidth: '100%', overflow: 'hidden',
                                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {getFormattedShift()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Address */}
                        {student.address && (
                            <div style={{ marginTop: '4px', fontSize: '7.5px', color: '#6b7280', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {student.address}
                            </div>
                        )}

                        {/* Temp warnings */}
                        {tempAssignments.length > 0 && (
                            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '2px 6px' }}>
                                <IoWarning size={9} color="#dc2626" />
                                <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#b91c1c' }}>
                                    Temp: {tempAssignments.map(ta => ta.seat?.number || '?').join(', ')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ── Magnetic stripe (bottom) ── */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: '28px',
                        background: theme.stripeBg,
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '62px',
                        paddingRight: '14px',
                        justifyContent: 'space-between',
                    }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 35%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.1) 65%, transparent 100%)',
                            pointerEvents: 'none',
                        }} />
                        <span style={{ fontSize: '7px', fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace', zIndex: 2 }}>
                            apnalakshay.com  |  ID: AL-{studentId}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', zIndex: 2 }}>
                            <ALLogo size={15} light />
                            <span style={{ fontSize: '7px', fontWeight: 900, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                APNA LAKSHAY
                            </span>
                        </div>
                    </div>

                    {/* Flip hint label */}
                    <div style={{
                        position: 'absolute', top: '8px', right: '10px',
                        fontSize: '6px', fontWeight: 700, color: '#9ca3af',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        zIndex: 15, animation: 'flipHint 6s ease-in-out infinite',
                    }}>
                        click to flip
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════
                    BACK FACE
                ════════════════════════════════════════════════════════════ */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                }}>
                    <CardBack theme={theme} studentId={studentId} validTillDate={validTillDate} validTillLabel={validTillLabel} />
                </div>
            </motion.div>
        </motion.div>
    );
};

/* ─── Small style objects (avoids repetition) ─────────────────────────────── */
const LABEL_STYLE = {
    fontSize: '7px',
    fontWeight: 700,
    color: '#6b7280',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '1.5px',
};

const VAL_STYLE = {
    fontSize: '10px',
    fontWeight: 800,
    color: '#111827',
    lineHeight: 1.2,
};

export default StudentIdCard;
