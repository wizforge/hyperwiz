import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`relative ${className} animate-float`}>
      <Image
        src="/logo.png"  // Change this to your new logo filename
        alt="HyperWiz Logo"
        width={48}
        height={48}
        className={`${sizeClasses[size]} object-contain transition-transform duration-300 hover:scale-110`}
        priority
      />
      
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
    </div>
  );
} 