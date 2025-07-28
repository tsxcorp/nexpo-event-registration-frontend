'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface PoweredByFooterProps {
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

export default function PoweredByFooter({ 
  className = '', 
  variant = 'default' 
}: PoweredByFooterProps) {
  const currentYear = new Date().getFullYear();

  const baseClasses = "bg-white/95 backdrop-blur-sm border-t border-gray-100";
  const variantClasses = {
    default: "py-2 px-6",
    compact: "py-1 px-4", 
    minimal: "py-0 px-4"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center space-y-0 text-center">
          
          {/* Copyright Text */}
          <div className="flex flex-row items-center justify-center gap-1 text-[9px] text-gray-500">
            <span>© {currentYear} Nexpo.vn – All rights reserved.</span>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1">
              <span>Powered by</span>
              {/* Nexpo Logo - Clickable link */}
              <Link 
                href="https://nexpo.vn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center w-5 h-5 hover:opacity-80 transition-opacity duration-200"
              >
                <Image
                  src="/nexpo-logo.png"
                  alt="Nexpo Vietnam"
                  width={16}
                  height={16}
                  className="object-contain hover:scale-110 transition-transform duration-200"
                  priority={false}
                  onError={(e) => {
                    // Hide logo if it fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </Link>
            </div>
          </div>


          
        </div>
      </div>
    </div>
  );
} 