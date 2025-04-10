import React from 'react';

const ProgressCircle = ({ percentage, size = 40, strokeWidth = 4, color = '#FFC0CB' }) => {
  // Ensure percentage is between 0 and 100
  const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);
  
  // Calculate the radius and circumference
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Calculate the stroke-dashoffset based on percentage
  const offset = circumference - (normalizedPercentage / 100) * circumference;
  
  // Determine color based on percentage
  const getColor = () => {
    if (normalizedPercentage > 80) return '#EF4444'; // Red for high percentage
    if (normalizedPercentage > 50) return '#F59E0B'; // Orange for medium percentage
    return '#10B981'; // Green for low percentage
  };
  
  // Use the provided color or the dynamic color based on percentage
  const circleColor = color || getColor();
  
  // Determine text color based on background
  const getTextColor = () => {
    if (normalizedPercentage > 80) return 'text-red-600';
    if (normalizedPercentage > 50) return 'text-amber-600';
    return 'text-green-600';
  };
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle with subtle gradient */}
        <defs>
          <linearGradient id={`gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F3F4F6" />
            <stop offset="100%" stopColor="#E5E7EB" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#gradient-${size})`}
          strokeWidth={strokeWidth}
          fill="none"
          className="drop-shadow-sm"
        />
        
        {/* Progress circle with gradient */}
        <defs>
          <linearGradient id={`progress-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={circleColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={circleColor} stopOpacity="1" />
          </linearGradient>
        </defs>
        
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#progress-gradient-${size})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      
      {/* Percentage text with dynamic color */}
      <span className={`absolute text-xs font-semibold ${getTextColor()}`}>
        {Math.round(normalizedPercentage)}%
      </span>
      
      {/* Optional: Add a subtle glow effect for high percentages */}
      {normalizedPercentage > 80 && (
        <div className="absolute inset-0 rounded-full bg-red-100 opacity-20 animate-pulse"></div>
      )}
    </div>
  );
};

export default ProgressCircle; 