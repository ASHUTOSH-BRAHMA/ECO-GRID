import React from 'react';
import { motion } from 'framer-motion';
import {
    ChevronRight,
    ArrowRight,
    Info,
    AlertTriangle,
    CheckCircle,
    X,
    Loader,
    Sun,
    Moon,
    Upload,
    Download,
    Zap,
    Wind,
    BarChart3
} from 'lucide-react';

/**
 * Button Component
 */
export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'right',
    className = '',
    ...props
}) => {
    // Variants
    const variants = {
        primary: 'bg-green-600 hover:bg-green-700 text-white',
        secondary: 'bg-white text-green-700 border border-green-600 hover:bg-green-50',
        outline: 'bg-transparent border-2 border-white text-white hover:bg-white/10',
        ghost: 'bg-transparent text-green-600 hover:bg-green-100/50',
        danger: 'bg-red-600 hover:bg-red-700 text-white'
    };

    // Sizes
    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
        xl: 'px-8 py-4 text-lg font-semibold'
    };

    return (
        <motion.button
            className={`flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            {...props}
        >
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
        </motion.button>
    );
};

/**
 * Card Component
 */
export const Card = ({
    children,
    title,
    subtitle,
    className = '',
    accent = false,
    ...props
}) => {
    return (
        <motion.div
            className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{
                y: -5,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            {...props}
        >
            {accent && <div className="h-2 bg-gradient-to-r from-green-400 to-green-600" />}
            <div className="p-6">
                {title && <h3 className="text-xl font-bold text-gray-900">{title}</h3>}
                {subtitle && <p className="text-gray-600 mt-1 mb-4">{subtitle}</p>}
                {children}
            </div>
        </motion.div>
    );
};

/**
 * Alert Component
 */
export const Alert = ({
    children,
    title,
    type = 'info',
    onClose,
    className = '',
    ...props
}) => {
    const types = {
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            icon: <Info className="w-5 h-5 text-blue-500" />
        },
        success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-800',
            icon: <CheckCircle className="w-5 h-5 text-green-500" />
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            text: 'text-yellow-800',
            icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            icon: <AlertTriangle className="w-5 h-5 text-red-500" />
        }
    };

    return (
        <motion.div
            className={`${types[type].bg} ${types[type].border} ${types[type].text} border rounded-lg p-4 ${className}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            {...props}
        >
            <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                    {types[type].icon}
                </div>
                <div className="ml-3 flex-1">
                    {title && <h3 className="text-sm font-medium">{title}</h3>}
                    <div className="text-sm mt-1">{children}</div>
                </div>
                {onClose && (
                    <button
                        type="button"
                        className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-md hover:bg-opacity-20 hover:bg-gray-500 focus:outline-none"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

/**
 * Loading Spinner
 */
export const Spinner = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12'
    };

    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
            }}
            className={`${sizes[size]} ${className}`}
        >
            <Loader className="w-full h-full text-green-600" />
        </motion.div>
    );
};

/**
 * Badge Component
 */
export const Badge = ({
    children,
    variant = 'default',
    size = 'md',
    className = '',
    ...props
}) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-green-100 text-green-800',
        secondary: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        danger: 'bg-red-100 text-red-800',
        warning: 'bg-yellow-100 text-yellow-800'
    };

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-base'
    };

    return (
        <span
            className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};

/**
 * Tooltip Component
 */
