import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={cn(
          'w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 transition-all duration-200',
          error
            ? 'border-red-500/50 focus:border-red-500/80'
            : 'border-white/10 focus:border-violet-500/50',
          className
        )}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        {...props}
        className={cn(
          'w-full rounded-xl border bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 transition-all duration-200 resize-none',
          error
            ? 'border-red-500/50 focus:border-red-500/80'
            : 'border-white/10 focus:border-violet-500/50',
          className
        )}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <select
        id={inputId}
        {...props}
        className={cn(
          'w-full rounded-xl border bg-gray-900 px-3 py-2.5 text-sm text-white transition-all duration-200 appearance-none',
          error
            ? 'border-red-500/50 focus:border-red-500/80'
            : 'border-white/10 focus:border-violet-500/50',
          className
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
