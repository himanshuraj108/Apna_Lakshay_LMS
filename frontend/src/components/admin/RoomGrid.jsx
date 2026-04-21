import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoBedOutline, IoAddCircleOutline, IoTrashOutline, IoCreateOutline, IoSnowOutline } from 'react-icons/io5';

const RoomGrid = ({ room, onAddSeat, onEditSeat, onDeleteSeat, onSeatClick }) => {
    const doorPosition = room.doorPosition || 'south';
    const hasAc = room.hasAc || false;
    const acPosition = room.acPosition || 'north';

    // ═══ REALISTIC SPLIT AC UNIT ═══════════════════════════════════════════
    const AcMachine = ({ wall }) => {
        if (!hasAc || acPosition !== wall) return null;
        const isH = wall === 'north' || wall === 'south';
        const fromStart = wall === 'north' || wall === 'west';

        const pos = {
            north: { position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%) scale(1.5)', transformOrigin: 'top center', zIndex: 40 },
            south: { position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%) scale(1.5)', transformOrigin: 'bottom center', zIndex: 40 },
            east:  { position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%) scale(1.5)', transformOrigin: 'center right', zIndex: 40 },
            west:  { position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%) scale(1.5)', transformOrigin: 'center left', zIndex: 40 },
        }[wall];

        // Horizontal AC (north/south): 140x30. Vertical (east/west): 28x100
        const W = isH ? 140 : 28;
        const H = isH ? 30 : 100;

        return (
            <div style={{ ...pos, pointerEvents: 'none' }}>
                {/* Main body */}
                <div style={{
                    width: W, height: H,
                    background: 'linear-gradient(175deg, #f0f8ff 0%, #d0e8f2 35%, #b8d4e8 70%, #9ec0d8 100%)',
                    borderRadius: 6,
                    border: '1.5px solid rgba(140,190,215,0.95)',
                    boxShadow: '0 0 16px 4px rgba(34,211,238,0.4), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.7)',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Top gloss stripe */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        height: isH ? 7 : 4,
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.1) 100%)',
                        borderRadius: '6px 6px 0 0',
                    }} />

                    {/* Vent grille — thin parallel lines */}
                    <div style={{
                        position: 'absolute',
                        ...(isH
                            ? { bottom: 0, left: 10, right: 34, top: 9 }
                            : { top: 14, left: 0, right: 0, bottom: 10 }),
                        overflow: 'hidden',
                    }}>
                        {[...Array(isH ? 5 : 9)].map((_, vi) => (
                            <div key={vi} style={{
                                position: 'absolute',
                                background: 'rgba(60,120,160,0.3)',
                                borderRadius: 1,
                                ...(isH
                                    ? { left: 0, right: 0, height: 1.5, top: 2 + vi * 4 }
                                    : { top: 0, bottom: 0, width: 1.5, left: 2 + vi * 3.2 })
                            }} />
                        ))}
                    </div>

                    {/* Temperature display (horizontal only) */}
                    {isH && (
                        <div style={{
                            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(0,30,60,0.7)',
                            borderRadius: 3, padding: '1px 4px',
                            fontFamily: 'monospace',
                            fontSize: 7, fontWeight: 900,
                            color: '#00e5ff',
                            letterSpacing: 0.5,
                            textShadow: '0 0 4px #00e5ff',
                            border: '0.5px solid rgba(0,229,255,0.3)',
                        }}>18°C</div>
                    )}

                    {/* Vane fin (animated) — bottom of unit */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            background: 'rgba(80,160,200,0.6)',
                            borderRadius: 2,
                            ...(isH
                                ? { bottom: 2, left: 10, right: 34, height: 2.5 }
                                : { right: 2, top: 14, bottom: 10, width: 2.5 }),
                        }}
                        animate={isH ? { rotateX: [0, 15, 0] } : { rotateY: [0, 15, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    />

                    {/* Power LED */}
                    <motion.div style={{
                        position: 'absolute',
                        width: 5, height: 5,
                        borderRadius: '50%',
                        background: '#22c55e',
                        boxShadow: '0 0 8px 2px #22c55e',
                        ...(isH ? { left: 6, top: '50%', marginTop: -2.5 } : { top: 6, left: '50%', marginLeft: -2.5 }),
                    }}
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.8 }}
                    />
                </div>

                {/* ── Air output puffs — 4 expanding arcs from the AC vents ── */}
                {[0, 1, 2, 3].map(i => {
                    // Each arc: starts at vent edge, expands outward, fades
                    // For north/south AC: horizontal arcs drifting down/up
                    // For east/west AC: vertical arcs drifting right/left
                    const driftPx = (i + 1) * 14;   // how far each arc drifts from AC
                    const arcStyle = isH ? {
                        position: 'absolute',
                        left: '0%', right: '20%',   // same width as vent area
                        height: 3,
                        // North: arcs go below AC; South: above
                        top: fromStart ? H + 2 : 'auto',
                        bottom: fromStart ? 'auto' : H + 2,
                        background: 'linear-gradient(90deg, transparent, rgba(200,240,255,0.55) 20%, rgba(220,248,255,0.7) 50%, rgba(200,240,255,0.55) 80%, transparent)',
                        borderRadius: 4,
                        transformOrigin: 'center top',
                    } : {
                        position: 'absolute',
                        top: '10%', bottom: '10%',
                        width: 3,
                        left: fromStart ? 'auto' : H + 2,
                        right: fromStart ? H + 2 : 'auto',
                        background: 'linear-gradient(180deg, transparent, rgba(200,240,255,0.55) 20%, rgba(220,248,255,0.7) 50%, rgba(200,240,255,0.55) 80%, transparent)',
                        borderRadius: 4,
                        transformOrigin: 'top center',
                    };

                    const arcAnim = isH
                        ? {
                            y: fromStart ? [0, driftPx, driftPx + 8] : [0, -driftPx, -driftPx - 8],
                            scaleX: [0.6, 1.4 + i * 0.5, 2 + i * 0.6],
                            opacity: [0, 0.7, 0],
                          }
                        : {
                            x: fromStart ? [0, -driftPx, -driftPx - 8] : [0, driftPx, driftPx + 8],
                            scaleY: [0.6, 1.4 + i * 0.5, 2 + i * 0.6],
                            opacity: [0, 0.7, 0],
                          };

                    return (
                        <motion.div
                            key={i}
                            style={arcStyle}
                            animate={arcAnim}
                            transition={{
                                repeat: Infinity,
                                duration: 1.4,
                                delay: i * 0.32,
                                ease: 'easeOut',
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    // ═══ WHOLE-ROOM AIR FLOW — real air, barely visible wisps ══════════════
    const AcAirFlow = () => {
        if (!hasAc) return null;
        const isH = acPosition === 'north' || acPosition === 'south';
        const fromStart = acPosition === 'north' || acPosition === 'west';

        // 22 thin wisps spread evenly across full room width — nearly invisible
        const wisps = [...Array(22)].map((_, i) => ({
            id: i,
            pct: i * 4.6,              // 0% → ~100% full coverage
            delay: i * 0.13,
            dur: 1.8 + (i % 6) * 0.18, // fast: 1.8s–2.7s
            size: 8 + (i % 4) * 3,     // very thin: 8/11/14/17px
        }));

        // Pure white, near-invisible gradient — real air has no color
        const wispGrad = isH
            ? `linear-gradient(${fromStart ? '180deg' : '0deg'}, transparent 0%, rgba(255,255,255,0.09) 40%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.09) 60%, transparent 100%)`
            : `linear-gradient(${fromStart ? '90deg' : '270deg'}, transparent 0%, rgba(255,255,255,0.09) 40%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.09) 60%, transparent 100%)`;

        // Extremely subtle directional ambient — just enough to hint at air source
        const ambientGrad = {
            north: 'linear-gradient(180deg, rgba(200,240,255,0.04) 0%, transparent 60%)',
            south: 'linear-gradient(0deg,   rgba(200,240,255,0.04) 0%, transparent 60%)',
            east:  'linear-gradient(270deg, rgba(200,240,255,0.04) 0%, transparent 60%)',
            west:  'linear-gradient(90deg,  rgba(200,240,255,0.04) 0%, transparent 60%)',
        }[acPosition];

        return (
            <div style={{
                position: 'absolute', inset: 0,
                pointerEvents: 'none', overflow: 'hidden',
                zIndex: 15, borderRadius: 'inherit',
            }}>
                {/* Barely-there ambient direction hint */}
                <div style={{ position: 'absolute', inset: 0, background: ambientGrad }} />

                {/* 22 thin air wisps sweeping the full room */}
                {wisps.map(w => {
                    const style = isH ? {
                        left: `${w.pct}%`,
                        width: w.size,
                        top: fromStart ? '-25%' : '125%',
                        height: '30%',
                        background: wispGrad,
                        filter: 'blur(1.5px)',
                        borderRadius: 20,
                    } : {
                        top: `${w.pct}%`,
                        height: w.size,
                        left: fromStart ? '-25%' : '125%',
                        width: '30%',
                        background: wispGrad,
                        filter: 'blur(1.5px)',
                        borderRadius: 20,
                    };

                    const anim = isH
                        ? { top: fromStart ? '125%' : '-25%', opacity: [0, 0.7, 0.7, 0] }
                        : { left: fromStart ? '125%' : '-25%', opacity: [0, 0.7, 0.7, 0] };

                    return (
                        <motion.div
                            key={w.id}
                            style={{ position: 'absolute', ...style }}
                            animate={anim}
                            transition={{
                                repeat: Infinity,
                                duration: w.dur,
                                delay: w.delay,
                                ease: 'linear',
                                times: [0, 0.12, 0.88, 1],
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    // ═══ CEILING FAN OVERLAY ════════════════════════════════
    const CeilingFan = () => {
        if (!room.hasFan) return null;

        return (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.35] mix-blend-screen z-20">
                {/* Fast spinning blades */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.25, ease: 'linear' }}
                    className="relative w-32 h-32 flex items-center justify-center"
                >
                    {/* Center motor */}
                    <div className="absolute w-5 h-5 rounded-full bg-white/40 border border-white/50 z-10 shadow-[0_0_15px_rgba(255,255,255,0.4)] inset-0 m-auto" />
                    
                    {/* 3 Blades (perfect center pivot) */}
                    {[0, 120, 240].map((deg) => (
                        <div key={deg} className="absolute left-[calc(50%-4px)] bottom-1/2 w-2 h-[56px] origin-bottom" 
                             style={{ transform: `rotate(${deg}deg)` }}>
                            <div className="w-[32px] h-[56px] -ml-[12px] bg-gradient-to-t from-white/30 to-white/5 
                                          rounded-t-[100%] rounded-b-[40%] backdrop-blur-[2px]" />
                        </div>
                    ))}
                </motion.div>
                
                {/* Fast motion blur ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-[12px] border-white/10 blur-[3px]" />
            </div>
        );
    };

    const northSeats = room.seats.filter(s => s.position?.wall === 'north').sort((a, b) => (a.position?.index || 0) - (b.position?.index || 0));
    const eastSeats = room.seats.filter(s => s.position?.wall === 'east').sort((a, b) => (a.position?.index || 0) - (b.position?.index || 0));
    const southSeats = room.seats.filter(s => s.position?.wall === 'south').sort((a, b) => (a.position?.index || 0) - (b.position?.index || 0));
    const westSeats = room.seats.filter(s => s.position?.wall === 'west').sort((a, b) => (a.position?.index || 0) - (b.position?.index || 0));
    const unpositionedSeats = room.seats.filter(s => !s.position?.wall);
    const totalSeats = room.seats.length;

    // Show interior box if dimensions are non-zero OR there are unpositioned seats
    const roomW = room.dimensions?.width || 0;
    const roomH = room.dimensions?.height || 0;
    const showInterior = (roomW > 0 || roomH > 0) || unpositionedSeats.length > 0;

    const SeatCard = ({ seat }) => (
        <motion.div
            whileHover={{ scale: 1.08 }}
            onClick={() => seat.isOccupied && onSeatClick && onSeatClick(seat)}
            className={`relative p-2 rounded-lg border-2 transition-all group min-w-[50px] ${seat.isOccupied
                ? 'bg-red-500/30 border-red-500 cursor-pointer hover:bg-red-500/40' // Add cursor pointer if occupied
                : 'bg-green-500/30 border-green-500'
                }`}
        >
            <div className="flex items-center gap-1 justify-center">
                <IoBedOutline size={14} />
                <span className="font-bold text-xs">{seat.number}</span>
            </div>

            {/* Action buttons on hover */}
            <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1 z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering card click
                        onEditSeat(seat);
                    }}
                    className="p-1 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors shadow-lg"
                >
                    <IoCreateOutline size={12} />
                </button>
                {!seat.isOccupied && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSeat(seat);
                        }}
                        className="p-1 bg-red-600 rounded-full hover:bg-red-500 transition-colors shadow-lg"
                    >
                        <IoTrashOutline size={12} />
                    </button>
                )}
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-6">
            {/* Box Room Layout */}
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border-2 border-white/10">
                {/* Room Title */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 px-4 py-2 rounded-lg border border-white/20 z-20">
                    <p className="text-sm font-medium text-gray-400">{room.name} ({totalSeats} Seats)</p>
                </div>

                {/* Add Seat Buttons */}
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                    <button onClick={() => onAddSeat('north')} className="px-3 py-1.5 bg-blue-600/80 rounded-lg text-xs hover:bg-blue-500 transition-colors font-semibold" title="Add to North">
                        + North
                    </button>
                    <button onClick={() => onAddSeat('east')} className="px-3 py-1.5 bg-blue-600/80 rounded-lg text-xs hover:bg-blue-500 transition-colors font-semibold" title="Add to East">
                        + East
                    </button>
                    <button onClick={() => onAddSeat('south')} className="px-3 py-1.5 bg-blue-600/80 rounded-lg text-xs hover:bg-blue-500 transition-colors font-semibold" title="Add to South">
                        + South
                    </button>
                    <button onClick={() => onAddSeat('west')} className="px-3 py-1.5 bg-blue-600/80 rounded-lg text-xs hover:bg-blue-500 transition-colors font-semibold" title="Add to West">
                        + West
                    </button>
                </div>

                {/* Fitted Box Room Container */}
                <div className="relative w-full max-w-3xl mx-auto mt-12" style={{ aspectRatio: '3/2' }}>
                    {/* AC air-flow overlay — covers whole room */}
                    {hasAc && <AcAirFlow />}
                    {/* AC Machine on the correct wall */}
                    <AcMachine wall="north" />
                    <AcMachine wall="south" />
                    <AcMachine wall="east" />
                    <AcMachine wall="west" />

                    {/* North Wall */}
                    <div className="absolute top-0 left-0 right-0 h-[80px]">
                        {doorPosition === 'north' ? (
                            <>
                                {/* Left side of door */}
                                <div className="absolute top-0 left-0 w-[40%] h-full border-t-4 border-l-4 border-white/40 rounded-tl-2xl bg-gradient-to-b from-white/10 to-white/5 p-2">
                                    <div className="flex gap-1.5 justify-center flex-wrap h-full items-center overflow-auto scrollbar-hide">
                                        {northSeats.slice(0, Math.ceil(northSeats.length / 2)).map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                    </div>
                                </div>
                                {/* Door */}
                                <div className="absolute top-0 left-[40%] w-[20%] h-full flex items-start justify-center pt-2">
                                    <div className="bg-yellow-500 px-4 py-1 rounded-full shadow-lg">
                                        <span className="text-xs text-gray-900 font-bold">DOOR</span>
                                    </div>
                                </div>
                                {/* Right side of door */}
                                <div className="absolute top-0 right-0 w-[40%] h-full border-t-4 border-r-4 border-white/40 rounded-tr-2xl bg-gradient-to-b from-white/10 to-white/5 p-2">
                                    <div className="flex gap-1.5 justify-center flex-wrap h-full items-center overflow-auto scrollbar-hide">
                                        {northSeats.slice(Math.ceil(northSeats.length / 2)).map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full border-t-4 border-l-4 border-r-4 border-white/40 rounded-t-2xl bg-gradient-to-b from-white/10 to-white/5 p-2">
                                <div className="flex gap-1.5 justify-center flex-wrap h-full items-center overflow-auto scrollbar-hide">
                                    {northSeats.map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                    {northSeats.length === 0 && <span className="text-xs text-gray-600 italic">Empty</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* West Wall */}
                    <div className="absolute top-0 left-0 bottom-0 w-[80px]">
                        {doorPosition === 'west' ? (
                            <>
                                {/* Top of door */}
                                <div className="absolute top-0 left-0 w-full h-[40%] border-l-4 border-white/40 bg-gradient-to-r from-white/10 to-white/5 p-2">
                                    <div className="flex flex-col gap-1.5 items-center h-full justify-center overflow-auto scrollbar-hide">
                                        {westSeats.slice(0, Math.ceil(westSeats.length / 2)).map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                    </div>
                                </div>
                                {/* Door */}
                                <div className="absolute left-0 top-[40%] w-full h-[20%] flex items-center justify-center">
                                    <div className="bg-yellow-500 px-1 py-4 rounded-full shadow-lg">
                                        <span className="text-xs text-gray-900 font-bold -rotate-90 inline-block whitespace-nowrap">DOOR</span>
                                    </div>
                                </div>
                                {/* Bottom of door */}
                                <div className="absolute bottom-0 left-0 w-full h-[40%] border-l-4 border-white/40 bg-gradient-to-r from-white/10 to-white/5 p-2">
                                    <div className="flex flex-col gap-1.5 items-center h-full justify-center overflow-auto scrollbar-hide">
                                        {westSeats.slice(Math.ceil(westSeats.length / 2)).map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full border-l-4 border-white/40 bg-gradient-to-r from-white/10 to-white/5 p-2">
                                <div className="flex flex-col gap-1.5 items-center h-full justify-center overflow-auto scrollbar-hide">
                                    {westSeats.map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* East Wall */}
                    <div className="absolute top-0 right-0 bottom-0 w-[80px]">
                        {doorPosition === 'east' ? (
                            <>
                                {/* Top of door */}
                                <div className="absolute top-0 right-0 w-full h-[40%] border-r-4 border-white/40 bg-gradient-to-l from-white/10 to-white/5 p-2">
                                    <div className="flex flex-col gap-1.5 items-center h-full justify-center overflow-auto scrollbar-hide">
                                        {eastSeats.slice(0, Math.ceil(eastSeats.length / 2)).map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                    </div>
                                </div>
                                {/* Door */}
                                <div className="absolute right-0 top-[40%] w-full h-[20%] flex items-center justify-center">
                                    <div className="bg-yellow-500 px-1 py-4 rounded-full shadow-lg">
                                        <span className="text-xs text-gray-900 font-bold rotate-90 inline-block whitespace-nowrap">DOOR</span>
                                    </div>
                                </div>
                                {/* Bottom of door */}
                                <div className="absolute bottom-0 right-0 w-full h-[40%] border-r-4 border-white/40 bg-gradient-to-l from-white/10 to-white/5 p-2">
                                    <div className="flex flex-col gap-1.5 items-center h-full justify-center overflow-auto scrollbar-hide">
                                        {eastSeats.slice(Math.ceil(eastSeats.length / 2)).map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full border-r-4 border-white/40 bg-gradient-to-l from-white/10 to-white/5 p-2">
                                <div className="flex flex-col gap-1.5 items-center h-full justify-center overflow-auto scrollbar-hide">
                                    {eastSeats.map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* South Wall */}
                    <div className="absolute bottom-0 left-0 right-0 h-[80px]">
                        {doorPosition === 'south' ? (
                            <>
                                {/* Left side of door */}
                                <div className="absolute bottom-0 left-0 w-[40%] h-full border-b-4 border-l-4 border-white/40 rounded-bl-2xl bg-gradient-to-t from-white/10 to-white/5 p-2">
                                    <div className="flex gap-1.5 justify-center flex-wrap h-full items-center overflow-auto scrollbar-hide">
                                        {southSeats.slice(0, Math.ceil(southSeats.length / 2)).map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                    </div>
                                </div>
                                {/* Door */}
                                <div className="absolute bottom-0 left-[40%] w-[20%] h-full flex items-end justify-center pb-2">
                                    <div className="bg-yellow-500 px-4 py-1 rounded-full shadow-lg">
                                        <span className="text-xs text-gray-900 font-bold">DOOR</span>
                                    </div>
                                </div>
                                {/* Right side of door */}
                                <div className="absolute bottom-0 right-0 w-[40%] h-full border-b-4 border-r-4 border-white/40 rounded-br-2xl bg-gradient-to-t from-white/10 to-white/5 p-2">
                                    <div className="flex gap-1.5 justify-center flex-wrap h-full items-center overflow-auto scrollbar-hide">
                                        {southSeats.slice(Math.ceil(southSeats.length / 2)).map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full border-b-4 border-l-4 border-r-4 border-white/40 rounded-b-2xl bg-gradient-to-t from-white/10 to-white/5 p-2">
                                <div className="flex gap-1.5 justify-center flex-wrap h-full items-center overflow-auto scrollbar-hide">
                                    {southSeats.map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                    {southSeats.length === 0 && <span className="text-xs text-gray-600 italic">Empty</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Room Interior — hidden when dimensions are 0×0 */}
                    {showInterior && (
                        <div className="absolute top-[80px] left-[80px] right-[80px] bottom-[80px] bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center p-4 overflow-hidden">
                            <CeilingFan />
                            <div className="relative z-30 w-full h-full flex items-center justify-center overflow-auto">
                                {unpositionedSeats.length > 0 ? (
                                    <div className="w-full h-full">
                                        <p className="text-gray-400 text-xs font-semibold mb-2 text-center sticky top-0 bg-gray-800/80 backdrop-blur-sm p-1 rounded z-10">Unconfigured Seats ({unpositionedSeats.length})</p>
                                        <div className="flex flex-wrap gap-2 justify-center content-start">
                                            {unpositionedSeats.map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                        </div>
                                    </div>
                                ) : !room.hasFan ? (
                                    <div className="text-center">
                                        <p className="text-gray-400 text-sm font-semibold">Room Interior</p>
                                        <p className="text-gray-500 text-xs mt-1">{roomW}m × {roomH}m</p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>

                {/* Legend */}
                <div className="mt-6 flex gap-4 justify-center text-xs flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500/30 border-2 border-green-500 rounded"></div>
                        <span className="text-gray-400">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500/30 border-2 border-red-500 rounded"></div>
                        <span className="text-gray-400">Occupied</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-500 font-semibold">DOOR</span>
                        <span className="text-gray-400">Entry/Exit</span>
                    </div>
                    {hasAc && (
                        <div className="flex items-center gap-2">
                            <IoSnowOutline size={14} className="text-cyan-400" />
                            <span className="text-cyan-400">AC • {acPosition.charAt(0).toUpperCase() + acPosition.slice(1)} wall</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoomGrid;
