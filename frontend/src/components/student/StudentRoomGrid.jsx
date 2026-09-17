import React from 'react';
import { motion } from 'framer-motion';
import {
    IoBedOutline, IoSnowOutline, IoLogInOutline,
    IoCheckmarkCircle, IoTimeOutline, IoCloseCircle
} from 'react-icons/io5';
import useShifts from '../../hooks/useShifts';

const StudentRoomGrid = ({ room, onSeatClick, highlightSeatId, useDisplayOccupied = false }) => {
    const doorPosition = room.doorPosition || 'south';
    const { shifts } = useShifts();

    // Group seats by wall and sort by position index
    const northSeats = room.seats.filter(s => s.position?.wall === 'north').sort((a, b) => (a.position?.index || 0) - (b.position?.index || 0));
    const eastSeats = room.seats.filter(s => s.position?.wall === 'east').sort((a, b) => (a.position?.index || 0) - (b.position?.index || 0));
    const southSeats = room.seats.filter(s => s.position?.wall === 'south').sort((a, b) => (a.position?.index || 0) - (b.position?.index || 0));
    const westSeats = room.seats.filter(s => s.position?.wall === 'west').sort((a, b) => (a.position?.index || 0) - (b.position?.index || 0));

    const totalSeats = room.seats.length;
    const hasAc = room.hasAc || false;
    const acPosition = room.acPosition || 'north';

    // ── Realistic Wall-Mounted AC Unit ──────────────────────────────────────
    const AcMachine = ({ wall }) => {
        if (!hasAc || acPosition !== wall) return null;
        const isH = wall === 'north' || wall === 'south';
        const fromStart = wall === 'north' || wall === 'west';
        const W = isH ? 130 : 26;
        const H = isH ? 26 : 90;

        const pos = {
            north: { position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', zIndex: 40 },
            south: { position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', zIndex: 40 },
            east:  { position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', zIndex: 40 },
            west:  { position: 'absolute', left: 6,  top: '50%', transform: 'translateY(-50%)', zIndex: 40 },
        }[wall];

        return (
            <div style={{ ...pos, pointerEvents: 'none' }}>
                <div
                    style={{
                        width: W,
                        height: H,
                        background: 'linear-gradient(175deg, #F0F9FF 0%, #E0F2FE 40%, #BAE6FD 100%)',
                        borderRadius: 6,
                        border: '1.5px solid #7DD3FC',
                        boxShadow: '0 2px 10px rgba(14, 165, 233, 0.25), inset 0 1px 1px rgba(255,255,255,0.8)',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {/* Grille lines */}
                    <div style={{ position: 'absolute', inset: '4px 8px', display: 'flex', flexDirection: isH ? 'column' : 'row', gap: 2, opacity: 0.35 }}>
                        {[...Array(isH ? 3 : 5)].map((_, i) => (
                            <div key={i} style={{ flex: 1, background: '#0284C7', borderRadius: 1 }} />
                        ))}
                    </div>

                    {/* Status LED & Temp */}
                    <div className="flex items-center gap-1.5 z-10 px-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
                        {isH && (
                            <span className="text-[9px] font-black font-mono text-sky-900 tracking-wider">
                                18°C
                            </span>
                        )}
                    </div>
                </div>

                {/* Gentle cold air waves */}
                {[0, 1].map(i => {
                    const drift = (i + 1) * 16;
                    const anim = isH
                        ? { y: fromStart ? [0, drift] : [0, -drift], opacity: [0.5, 0] }
                        : { x: fromStart ? [0, -drift] : [0, drift], opacity: [0.5, 0] };
                    return (
                        <motion.div
                            key={i}
                            style={{
                                position: 'absolute',
                                ...(isH
                                    ? { left: '15%', right: '15%', height: 2, top: fromStart ? H + 2 : 'auto', bottom: fromStart ? 'auto' : H + 2 }
                                    : { top: '15%', bottom: '15%', width: 2, left: fromStart ? 'auto' : H + 2, right: fromStart ? H + 2 : 'auto' }),
                                background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.4), transparent)',
                                borderRadius: 4,
                            }}
                            animate={anim}
                            transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.6, ease: 'easeOut' }}
                        />
                    );
                })}
            </div>
        );
    };

    // ── Ceiling Fan Overlay ──────────────────────────────────────────────────
    const CeilingFan = () => {
        if (!room.hasFan) return null;

        return (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.28] mix-blend-multiply z-20">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.28, ease: 'linear' }}
                    className="relative w-28 h-28 flex items-center justify-center"
                >
                    {/* Center motor */}
                    <div className="absolute w-5 h-5 rounded-full bg-slate-700 border border-slate-900 z-10 shadow-md inset-0 m-auto" />

                    {/* 3 Blades */}
                    {[0, 120, 240].map((deg) => (
                        <div
                            key={deg}
                            className="absolute left-[calc(50%-3px)] bottom-1/2 w-1.5 h-[50px] origin-bottom"
                            style={{ transform: `rotate(${deg}deg)` }}
                        >
                            <div className="w-[28px] h-[50px] -ml-[11px] bg-gradient-to-t from-slate-600/70 to-slate-400/20 rounded-t-[100%] rounded-b-[40%]" />
                        </div>
                    ))}
                </motion.div>
                {/* Soft fan shadow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-[8px] border-slate-400/15 blur-[2px]" />
            </div>
        );
    };

    // ── Whole-Room Air Flow Overlay ─────────────────────────────────────────
    const AcAirFlow = () => {
        if (!hasAc) return null;
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-15 rounded-[22px]">
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse at center top, rgba(224, 242, 254, 0.25) 0%, transparent 70%)',
                    }}
                />
            </div>
        );
    };

    // ── Seat Card Component ─────────────────────────────────────────────────
    const SeatCard = ({ seat }) => {
        const isHighlighted = seat._id === highlightSeatId;

        // Status determination logic (preserved 100%)
        let statusColor = 'green';

        if (useDisplayOccupied) {
            statusColor = seat.displayOccupied ? 'red' : 'green';
        } else {
            if (shifts && shifts.length > 0) {
                const isFullyOccupied = shifts.every(shift => {
                    const doTimeRangesOverlap = (start1, end1, start2, end2) => {
                        if (!start1 || !end1 || !start2 || !end2) return false;
                        const timeToMinutes = (time) => {
                            const [hours, minutes] = time.split(':').map(Number);
                            return hours * 60 + minutes;
                        };
                        const s1 = timeToMinutes(start1);
                        const e1 = timeToMinutes(end1);
                        const s2 = timeToMinutes(start2);
                        const e2 = timeToMinutes(end2);
                        return s1 < e2 && s2 < e1;
                    };

                    const isOverlapOccupied = seat.assignments?.some(assignment => {
                        if (assignment.status !== 'active' || !assignment.shift) return false;
                        return doTimeRangesOverlap(
                            shift.startTime,
                            shift.endTime,
                            assignment.shift.startTime,
                            assignment.shift.endTime
                        );
                    });

                    const isFullDay = shift.id === 'full' ||
                        shift.legacyName === 'full_day' ||
                        (shift.name && shift.name.toLowerCase().includes('full'));

                    const isPartiallyBooked = seat.assignments && seat.assignments.length > 0;
                    const isDirectlyBooked = seat.isFullyBlocked ||
                        (seat.activeShifts && seat.activeShifts.some(s => s === shift.id || s === shift.legacyName));

                    return isDirectlyBooked || isOverlapOccupied || (isFullDay && isPartiallyBooked);
                });

                statusColor = isFullyOccupied ? 'red' : (seat.activeShifts && seat.activeShifts.length > 0 ? 'orange' : 'green');
            } else if (seat.isOccupied || seat.status === 'occupied') {
                statusColor = 'red';
            }
        }

        const styles = {
            green: {
                bg: '#F0FDF4',
                border: '#86EFAC',
                text: '#15803D',
                dot: '#22C55E',
                hoverBg: '#DCFCE7',
                hoverBorder: '#4ADE80',
            },
            orange: {
                bg: '#FFFBEB',
                border: '#FCD34D',
                text: '#B45309',
                dot: '#F59E0B',
                hoverBg: '#FEF3C7',
                hoverBorder: '#FBBF24',
            },
            red: {
                bg: '#FEF2F2',
                border: '#FECACA',
                text: '#B91C1C',
                dot: '#EF4444',
                hoverBg: '#FEE2E2',
                hoverBorder: '#F87171',
            },
        }[statusColor];

        return (
            <motion.button
                whileHover={{ scale: 1.07, y: -2 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => onSeatClick && onSeatClick(seat)}
                className={`relative px-2.5 py-2 rounded-xl transition-all cursor-pointer min-w-[54px] flex flex-col items-center justify-center gap-0.5 shadow-2xs border ${
                    isHighlighted
                        ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-white shadow-md'
                        : ''
                }`}
                style={
                    isHighlighted
                        ? {
                              background: '#FFF7ED',
                              borderColor: '#F97316',
                              color: '#EA580C',
                              boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
                          }
                        : {
                              background: styles.bg,
                              borderColor: styles.border,
                              color: styles.text,
                          }
                }
            >
                {/* Desk Icon + Number */}
                <div className="flex items-center gap-1">
                    <IoBedOutline size={13} className="shrink-0 opacity-80" />
                    <span className="font-extrabold text-xs tracking-tight">
                        {seat.number}
                    </span>
                </div>

                {/* Status Dot */}
                <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: isHighlighted ? '#EA580C' : styles.dot }}
                />

                {/* Highlight Pulse */}
                {isHighlighted && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
                    </span>
                )}
            </motion.button>
        );
    };

    // ── Architectural Door Threshold ────────────────────────────────────────
    const DoorOpening = ({ label = 'ENTRY / EXIT', orientation = 'horizontal' }) => {
        return (
            <div
                className={`flex items-center justify-center select-none ${
                    orientation === 'horizontal' ? 'px-4 py-1.5' : 'py-4 px-1.5'
                }`}
            >
                <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-2xs"
                    style={{
                        background: '#FFFBEB',
                        borderColor: '#FDE68A',
                        color: '#92400E',
                    }}
                >
                    <IoLogInOutline size={13} className="text-amber-600 shrink-0" />
                    <span className="text-[10px] font-black tracking-widest uppercase whitespace-nowrap">
                        {label}
                    </span>
                </div>
            </div>
        );
    };

    // Count states for legend
    const availableCount = room.seats.filter(s => {
        if (useDisplayOccupied) return !s.displayOccupied;
        return !s.isOccupied;
    }).length;

    return (
        <div className="space-y-4" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
            {/* ── Main Architectural Room Container ── */}
            <div
                className="relative w-full max-w-4xl mx-auto rounded-3xl p-5 sm:p-7 border"
                style={{
                    background: '#FCFBF9',
                    borderColor: '#E2DCD5',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.02), 0 6px 24px rgba(180,120,60,0.06)',
                }}
            >
                {/* Floor Blueprint Grid Texture */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-3xl"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(140,110,80,0.05) 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                    }}
                />

                {/* Whole room AC cool air */}
                {hasAc && <AcAirFlow />}

                {/* Wall-Mounted AC Units */}
                <AcMachine wall="north" />
                <AcMachine wall="south" />
                <AcMachine wall="east" />
                <AcMachine wall="west" />

                {/* Ceiling Fan in Room Center */}
                {room.hasFan && <CeilingFan />}

                {/* ── Outer Perimeter Box Wall ── */}
                <div
                    className="relative w-full min-h-[380px] sm:min-h-[440px] rounded-2xl flex flex-col justify-between border-[2.5px] p-3 sm:p-4 overflow-hidden"
                    style={{
                        borderColor: '#CBD5E1',
                        background: '#FFFFFF',
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.8), 0 2px 10px rgba(0,0,0,0.03)',
                    }}
                >
                    {/* ═══ 1. NORTH WALL (TOP) ═══ */}
                    <div className="w-full min-h-[64px] flex items-center justify-center px-4 py-2 border-b border-slate-100 relative z-30">
                        {doorPosition === 'north' ? (
                            <div className="w-full flex items-center justify-between gap-4 flex-wrap">
                                {/* Left seats */}
                                <div className="flex items-center gap-2 flex-wrap justify-start flex-1">
                                    {northSeats.slice(0, Math.ceil(northSeats.length / 2)).map(seat => (
                                        <SeatCard key={seat._id} seat={seat} />
                                    ))}
                                </div>
                                {/* Center Door */}
                                <DoorOpening />
                                {/* Right seats */}
                                <div className="flex items-center gap-2 flex-wrap justify-end flex-1">
                                    {northSeats.slice(Math.ceil(northSeats.length / 2)).map(seat => (
                                        <SeatCard key={seat._id} seat={seat} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full flex items-center justify-center gap-2.5 flex-wrap">
                                {northSeats.length > 0 ? (
                                    northSeats.map(seat => <SeatCard key={seat._id} seat={seat} />)
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                        North Wall
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ═══ 2. MIDDLE ZONE: WEST WALL, CENTER AISLE, EAST WALL ═══ */}
                    <div className="w-full flex-1 flex items-stretch justify-between my-2 relative z-25 min-h-[220px]">
                        {/* West Wall (Left) */}
                        <div
                            className="w-[74px] sm:w-[84px] border-r border-slate-100 flex flex-col items-center justify-center p-1.5 relative"
                            style={{ background: 'rgba(248, 250, 252, 0.4)' }}
                        >
                            {doorPosition === 'west' ? (
                                <div className="h-full flex flex-col items-center justify-between py-2 gap-2">
                                    <div className="flex flex-col gap-2 items-center">
                                        {westSeats.slice(0, Math.ceil(westSeats.length / 2)).map(seat => (
                                            <SeatCard key={seat._id} seat={seat} />
                                        ))}
                                    </div>
                                    <DoorOpening orientation="vertical" />
                                    <div className="flex flex-col gap-2 items-center">
                                        {westSeats.slice(Math.ceil(westSeats.length / 2)).map(seat => (
                                            <SeatCard key={seat._id} seat={seat} />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col gap-2 items-center justify-center overflow-y-auto scrollbar-none py-1">
                                    {westSeats.length > 0 ? (
                                        westSeats.map(seat => <SeatCard key={seat._id} seat={seat} />)
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">
                                            West Wall
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Central Aisle / Open Study Space */}
                        <div className="flex-1 flex flex-col items-center justify-center p-4 relative pointer-events-none">
                            <div
                                className="px-3.5 py-1.5 rounded-full border text-[11px] font-semibold text-slate-400 select-none flex items-center gap-2"
                                style={{
                                    background: 'rgba(248, 250, 252, 0.7)',
                                    borderColor: '#E2E8F0',
                                }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span>Quiet Study Area · Walking Aisle</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            </div>
                        </div>

                        {/* East Wall (Right) */}
                        <div
                            className="w-[74px] sm:w-[84px] border-l border-slate-100 flex flex-col items-center justify-center p-1.5 relative"
                            style={{ background: 'rgba(248, 250, 252, 0.4)' }}
                        >
                            {doorPosition === 'east' ? (
                                <div className="h-full flex flex-col items-center justify-between py-2 gap-2">
                                    <div className="flex flex-col gap-2 items-center">
                                        {eastSeats.slice(0, Math.ceil(eastSeats.length / 2)).map(seat => (
                                            <SeatCard key={seat._id} seat={seat} />
                                        ))}
                                    </div>
                                    <DoorOpening orientation="vertical" />
                                    <div className="flex flex-col gap-2 items-center">
                                        {eastSeats.slice(Math.ceil(eastSeats.length / 2)).map(seat => (
                                            <SeatCard key={seat._id} seat={seat} />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col gap-2 items-center justify-center overflow-y-auto scrollbar-none py-1">
                                    {eastSeats.length > 0 ? (
                                        eastSeats.map(seat => <SeatCard key={seat._id} seat={seat} />)
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest [writing-mode:vertical-lr]">
                                            East Wall
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ═══ 3. SOUTH WALL (BOTTOM) — Seamless & Clean ═══ */}
                    <div className="w-full min-h-[64px] flex items-center justify-center px-4 py-2 border-t border-slate-100 relative z-30">
                        {doorPosition === 'south' ? (
                            <div className="w-full flex items-center justify-between gap-4 flex-wrap">
                                {/* Left seats (if any) */}
                                <div className="flex items-center gap-2 flex-wrap justify-start flex-1">
                                    {southSeats.slice(0, Math.ceil(southSeats.length / 2)).map(seat => (
                                        <SeatCard key={seat._id} seat={seat} />
                                    ))}
                                </div>
                                {/* Center Door Opening */}
                                <DoorOpening />
                                {/* Right seats (if any) */}
                                <div className="flex items-center gap-2 flex-wrap justify-end flex-1">
                                    {southSeats.slice(Math.ceil(southSeats.length / 2)).map(seat => (
                                        <SeatCard key={seat._id} seat={seat} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full flex items-center justify-center gap-2.5 flex-wrap">
                                {southSeats.length > 0 ? (
                                    southSeats.map(seat => <SeatCard key={seat._id} seat={seat} />)
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                        South Wall
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Interactive Modern Legend ── */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-xs">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
                        <span className="font-bold">Available ({availableCount})</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
                        <span className="font-bold">Partially Booked</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs" />
                        <span className="font-bold">Occupied ({totalSeats - availableCount})</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                        <span className="text-amber-600 font-extrabold text-[10px]">DOOR</span>
                        <span className="font-medium">Entry / Exit</span>
                    </div>
                    {hasAc && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800">
                            <IoSnowOutline size={14} className="text-sky-600" />
                            <span className="font-semibold">AC • {acPosition.toUpperCase()}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentRoomGrid;
