"use client"

import type React from "react"

interface Emotion {
  value: string
  emoji: string
  label: string
  color: string
}

interface EmotionButtonProps {
  emotion: Emotion
  isSelected: boolean
  onClick: () => void
}

export const EmotionButton: React.FC<EmotionButtonProps> = ({ emotion, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`p-6 sm:p-8 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
        isSelected
          ? `bg-gradient-to-r ${emotion.color} text-white border-transparent shadow-lg`
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
    >
      <div className="text-4xl sm:text-5xl mb-3">{emotion.emoji}</div>
      <div className="font-bold text-sm sm:text-base">{emotion.label}</div>
    </button>
  )
}
