import React from 'react';
import { motion } from 'framer-motion';
import { IoBedOutline, IoAddCircleOutline, IoTrashOutline, IoCreateOutline } from 'react-icons/io5';

const RoomGrid = ({ room, onAddSeat, onEditSeat, onDeleteSeat, onSeatClick }) => {
    const doorPosition = room.doorPosition || 'south';

    // Group seats by wall
    const northSeats = room.seats.filter(s => s.position?.wall === 'north').sort((a, b) => (a.position?.index || 0) - (b.position?.index || 0));
    const eastSeats = room.seats.filter(s => s.position?.wall === 'east').sort((a, b) => (a.position?.index || 0) - (b.position?.index || 0));
    const southSeats = room.seats.filter(s => s.position?.wall === 'south').sort((a, b) => (a.position?.index || 0) - (b.position?.index || 0));
    const westSeats = room.seats.filter(s => s.position?.wall === 'west').sort((a, b) => (a.position?.index || 0) - (b.position?.index || 0));
    const unpositionedSeats = room.seats.filter(s => !s.position?.wall);

    const totalSeats = room.seats.length;

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

                    {/* Room Interior - Unpositioned Seats or Info */}
                    <div className="absolute top-[80px] left-[80px] right-[80px] bottom-[80px] bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center p-4 overflow-auto">
                        {unpositionedSeats.length > 0 ? (
                            <div className="w-full h-full">
                                <p className="text-gray-400 text-xs font-semibold mb-2 text-center sticky top-0 bg-gray-800/80 backdrop-blur-sm p-1 rounded z-10">Unconfigured Seats ({unpositionedSeats.length})</p>
                                <div className="flex flex-wrap gap-2 justify-center content-start">
                                    {unpositionedSeats.map(seat => <SeatCard key={seat._id} seat={seat} />)}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-gray-400 text-sm font-semibold">Room Interior</p>
                                <p className="text-gray-500 text-xs mt-1">
                                    {room.dimensions?.width || 4}m × {room.dimensions?.height || 4}m
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-6 flex gap-4 justify-center text-xs">
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
                </div>
            </div>
        </div>
    );
};

export default RoomGrid;
