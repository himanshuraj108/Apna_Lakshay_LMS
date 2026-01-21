const SkeletonLoader = ({ type = 'card', count = 1 }) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return (
                    <div className="card">
                        <div className="skeleton h-6 w-3/4 mb-4 rounded"></div>
                        <div className="skeleton h-4 w-full mb-2 rounded"></div>
                        <div className="skeleton h-4 w-5/6 rounded"></div>
                    </div>
                );
            case 'table':
                return (
                    <div className="glass rounded-xl p-6">
                        <div className="skeleton h-8 w-1/4 mb-4 rounded"></div>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="skeleton h-12 w-full mb-2 rounded"></div>
                        ))}
                    </div>
                );
            case 'text':
                return (
                    <div className="space-y-2">
                        <div className="skeleton h-4 w-full rounded"></div>
                        <div className="skeleton h-4 w-5/6 rounded"></div>
                        <div className="skeleton h-4 w-4/6 rounded"></div>
                    </div>
                );
            default:
                return <div className="skeleton h-20 w-full rounded-xl"></div>;
        }
    };

    return (
        <div className="space-y-4">
            {[...Array(count)].map((_, index) => (
                <div key={index}>{renderSkeleton()}</div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
