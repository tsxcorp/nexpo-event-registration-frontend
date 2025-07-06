import { FC } from 'react';
import Image from 'next/image';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showLogo?: boolean;
  text?: string;
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  showLogo = false,
  text
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const logoSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  if (showLogo) {
    return (
      <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
        {/* Logo with pulsing animation */}
        <div className="relative">
          <div className={`${logoSizes[size]} relative animate-pulse`}>
            <Image
              src="/nexpo-logo.png"
              alt="Nexpo Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          {/* Spinning ring around logo */}
          <div className={`absolute inset-0 ${logoSizes[size]} animate-spin rounded-full border-2 border-blue-500 border-t-transparent opacity-60`} />
        </div>
        
        {/* Loading text */}
        {text && (
          <p className="text-gray-600 text-sm font-medium animate-pulse">
            {text}
          </p>
        )}
        
        {/* Loading dots animation */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} animate-spin rounded-full border-2 border-current border-t-transparent`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

export default LoadingSpinner; 