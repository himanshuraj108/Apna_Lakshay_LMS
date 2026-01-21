import { motion } from 'framer-motion';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    type = 'button',
    disabled = false,
    className = '',
    ...props
}) => {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300',
        success: 'bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300'
    };

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default Button;
