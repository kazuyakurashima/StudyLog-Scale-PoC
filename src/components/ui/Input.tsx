"use client"

import type React from "react"

interface InputProps {
  id?: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  min?: string
  max?: string
  required?: boolean
}

export const Input: React.FC<InputProps> = ({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  min,
  max,
  required = false,
}) => {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      required={required}
      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors duration-300 ${className}`}
    />
  )
}
