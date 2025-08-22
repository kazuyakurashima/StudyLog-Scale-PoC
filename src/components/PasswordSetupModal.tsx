"use client"

import { useState } from 'react'
import type { RoleType } from '../lib/roleAuth'
import { setPassword, setAuthSession } from '../lib/roleAuth'

interface PasswordSetupModalProps {
  userId: string
  roleType: RoleType
  onSuccess: () => void
  onCancel: () => void
}

export default function PasswordSetupModal({ userId, roleType, onSuccess, onCancel }: PasswordSetupModalProps) {
  const [password, setPasswordValue] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError('パスワードを入力してください')
      return
    }

    if (password.length < 4) {
      setError('パスワードは4文字以上で設定してください')
      return
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      setPassword(userId, roleType, password)
      // セッション管理は使用しないため、setAuthSessionは呼び出さない
      
      onSuccess()
    } catch (error) {
      console.error('パスワード設定エラー:', error)
      setError('パスワードの設定に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: RoleType) => {
    return role === 'parent' ? '保護者' : '指導者'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            🔒 パスワード設定
          </h2>
          <p className="text-slate-600">
            {getRoleLabel(roleType)}モード用のパスワードを設定してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPasswordValue(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder="4文字以上で入力してください"
              minLength={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              パスワード確認
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder="同じパスワードを再入力してください"
              minLength={4}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 border-2 border-slate-200 text-slate-600 rounded-xl hover:border-slate-300 transition-all"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '設定中...' : '設定完了'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-700">
            💡 設定したパスワードは次回以降、{getRoleLabel(roleType)}モードにアクセスする際に必要になります。
          </p>
        </div>
      </div>
    </div>
  )
}