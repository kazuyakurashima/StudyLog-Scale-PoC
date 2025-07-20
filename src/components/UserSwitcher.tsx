import { useState } from 'react'

export type UserRole = 'student' | 'parent' | 'teacher'

interface UserSwitcherProps {
  currentRole: UserRole
  onRoleChange: (role: UserRole) => void
}

export default function UserSwitcher({ currentRole, onRoleChange }: UserSwitcherProps) {
  const roles = [
    {
      key: 'student' as const,
      label: '生徒',
      icon: '👧',
      description: '学習記録をつける',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    {
      key: 'parent' as const,
      label: '保護者',
      icon: '👨‍👩‍👧‍👦',
      description: '子どもの学習を応援',
      color: 'from-pink-400 to-pink-600',
      bgColor: 'bg-pink-50 border-pink-200'
    },
    {
      key: 'teacher' as const,
      label: '指導者',
      icon: '👨‍🏫',
      description: '生徒の学習を指導',
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50 border-green-200'
    }
  ]

  const getCurrentRoleInfo = () => {
    return roles.find(role => role.key === currentRole) || roles[0]
  }

  return (
    <div className="space-y-6">
      {/* 現在の役割表示 */}
      <div className="text-center">
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 ${getCurrentRoleInfo().bgColor}`}>
          <span className="text-2xl">{getCurrentRoleInfo().icon}</span>
          <div className="text-left">
            <div className="font-bold text-lg">現在: {getCurrentRoleInfo().label}モード</div>
            <div className="text-sm text-slate-600">{getCurrentRoleInfo().description}</div>
          </div>
        </div>
      </div>

      {/* 役割切り替えボタン */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {roles.map((role) => (
          <button
            key={role.key}
            onClick={() => onRoleChange(role.key)}
            className={`p-6 rounded-2xl border-2 transition-all duration-200 text-center ${
              currentRole === role.key
                ? `${role.bgColor} border-current shadow-lg scale-105`
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="text-4xl mb-3">{role.icon}</div>
            <div className="font-bold text-lg mb-1">{role.label}として見る</div>
            <div className="text-sm text-slate-600">{role.description}</div>
          </button>
        ))}
      </div>

      {/* 説明 */}
      <div className="text-center text-sm text-slate-500">
        <p>役割を選択すると、それぞれに適した画面が表示されます</p>
      </div>
    </div>
  )
} 