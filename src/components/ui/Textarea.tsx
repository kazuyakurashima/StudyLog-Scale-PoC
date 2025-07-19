"use client"

import type React from "react"

interface TextareaProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  className?: string
  maxLength?: number
}

export const Textarea: React.FC<TextareaProps> = ({ value, onChange, placeholder, className = "", maxLength }) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-300 ${className}`}
    />
  )
}
