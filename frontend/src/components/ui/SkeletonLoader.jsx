/* ─── SkeletonLoader ────────────────────────────────────────────────────────
   Modern, page-specific skeleton placeholders that mirror real layouts.
   ─────────────────────────────────────────────────────────────────────────── */

// ── Primitive shimmer block ──────────────────────────────────────────────────
const Sk = ({ className = '', style = {} }) => (
    <div className={`skeleton rounded-lg ${className}`} style={style} />
);

// ── Shared layout wrappers ────────────────────────────────────────────────────
const PageShell = ({ children }) => (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: '#050508' }}>
        <div className="max-w-6xl mx-auto space-y-5">{children}</div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 1. DASHBOARD SKELETON  (StudentDashboard.jsx)
// ─────────────────────────────────────────────────────────────────────────────
export const DashboardSkeleton = () => (
    <PageShell>
        {/* Header bar */}
        <div className="flex items-center justify-between mb-10 pt-2">
            <div className="flex items-center gap-4">
                <Sk className="w-16 h-16 rounded-full flex-shrink-0" />
                <div className="space-y-2">
                    <Sk className="h-3 w-28" />
                    <Sk className="h-7 w-48" />
                    <div className="flex items-center gap-2">
                        <Sk className="h-5 w-24 rounded-full" />
                        <Sk className="h-4 w-32" />
                    </div>
                </div>
            </div>
            <Sk className="h-9 w-24 rounded-xl" />
        </div>

        {/* Stats 2×2 grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            {[
                'from-blue-500/20 to-cyan-500/10',
                'from-green-500/20 to-emerald-500/10',
                'from-amber-500/20 to-orange-500/10',
                'from-pink-500/20 to-rose-500/10',
            ].map((grad, i) => (
                <div
                    key={i}
                    className="relative rounded-2xl p-6 border border-white/8 overflow-hidden"
                    style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))` }}
                >
                    <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${grad} opacity-60`} />
                    <div className="flex items-start justify-between mb-5">
                        <Sk className="w-11 h-11 rounded-xl flex-shrink-0" />
                        <Sk className="h-3 w-12" />
                    </div>
                    <Sk className="h-3 w-20 mb-2" />
                    <Sk className="h-8 w-16 mb-2" />
                    <Sk className="h-3 w-28" />
                </div>
            ))}
        </div>

        {/* Quick Actions section */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6 mb-8">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
                <Sk className="w-8 h-8 rounded-xl flex-shrink-0" />
                <div className="space-y-1.5">
                    <Sk className="h-4 w-32" />
                    <Sk className="h-3 w-48" />
                </div>
            </div>
            {/* 4×2 action grid */}
            <div className="grid grid-cols-2 gap-3">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-white/8 bg-white/3"
                    >
                        <Sk className="w-11 h-11 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Sk className="h-3.5 w-3/4" />
                            <Sk className="h-3 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Learning Region section */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
            <div className="flex items-center gap-3 mb-6">
                <Sk className="w-8 h-8 rounded-xl flex-shrink-0" />
                <div className="space-y-1.5">
                    <Sk className="h-4 w-36" />
                    <Sk className="h-3 w-52" />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4"
                    >
                        <Sk className="w-12 h-12 rounded-xl" />
                        <div className="space-y-2">
                            <Sk className="h-4 w-16" />
                            <Sk className="h-3 w-full" />
                            <Sk className="h-3 w-4/5" />
                        </div>
                        <Sk className="h-4 w-16" />
                    </div>
                ))}
            </div>
        </div>
    </PageShell>
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. PROFILE SKELETON  (Profile.jsx)
// ─────────────────────────────────────────────────────────────────────────────
export const ProfileSkeleton = () => (
    <div className="min-h-screen px-4 sm:px-6 py-8 pb-16" style={{ background: '#050508' }}>
        <div className="max-w-4xl mx-auto">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-8">
                <Sk className="h-9 w-40 rounded-xl" />
                <Sk className="h-9 w-24 rounded-xl" />
            </div>

            {/* Hero banner card */}
            <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden mb-6">
                {/* Banner */}
                <div className="h-28 bg-gradient-to-br from-violet-600/15 via-indigo-600/10 to-blue-600/15" />
                <div className="px-6 pb-6">
                    <div className="-mt-12 mb-4 flex items-end justify-between flex-wrap gap-4">
                        <Sk className="w-24 h-24 rounded-2xl flex-shrink-0" style={{ border: '4px solid #0a0a12' }} />
                        <Sk className="h-8 w-28 rounded-xl" />
                    </div>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="space-y-2">
                            <Sk className="h-8 w-52" />
                            <Sk className="h-4 w-36" />
                        </div>
                        <Sk className="h-7 w-28 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                {/* QR Card */}
                <div className="rounded-2xl border border-white/8 bg-white/3 p-5 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 self-start">
                        <Sk className="w-4 h-4 rounded" />
                        <Sk className="h-3 w-20" />
                    </div>
                    <Sk className="w-36 h-36 rounded-xl" />
                    <Sk className="h-4 w-32" />
                    <Sk className="h-3 w-28" />
                    <Sk className="h-3 w-36" />
                </div>

                {/* Info card */}
                <div className="rounded-2xl border border-white/8 bg-white/3 p-5 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Sk className="w-4 h-4 rounded" />
                        <Sk className="h-3 w-36" />
                    </div>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 py-3.5 border-b border-white/5 last:border-0">
                            <Sk className="w-8 h-8 rounded-lg flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <Sk className="h-2.5 w-16" />
                                <Sk className="h-3.5 w-3/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action buttons section */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5 mb-5">
                <div className="flex items-center gap-2 mb-5">
                    <Sk className="w-4 h-4 rounded" />
                    <Sk className="h-3 w-28" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/3">
                            <Sk className="w-10 h-10 rounded-xl flex-shrink-0" />
                            <div className="space-y-1.5">
                                <Sk className="h-3.5 w-36" />
                                <Sk className="h-3 w-48" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Security section */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                <div className="flex items-center gap-2 mb-5">
                    <Sk className="w-4 h-4 rounded" />
                    <Sk className="h-3 w-32" />
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/3 w-fit">
                    <Sk className="w-10 h-10 rounded-xl flex-shrink-0" />
                    <div className="space-y-1.5">
                        <Sk className="h-3.5 w-28" />
                        <Sk className="h-3 w-40" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. FEE STATUS SKELETON  (FeeStatus.jsx)
// ─────────────────────────────────────────────────────────────────────────────
export const FeeStatusSkeleton = () => (
    <div className="min-h-screen px-4 sm:px-6 py-8" style={{ background: '#050508' }}>
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-10">
                <Sk className="h-9 w-20 rounded-xl" />
                <div className="space-y-1.5">
                    <Sk className="h-7 w-32" />
                    <Sk className="h-3.5 w-36" />
                </div>
            </div>

            {/* 3 stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {['from-green-500/20 to-emerald-400/10', 'from-yellow-500/20 to-amber-400/10', 'from-blue-500/20 to-cyan-400/10'].map((grad, i) => (
                    <div key={i} className="relative rounded-2xl p-5 border border-white/8 bg-white/3 overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${grad}`} />
                        <div className="flex items-center gap-4">
                            <Sk className="w-11 h-11 rounded-xl flex-shrink-0" />
                            <div className="space-y-1.5">
                                <Sk className="h-3 w-20" />
                                <Sk className="h-8 w-24" />
                                <Sk className="h-3 w-16" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-6 mb-6">
                <div className="flex items-center gap-2 mb-6">
                    <Sk className="w-5 h-5 rounded" />
                    <Sk className="h-5 w-40" />
                </div>
                {/* Table head */}
                <div className="flex gap-4 pb-4 border-b border-white/8 mb-3">
                    {[120, 80, 100, 100, 80].map((w, i) => (
                        <Sk key={i} className="h-3" style={{ width: w }} />
                    ))}
                </div>
                {/* Table rows */}
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 py-4 border-b border-white/5 last:border-0">
                        <Sk className="h-4 flex-1" style={{ maxWidth: 120 }} />
                        <Sk className="h-4 flex-1" style={{ maxWidth: 80 }} />
                        <Sk className="h-4 flex-1" style={{ maxWidth: 100 }} />
                        <Sk className="h-4 flex-1" style={{ maxWidth: 100 }} />
                        <Sk className="h-6 w-16 rounded-full" />
                    </div>
                ))}
            </div>

            {/* Instructions card */}
            <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
                <Sk className="h-5 w-44 mb-5" />
                <div className="space-y-2.5">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                            <Sk className="w-6 h-6 rounded-full flex-shrink-0" />
                            <Sk className="h-4 flex-1" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. ATTENDANCE SKELETON  (Attendance.jsx)