export const Tooltip = ({
    children,
    content,
    position = 'top',
    className = '',
    ...props
}) => {
    const [isVisible, setIsVisible] = React.useState(false);

    const positions = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    const arrows = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800'
    };

    return (
        <div className="relative inline-block" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
            {children}

            {isVisible && (
                <motion.div
                    className={`absolute z-10 ${positions[position]} px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap ${className}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    {...props}
                >
                    {content}
                    <div className={`absolute w-0 h-0 border-4 border-transparent ${arrows[position]}`}></div>
                </motion.div>
            )}
        </div>
    );
};

/**
 * Toggle/Switch Component
 */
export const Toggle = ({
    isOn = false,
    onChange,
    size = 'md',
    disabled = false,
    labelOn = '',
    labelOff = '',
    ...props
}) => {
    const sizes = {
        sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translateX: 16 },
        md: { track: 'w-10 h-5', thumb: 'w-4 h-4', translateX: 20 },
        lg: { track: 'w-12 h-6', thumb: 'w-5 h-5', translateX: 24 }
    };

    return (
        <div className="flex items-center gap-2" {...props}>
            {labelOff && !isOn && <span className="text-sm text-gray-700">{labelOff}</span>}
            <button
                type="button"
                className={`relative inline-flex ${sizes[size].track} flex-shrink-0 rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none
          ${isOn ? 'bg-green-600' : 'bg-gray-200'} 
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="switch"
                aria-checked={isOn}
                disabled={disabled}
                onClick={() => !disabled && onChange(!isOn)}
            >
                <span className="sr-only">Use setting</span>
                <motion.span
                    className={`${sizes[size].thumb} rounded-full bg-white shadow-md transform ring-0 transition ease-in-out duration-200 pointer-events-none`}
                    animate={{
                        x: isOn ? sizes[size].translateX : 0
                    }}
                >
                    {size === 'lg' && (
                        <span className="flex items-center justify-center h-full w-full text-xs">
                            {isOn ? <Sun className="w-3 h-3 text-yellow-500" /> : <Moon className="w-3 h-3 text-blue-700" />}
                        </span>
                    )}
                </motion.span>
            </button>
            {labelOn && isOn && <span className="text-sm text-gray-700">{labelOn}</span>}
        </div>
    );
};

/**
 * Progress Bar Component
 */
export const ProgressBar = ({
    value = 0,
    max = 100,
    height = 'md',
    variant = 'primary',
    showLabel = false,
    animate = true,
    className = '',
    ...props
}) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const heights = {
        xs: 'h-1',
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
        xl: 'h-5'
    };

    const variants = {
        primary: 'bg-green-600',
        secondary: 'bg-blue-600',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-600',
        gradient: 'bg-gradient-to-r from-green-400 to-green-600'
    };

    return (
        <div className={`w-full ${className}`} {...props}>
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-medium text-gray-700">{percentage.toFixed(0)}%</span>
                </div>
            )}
            <div className={`w-full ${heights[height]} bg-gray-200 rounded-full overflow-hidden`}>
                <motion.div
                    className={`${heights[height]} ${variants[variant]} rounded-full`}
                    style={{ width: animate ? '0%' : `${percentage}%` }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
        </div>
    );
};

/**
 * File Upload Component
 */
