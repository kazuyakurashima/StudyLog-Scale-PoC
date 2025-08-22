// 保護者・指導者モード用のパスワード認証機能

export type RoleType = 'parent' | 'teacher'

// 簡易的なハッシュ化（学習用アプリのため）
const simpleHash = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32bit整数に変換
  }
  return hash.toString()
}

// パスワードが設定済みかチェック
export const isPasswordSet = (userId: string, roleType: RoleType): boolean => {
  const key = `password_${userId}_${roleType}`
  return localStorage.getItem(key) !== null
}

// パスワードを設定
export const setPassword = (userId: string, roleType: RoleType, password: string): void => {
  const key = `password_${userId}_${roleType}`
  const hashedPassword = simpleHash(password)
  localStorage.setItem(key, hashedPassword)
}

// パスワードを検証
export const verifyPassword = (userId: string, roleType: RoleType, password: string): boolean => {
  const key = `password_${userId}_${roleType}`
  const storedHash = localStorage.getItem(key)
  if (!storedHash) return false
  
  const hashedPassword = simpleHash(password)
  return storedHash === hashedPassword
}

// パスワードをリセット（管理用）
export const resetPassword = (userId: string, roleType: RoleType): void => {
  const key = `password_${userId}_${roleType}`
  localStorage.removeItem(key)
}

// 認証状態を一時的に保存（セッション中のみ有効）
const authSessionKey = (userId: string, roleType: RoleType) => `auth_${userId}_${roleType}`

export const setAuthSession = (userId: string, roleType: RoleType): void => {
  const key = authSessionKey(userId, roleType)
  sessionStorage.setItem(key, 'authenticated')
}

export const isAuthenticated = (userId: string, roleType: RoleType): boolean => {
  const key = authSessionKey(userId, roleType)
  return sessionStorage.getItem(key) === 'authenticated'
}

export const clearAuthSession = (userId: string, roleType: RoleType): void => {
  const key = authSessionKey(userId, roleType)
  sessionStorage.removeItem(key)
}