const Badge = ({ children, variant = 'green', className = '' }) => {
    const variants = {
        green: 'badge-green',
        red: 'badge-red',
        yellow: 'badge-yellow'
    };

    return (
        <span className={`${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