export const FileUpload = ({
    onFileSelect,
    accept = '*',
    multiple = false,
    maxSize = 5, // in MB
    className = '',
    ...props
}) => {
    const [dragActive, setDragActive] = React.useState(false);
    const [error, setError] = React.useState(null);
    const inputRef = React.useRef(null);

    const handleFiles = (files) => {
        let validFiles = [];
        setError(null);

        Array.from(files).forEach(file => {
            if (file.size > maxSize * 1024 * 1024) {
                setError(`File '${file.name}' exceeds maximum size (${maxSize}MB)`);
                return;
            }
            validFiles.push(file);
        });

        if (validFiles.length > 0) {
            onFileSelect(multiple ? validFiles : validFiles[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    return (
        <div className={`w-full ${className}`} {...props}>
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-500 hover:bg-green-50'}`}
                onClick={() => inputRef.current.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex text-sm text-gray-600">
                    <label className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500">
                        <span>Upload a file</span>
                        <input
                            ref={inputRef}
                            type="file"
                            className="sr-only"
                            accept={accept}
                            multiple={multiple}
                            onChange={handleChange}
                        />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    {multiple ? 'Files' : 'File'} up to {maxSize}MB
                </p>
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

/**
 * Energy Stats Card Component
 */
export const EnergyStatsCard = ({
    title,
    value,
    icon,
    change,
    changeType = 'positive',
    className = '',
    ...props
}) => {
    return (
        <Card className={`${className}`} {...props}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>

                    {change && (
                        <div className={`flex items-center mt-2 text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                            <span className="flex items-center">
                                <ChevronRight className={`h-4 w-4 ${changeType === 'positive' ? 'rotate-90' : '-rotate-90'}`} />
                                {change}
                            </span>
                        </div>
                    )}
                </div>

                <div className="p-3 bg-green-100 rounded-lg text-green-600">
                    {icon || <BarChart3 className="h-6 w-6" />}
                </div>
            </div>
        </Card>
    );
};

/**
 * Energy Source Component
 */
export const EnergySource = ({
    type = 'solar',
    name = 'Solar Energy',
    percentage = 30,
    color = 'green',
    className = '',
    ...props
}) => {
    const iconMap = {
        solar: <Sun className="w-6 h-6" />,
        wind: <Wind className="w-6 h-6" />,
        hydro: <Zap className="w-6 h-6" />,
    };

    const colorMap = {
        green: {
            light: 'bg-green-100',
            text: 'text-green-700',
            progress: 'bg-green-500'
        },
        blue: {
            light: 'bg-blue-100',
            text: 'text-blue-700',
            progress: 'bg-blue-500'
        },
        yellow: {
            light: 'bg-yellow-100',
            text: 'text-yellow-700',
            progress: 'bg-yellow-500'
        },
        purple: {
            light: 'bg-purple-100',
            text: 'text-purple-700',
            progress: 'bg-purple-500'
        }
    };

    const colors = colorMap[color];

    return (
        <div className={`flex items-center p-3 rounded-lg bg-white ${className}`} {...props}>
            <div className={`p-2 ${colors.light} rounded-lg ${colors.text} mr-3`}>
                {iconMap[type] || iconMap.solar}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm text-gray-900">{name}</span>
                    <span className="text-sm text-gray-500">{percentage}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full">
                    <motion.div
                        className={`h-2 rounded-full ${colors.progress}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                </div>
            </div>
        </div>
    );
};

/**
 * Download Button
 */
export const DownloadButton = ({
    children,
    filename,
    className = '',
    ...props
}) => {
    return (
        <motion.button
            className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ${className}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            {...props}
        >
            <Download className="w-4 h-4" />
            {children || 'Download'}
        </motion.button>
    );
};

/**
 * Data Display Card
 */
export const DataDisplay = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    trendValue,
    className = '',
    ...props
}) => {
    return (
        <Card className={`${className}`} {...props}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold">{value}</h3>
                        {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
                    </div>

                    {trend && trendValue && (
                        <div className={`mt-2 flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            <ChevronRight className={`h-4 w-4 ${trend === 'up' ? 'rotate-90' : '-rotate-90'}`} />
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>

                {icon && (
                    <div className="p-3 bg-green-100 rounded-lg text-green-600">
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
};

/**
 * AnimatedCounter Component
 */
export const AnimatedCounter = ({
    from = 0,
    to,
    duration = 2,
    className = '',
    ...props
}) => {
    const nodeRef = React.useRef(null);
    const [count, setCount] = React.useState(from);

    React.useEffect(() => {
        let startTimestamp;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
            setCount(Math.floor(progress * (to - from) + from));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [from, to, duration]);

    return (
        <span className={className} ref={nodeRef} {...props}>
            {count.toLocaleString()}
        </span>
    );
};

/**
 * Export all components as a group
 */
export const Utils = {
    Button,
    Card,
    Alert,
    Spinner,
    Badge,
    Tooltip,
    Toggle,
    ProgressBar,
    FileUpload,
    EnergyStatsCard,
    EnergySource,
    DownloadButton,
    DataDisplay,
    AnimatedCounter
};

export default Utils;