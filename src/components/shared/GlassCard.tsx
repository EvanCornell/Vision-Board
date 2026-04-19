import React from 'react';
import { cn } from '../../utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hover = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-200',
        hover &&
          'cursor-pointer hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-violet-500/10',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
