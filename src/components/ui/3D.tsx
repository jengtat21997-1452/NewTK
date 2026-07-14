import React from 'react';
import { cn } from '../../lib/utils';

interface Button3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button3D: React.FC<Button3DProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  children, 
  ...props 
}) => {
  const baseClasses = "relative inline-flex items-center justify-center font-bold transition-all duration-150 ease-in-out rounded-xl active:translate-y-[4px] active:shadow-none select-none";
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-8 py-3 text-lg",
    icon: "p-3 flex items-center justify-center",
  };

  const variantClasses = {
    primary: "bg-indigo-600 text-white shadow-[0_4px_0_0_rgb(49,46,129)] dark:shadow-[0_4px_0_0_rgb(30,27,75)] hover:bg-indigo-500",
    secondary: "bg-slate-200 text-slate-800 shadow-[0_4px_0_0_rgb(148,163,184)] border border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:shadow-[0_4px_0_0_rgb(15,23,42)] dark:border-slate-700 dark:hover:bg-slate-700",
    danger: "bg-red-500 text-white shadow-[0_4px_0_0_rgb(153,27,27)] dark:bg-red-900/80 dark:text-red-100 dark:shadow-[0_4px_0_0_rgb(69,10,10)] dark:border dark:border-red-800/50 hover:bg-red-400 dark:hover:bg-red-800",
    success: "bg-emerald-500 text-white shadow-[0_4px_0_0_rgb(6,95,70)] dark:bg-emerald-600/80 dark:text-emerald-100 dark:shadow-[0_4px_0_0_rgb(6,78,59)] dark:border dark:border-emerald-800/50 hover:bg-emerald-400 dark:hover:bg-emerald-500",
    outline: "bg-white text-slate-700 border border-slate-300 shadow-[0_4px_0_0_rgb(203,213,225)] hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:shadow-[0_4px_0_0_rgb(15,23,42)] dark:hover:bg-slate-800",
  };

  return (
    <button 
      className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)} 
      {...props}
    >
      {children}
    </button>
  );
};

export const Card3D: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-2xl border border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] p-5 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:shadow-[0_8px_0_rgb(15,23,42)] dark:text-slate-200",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
