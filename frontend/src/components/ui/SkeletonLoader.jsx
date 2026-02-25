/* ─── SkeletonLoader ────────────────────────────────────────────────────────
   A collection of skeleton placeholders that mimic real page layouts,
   making loading feel instant even on slow connections.
   ─────────────────────────────────────────────────────────────────────────── */

const Sk = ({ className = '' }) => (
    <div className={`skeleton rounded-lg ${className}`} />
);

// ── Individual skeleton shapes ──────────────────────────────────────────────

const CardSkeleton = () => (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
        <Sk className="h-5 w-1/2 mb-4" />
        <Sk className="h-4 w-full mb-2" />
        <Sk className="h-4 w-5/6" />
    </div>
);

const NotificationSkeleton = () => (
    <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/8 rounded-2xl">
        {/* Icon circle */}
        <Sk className="w-11 h-11 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
                <Sk className="h-4 w-2/5" />
                <Sk className="h-3 w-16" />
            </div>
            <Sk className="h-3.5 w-full" />
            <Sk className="h-3.5 w-3/4" />
        </div>
    </div>
);

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
    </div>
);

const ProfileSkeleton = () => (
    <div className="flex flex-col items-center gap-6 p-6">
        <Sk className="w-28 h-28 rounded-full" />
        <div className="w-full space-y-3">
            <Sk className="h-5 w-1/3 mx-auto" />
            <Sk className="h-4 w-1/2 mx-auto" />
        </div>
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/8 rounded-xl">
                <Sk className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Sk className="h-3 w-1/4" />
                    <Sk className="h-4 w-1/2" />
                </div>
            </div>
        ))}
    </div>
);

const StatsSkeleton = () => (
    <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white/5 border border-white/8 rounded-2xl p-4 space-y-3">
                <Sk className="w-10 h-10 rounded-xl" />
                <Sk className="h-7 w-1/2" />
                <Sk className="h-3.5 w-3/4" />
            </div>
        ))}
    </div>
);

const TableSkeleton = () => (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
        <Sk className="h-6 w-1/4 mb-5" />
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 mb-3">
                <Sk className="h-10 flex-1" />
            </div>
        ))}
    </div>
);

// ── Lookup map ──────────────────────────────────────────────────────────────

const SKELETONS = {
    card: CardSkeleton,
    notification: NotificationSkeleton,
    chat: ChatSkeleton,
    profile: ProfileSkeleton,
    stats: StatsSkeleton,
    table: TableSkeleton,
};

// ── Main component ──────────────────────────────────────────────────────────

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

// ── Full-page skeleton (drop-in replacement for a whole loading page) ────────

export const PageSkeleton = ({ title = '', subtitle = '' }) => (
    <div className="min-h-screen p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
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
