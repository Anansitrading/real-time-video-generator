import React from 'react'
import { clsx } from 'clsx'

interface InputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  className?: string
  autoComplete?: string
  autoFocus?: boolean
}

export function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyDown,
  disabled = false,
  required = false,
  className,
  autoComplete,
  autoFocus = false
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      required={required}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      className={clsx(
        'w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg',
        'text-white placeholder-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'transition-all duration-200',
        'hover:border-gray-600',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    />
  )
}