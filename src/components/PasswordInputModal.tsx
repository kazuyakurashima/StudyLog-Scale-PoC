"use client"

import { useState } from 'react'
import type { RoleType } from '../lib/roleAuth'
import { verifyPassword, resetPassword } from '../lib/roleAuth'

interface PasswordInputModalProps {
  userId: string
  roleType: RoleType
  onSuccess: () => void
  onCancel: () => void
}

export default function PasswordInputModal({ userId, roleType, onSuccess, onCancel }: PasswordInputModalProps) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError('パスワードを入力してください')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const isValid = verifyPassword(userId, roleType, password)
      
      if (isValid) {
        // セッション管理は使用しないため、setAuthSessionは呼び出さない
        onSuccess()
      } else {
        setError('パスワードが正しくありません')
      }
    } catch (error) {
      console.error('パスワード認証エラー:', error)
      setError('認証に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = () => {
    resetPassword(userId, roleType)
    onCancel() // モーダルを閉じて、パスワード設定画面が表示されるようにする
  }

  const getRoleLabel = (role: RoleType) => {
    return role === 'parent' ? '保護者' : '指導者'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            🔐 パスワード入力
          </h2>
          <p className="text-slate-600">
            {getRoleLabel(roleType)}モードにアクセスするためのパスワードを入力してください
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
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder="パスワードを入力してください"
              autoFocus
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
              {loading ? '認証中...' : 'ログイン'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-700 mb-3">
            ⚠️ パスワードを忘れた場合は、下のボタンでリセットできます。
          </p>
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-sm text-amber-600 hover:text-amber-800 underline font-medium"
            >
              パスワードをリセットする
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-600 font-medium">
                本当にパスワードをリセットしますか？新しいパスワードの設定が必要になります。
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-all"
                >
                  はい、リセット
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1 bg-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-300 transition-all"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}