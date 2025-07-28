import React from 'react';

interface CustomLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CustomLogo({ className = '', size = 'md' }: CustomLogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`relative ${className} animate-float`}>
      <svg
        className={`${sizeClasses[size]} transition-transform duration-300 hover:scale-110`}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Replace this with your custom logo design */}
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="url(#gradient)"
          className="animate-spin-slow"
        />
        
        {/* Your custom logo path here - replace with your design */}
        <path
          d="M12 8L20 16L28 8L20 0L12 8Z"  // Example: diamond shape
          fill="white"
          className="animate-pulse"
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
    </div>
  );
} 