// ─────────────────────────────────────────────────────────────────────────────
export const AttendanceSkeleton = () => (
    <div className="min-h-screen px-4 sm:px-6 py-8" style={{ background: '#050508' }}>
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Sk className="h-9 w-20 rounded-xl" />
                    <div className="space-y-1.5">
                        <Sk className="h-7 w-36" />
                        <Sk className="h-3.5 w-44" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Sk className="h-9 w-32 rounded-xl" />
                    <Sk className="h-9 w-28 rounded-xl" />
                </div>
            </div>

            {/* 4 stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {['from-slate-400/20 to-gray-300/10', 'from-green-500/20 to-emerald-400/10', 'from-blue-500/20 to-cyan-400/10', 'from-purple-500/20 to-violet-400/10'].map((grad, i) => (
                    <div key={i} className="relative rounded-2xl p-5 border border-white/8 bg-white/3 overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${grad}`} />
                        <Sk className="w-9 h-9 rounded-xl mb-3" />
                        <Sk className="h-2.5 w-20 mb-2" />
                        <Sk className="h-8 w-16" />
                    </div>
                ))}
            </div>

            {/* Progress bar card */}
            <div className="mb-8 p-5 rounded-2xl border border-white/8 bg-white/3">
                <div className="flex justify-between mb-3">
                    <Sk className="h-4 w-40" />
                    <Sk className="h-4 w-10" />
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5">
                    <div className="h-full w-3/5 skeleton rounded-full" />
                </div>
                <div className="flex justify-between mt-2">
                    <Sk className="h-3 w-6" />
                    <Sk className="h-3 w-20" />
                    <Sk className="h-3 w-8" />
                </div>
            </div>

            {/* Daily log table */}
            <div className="space-y-6">
                <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
                    <Sk className="h-5 w-24 mb-6" />
                    <div className="space-y-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/3">
                                <div className="flex items-center gap-3 min-w-[180px]">
                                    <Sk className="w-10 h-10 rounded-xl flex-shrink-0" />
                                    <div className="space-y-1.5">
                                        <Sk className="h-4 w-28" />
                                        <Sk className="h-4 w-16 rounded-full" />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {[...Array(3)].map((_, j) => (
                                        <Sk key={j} className="h-8 w-28 rounded-lg" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rankings table */}
                <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Sk className="w-5 h-5 rounded" />
                        <Sk className="h-5 w-44" />
                    </div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-4 py-4 border-b border-white/5 last:border-0 items-center">
                            <Sk className="w-8 h-8 rounded-full flex-shrink-0" />
                            <Sk className="h-4 flex-1" />
                            <Sk className="h-5 w-12" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. BOOKS / NOTES PAGE SKELETON  (BooksPage.jsx & NotesPage.jsx)
// ─────────────────────────────────────────────────────────────────────────────
export const BooksNotesPageSkeleton = ({ variant = 'books' }) => (
    <div className="min-h-screen px-4 sm:px-6 py-8 pb-20" style={{ background: '#050508' }}>
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Sk className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                    <Sk className="h-7 w-44" />
                    <Sk className="h-3.5 w-64" />
                </div>
                <Sk className="h-8 w-20 rounded-xl" />
            </div>

            {/* Search bar */}
            <div className="relative mb-6">
                <Sk className="h-12 w-full rounded-2xl" />
            </div>

            {/* Category pills */}
            <div className="flex gap-2 mb-3 overflow-x-hidden">
                {[80, 60, 90, 80, 70, 100, 80, 70, 110].map((w, i) => (
                    <Sk key={i} className="h-8 rounded-full flex-shrink-0" style={{ width: w }} />
                ))}
            </div>

            {/* Custom exam row */}
            <div className="flex gap-2 mb-8">
                <Sk className="h-10 flex-1 rounded-xl" />
                <Sk className="h-10 w-20 rounded-xl" />
            </div>

            {/* Content grid */}
            {variant === 'books' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden flex flex-col">
                            <Sk className="w-full h-48 rounded-none" />
                            <div className="p-4 space-y-2.5">
                                <Sk className="h-4 w-full" />
                                <Sk className="h-4 w-4/5" />
                                <Sk className="h-3 w-3/5" />
                                <Sk className="h-3 w-full" />
                                <div className="flex justify-between pt-2 border-t border-white/5">
                                    <Sk className="h-3 w-16" />
                                    <Sk className="h-3 w-10" />
                                </div>
                                <Sk className="h-8 w-full rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className="rounded-2xl border border-white/8 bg-white/3 p-5 flex flex-col gap-3">
                            <div className="absolute top-0 left-0 w-full h-px" />
                            <div className="flex items-start gap-3">
                                <Sk className="w-10 h-10 rounded-xl flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <Sk className="h-4 w-full" />
                                    <Sk className="h-4 w-4/5" />
                                    <Sk className="h-3 w-28" />
                                </div>
                            </div>
                            <Sk className="h-3 w-full" />
                            <Sk className="h-3 w-5/6" />
                            <div className="flex gap-1">
                                {[...Array(3)].map((_, j) => (
                                    <Sk key={j} className="h-5 w-16 rounded-full" />
                                ))}
                            </div>
                            <div className="flex gap-3 pt-2 border-t border-white/5">
                                <Sk className="h-4 w-16" />
                                <Sk className="h-4 w-16" />
                            </div>
                            <div className="flex gap-2 mt-auto">
                                <Sk className="h-8 flex-1 rounded-xl" />
                                <Sk className="h-8 flex-1 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. MY SEAT SKELETON  (MySeat.jsx)
// ─────────────────────────────────────────────────────────────────────────────
export const SeatSkeleton = () => (
    <div className="min-h-screen px-4 sm:px-6 py-8" style={{ background: '#050508' }}>
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-10">
                <Sk className="h-9 w-20 rounded-xl" />
                <div className="space-y-1.5">
                    <Sk className="h-7 w-24" />
                    <Sk className="h-3.5 w-40" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
                {/* Left: details */}
                <div className="col-span-1 space-y-5">
                    {/* Seat hero */}
                    <div className="rounded-2xl border border-purple-500/20 bg-white/3 p-6 text-center space-y-4">
                        <Sk className="w-20 h-20 rounded-2xl mx-auto" />
                        <Sk className="h-14 w-20 mx-auto" />
                        <Sk className="h-3.5 w-28 mx-auto" />
                        <Sk className="h-8 w-36 rounded-full mx-auto" />
                    </div>
                    {/* Info rows */}
                    <div className="space-y-2.5">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/8">
                                <Sk className="w-9 h-9 rounded-lg flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <Sk className="h-2.5 w-16" />
                                    <Sk className="h-4 w-3/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Pricing */}
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
                        <Sk className="h-3 w-28 mb-4" />
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-xl border border-white/8 bg-white/3">
                                    <div className="space-y-1">
                                        <Sk className="h-3.5 w-20" />
                                        <Sk className="h-3 w-28" />
                                    </div>
                                    <Sk className="h-4 w-12" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: seat map */}
                <div className="col-span-2">
                    <div className="rounded-2xl border border-white/8 bg-white/3 p-6 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <Sk className="h-6 w-44" />
                            <Sk className="h-6 w-24 rounded-full" />
                        </div>
                        {/* Seat grid */}
                        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
                            {[...Array(40)].map((_, i) => (
                                <Sk key={i} className={`rounded-lg ${i === 12 ? 'ring-2 ring-purple-500/50' : ''}`} style={{ aspectRatio: '1 / 1' }} />
                            ))}
                        </div>
                        <Sk className="h-12 w-full rounded-xl mt-5" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. ADMIN DASHBOARD SKELETON  (AdminDashboard.jsx)
// ─────────────────────────────────────────────────────────────────────────────
export const AdminDashboardSkeleton = () => (
    <div className="min-h-screen p-6" style={{ background: '#050508' }}>
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="space-y-2">
                    <Sk className="h-8 w-56" />
                    <Sk className="h-4 w-40" />
                </div>
                <div className="flex gap-3">
                    <Sk className="h-9 w-28 rounded-xl" />
                    <Sk className="h-9 w-24 rounded-xl" />
                </div>
            </div>

            {/* Stat cards row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    'from-purple-500/20 to-indigo-500/10',
                    'from-green-500/20 to-emerald-500/10',
                    'from-blue-500/20 to-cyan-500/10',
                    'from-amber-500/20 to-orange-500/10',
                ].map((grad, i) => (
                    <div key={i} className="relative rounded-2xl p-5 border border-white/8 bg-white/3 overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r ${grad}`} />
                        <div className="flex items-start justify-between mb-4">
                            <Sk className="w-10 h-10 rounded-xl" />
                            <Sk className="h-3 w-10" />
                        </div>
                        <Sk className="h-3 w-24 mb-2" />
                        <Sk className="h-8 w-16 mb-1" />
                        <Sk className="h-3 w-20" />
                    </div>
                ))}
            </div>

            {/* Table / data section */}
            <AdminTableSkeleton embedded />
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. ADMIN TABLE SKELETON  (StudentManagement, FeeManagement, etc.)
// ─────────────────────────────────────────────────────────────────────────────
export const AdminTableSkeleton = ({ embedded = false }) => (
    <div className={embedded ? '' : 'min-h-screen p-6'} style={embedded ? {} : { background: '#050508' }}>
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
            {/* Table header row */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <Sk className="h-5 w-36" />
                <div className="flex gap-2">
                    <Sk className="h-9 w-32 rounded-xl" />
                    <Sk className="h-9 w-28 rounded-xl" />
                </div>
            </div>
            {/* Filter chips */}
            <div className="flex gap-2 mb-5 flex-wrap">
                {[80, 70, 90, 70, 80].map((w, i) => (
                    <Sk key={i} className="h-8 rounded-full" style={{ width: w }} />
                ))}
            </div>
            {/* Column headers */}
            <div className="grid grid-cols-6 gap-4 pb-4 border-b border-white/8">
                {[40, 100, 80, 80, 70, 60].map((w, i) => (
                    <Sk key={i} className="h-3" style={{ maxWidth: w }} />
                ))}
            </div>
            {/* Data rows */}
            {[...Array(8)].map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-4 py-4 border-b border-white/5 last:border-0 items-center">
                    <Sk className="w-8 h-8 rounded-full" />
                    <Sk className="h-4" />
                    <Sk className="h-4 w-4/5" />
                    <Sk className="h-6 w-16 rounded-full" />
                    <Sk className="h-4 w-3/4" />
                    <div className="flex gap-2">
                        <Sk className="h-7 w-7 rounded-lg" />
                        <Sk className="h-7 w-7 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. NOTIFICATION SKELETON  (refined)
// ─────────────────────────────────────────────────────────────────────────────
const NotificationSkeleton = () => (
    <div className="relative rounded-2xl border border-white/8 bg-white/5 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 skeleton" />
        <div className="p-5 flex gap-4">
            <Sk className="w-12 h-12 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Sk className="h-4 w-14 rounded-full" />
                        <Sk className="h-4 w-8 rounded-full" />
                    </div>
                    <Sk className="h-3 w-16 flex-shrink-0" />
                </div>
                <Sk className="h-4 w-3/4" />
                <Sk className="h-3.5 w-full" />
                <Sk className="h-3.5 w-5/6" />
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 10. CHAT SKELETON  (DiscussionRoom.jsx)
// ─────────────────────────────────────────────────────────────────────────────
const ChatSkeleton = () => (
    <div className="space-y-4 p-4">
        {/* Incoming */}
        <div className="flex gap-3">
            <Sk className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="space-y-1.5">
                <Sk className="h-3 w-24" />
                <Sk className="h-12 w-56 rounded-2xl" />
            </div>
        </div>
        {/* Outgoing */}
        <div className="flex gap-3 flex-row-reverse">
            <Sk className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="space-y-1.5 items-end flex flex-col">
                <Sk className="h-3 w-20" />
                <Sk className="h-16 w-44 rounded-2xl" />
            </div>
        </div>
        {/* Incoming */}
        <div className="flex gap-3">
            <Sk className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="space-y-1.5">
                <Sk className="h-3 w-32" />
                <Sk className="h-9 w-40 rounded-2xl" />
            </div>
        </div>
        {/* Outgoing */}
        <div className="flex gap-3 flex-row-reverse">
            <Sk className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="space-y-1.5 items-end flex flex-col">
                <Sk className="h-3 w-16" />
                <Sk className="h-10 w-52 rounded-2xl" />
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 11. PUBLIC SEAT VIEW SKELETON  (/public-seats)
// ─────────────────────────────────────────────────────────────────────────────
export const PublicSeatViewSkeleton = () => (
    <div className="min-h-screen p-6 min-w-[1280px] overflow-x-auto dark relative">
        {/* Fixed full-screen background — blocks body CSS blobs */}
        <div className="fixed inset-0 -z-10" style={{ background: 'radial-gradient(ellipse at 20% 15%, rgba(249,115,22,0.09) 0%, transparent 55%), radial-gradient(ellipse at 80% 85%, rgba(239,68,68,0.07) 0%, transparent 55%), #030712' }} />
        {/* Ambient blob */}
        <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-600/8 blur-[140px] pointer-events-none -z-10" />

        {/* Floating login button placeholder */}
        <div className="fixed top-8 right-8 z-50">
            <Sk className="h-12 w-32 rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto">
            {/* Branded header */}
            <div className="text-center mb-10 space-y-3">
                <Sk className="h-10 w-52 mx-auto rounded-xl" />
                <Sk className="h-3.5 w-44 mx-auto" />
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent mx-auto" />
                <Sk className="h-6 w-64 mx-auto" />
            </div>

            {/* Floor tab pills */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                {[100, 110, 95, 105].map((w, i) => (
                    <Sk key={i} className={`h-9 rounded-xl flex-shrink-0 ${i === 0 ? 'opacity-100' : 'opacity-50'}`} style={{ width: w }} />
                ))}
            </div>

            {/* Room card 1 — bigger grid */}
            <div className="space-y-6">
                <div className="bg-white/4 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    {/* Room header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="space-y-2">
                            <Sk className="h-5 w-32" />
                            <Sk className="h-3.5 w-48" />
                        </div>
                        <div className="flex gap-3">
                            <Sk className="h-6 w-20 rounded-full" />
                            <Sk className="h-6 w-20 rounded-full" />
                            <Sk className="h-6 w-20 rounded-full" />
                        </div>
                    </div>
                    {/* Seat grid */}
                    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(16, 1fr)' }}>
                        {[...Array(64)].map((_, i) => (
                            <Sk
                                key={i}
                                className={`rounded-md ${i % 7 === 0 ? 'opacity-40' : i % 5 === 0 ? 'opacity-20' : ''}`}
                                style={{ aspectRatio: '1 / 1' }}
                            />
                        ))}
                    </div>
                </div>

                {/* Room card 2 — smaller grid */}
                <div className="bg-white/4 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="space-y-2">
                            <Sk className="h-5 w-28" />
                            <Sk className="h-3.5 w-44" />
                        </div>
                        <div className="flex gap-3">
                            <Sk className="h-6 w-20 rounded-full" />
                            <Sk className="h-6 w-20 rounded-full" />
                            <Sk className="h-6 w-20 rounded-full" />
                        </div>
                    </div>
                    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(16, 1fr)' }}>
                        {[...Array(48)].map((_, i) => (
                            <Sk
                                key={i}
                                className={`rounded-md ${i % 9 === 0 ? 'opacity-30' : i % 4 === 0 ? 'opacity-15' : ''}`}
                                style={{ aspectRatio: '1 / 1' }}
                            />
                        ))}
                    </div>
                </div>

                {/* Floor Summary */}
                <div className="bg-white/4 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <Sk className="h-5 w-32 mb-5" />
                    <div className="grid grid-cols-3 gap-4">
                        {['from-white/10 to-white/5', 'from-red-500/15 to-red-400/5', 'from-green-500/15 to-green-400/5'].map((grad, i) => (
                            <div
                                key={i}
                                className="rounded-xl p-4 text-center border border-white/8"
                                style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
                            >
                                <Sk className="h-3 w-20 mx-auto mb-3" />
                                <Sk className="h-9 w-14 mx-auto" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seat legend */}
                <div className="flex items-center justify-center gap-6 py-2">
                    {[
                        { color: 'bg-green-500/30 border border-green-500/40', label: 'Available' },
                        { color: 'bg-red-500/30 border border-red-500/40', label: 'Occupied' },
                        { color: 'bg-white/10 border border-white/10', label: 'Your Seat' },
                    ].map(({ color, label }, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-md ${color}`} />
                            <Sk className="h-3 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY SKELETONS (kept for backward-compat, improved)
// ─────────────────────────────────────────────────────────────────────────────
const CardSkeleton = () => (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
            <Sk className="w-10 h-10 rounded-xl flex-shrink-0" />
            <Sk className="h-5 w-1/2" />
        </div>
        <Sk className="h-4 w-full mb-2" />
        <Sk className="h-4 w-5/6 mb-2" />
        <Sk className="h-4 w-4/6" />
    </div>
);

const StatsSkeleton = () => (
    <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-3">
                <Sk className="w-10 h-10 rounded-xl" />
                <Sk className="h-7 w-1/2" />
                <Sk className="h-3.5 w-3/4" />
            </div>
        ))}
    </div>
);

const TableSkeleton = () => (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
        <Sk className="h-6 w-1/4 mb-5" />
        <div className="grid grid-cols-4 gap-4 pb-3 border-b border-white/8">
            {[...Array(4)].map((_, i) => <Sk key={i} className="h-3" />)}
        </div>
        {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 py-3.5 border-b border-white/5 last:border-0">
                {[...Array(4)].map((_, j) => <Sk key={j} className="h-4" />)}
            </div>
        ))}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Lookup map + main component (backward-compat)
// ─────────────────────────────────────────────────────────────────────────────
const SKELETONS = {
    card: CardSkeleton,
    notification: NotificationSkeleton,
    chat: ChatSkeleton,
    profile: CardSkeleton,   // legacy – use ProfileSkeleton export instead
    stats: StatsSkeleton,
    table: TableSkeleton,
    dashboard: DashboardSkeleton,
    fee: FeeStatusSkeleton,
    attendance: AttendanceSkeleton,
    books: () => <BooksNotesPageSkeleton variant="books" />,
    notes: () => <BooksNotesPageSkeleton variant="notes" />,
    seat: SeatSkeleton,
    adminDashboard: AdminDashboardSkeleton,
    adminTable: AdminTableSkeleton,
};

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
    const Component = SKELETONS[type] || CardSkeleton;
    return (
        <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
                <Component key={i} />
            ))}
        </div>
    );
};

// ── Full-page generic skeleton (drop-in for any page) ────────────────────────
export const PageSkeleton = ({ title = '', subtitle = '' }) => (
    <div className="min-h-screen p-4 md:p-6 space-y-5 max-w-2xl mx-auto" style={{ background: '#050508' }}>
        {/* Back + Header */}
        <div className="flex items-center gap-3">
            <Sk className="w-24 h-9 rounded-xl" />
            <div className="h-5 w-px bg-white/10" />
            <Sk className="h-7 w-44 rounded-lg" />
        </div>

        {title && (
            <div className="space-y-1.5">
                <p className="text-xs text-gray-600 uppercase tracking-wider">{title}</p>
                {subtitle && <p className="text-xs text-gray-700">{subtitle}</p>}
            </div>
        )}

        {/* Filter bar */}
        <div className="flex gap-2">
            {[80, 100, 80].map((w, i) => (
                <Sk key={i} className="h-9 rounded-xl" style={{ width: w }} />
            ))}
        </div>

        {/* Notification-style rows */}
        <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
                <NotificationSkeleton key={i} />
            ))}
        </div>
    </div>
);

export default SkeletonLoader;
