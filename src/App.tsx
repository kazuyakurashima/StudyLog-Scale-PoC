import { useState } from "react"
import StudyRecordForm from "./components/StudyRecordForm"
import Dashboard from "./components/Dashboard"
import FeedbackPage from "./components/FeedbackPage"
import HistoryPage from "./components/HistoryPage"
import ReflectionPage from "./components/ReflectionPage"
import { LoginPage } from "./components/LoginPage"
import { RoleSelectPage } from "./components/RoleSelectPage"
import { useAuth } from "./lib/useAuth"
import "./App.css"
import "./styles/animations.css"

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'feedback' | 'history' | 'reflection'>('dashboard')
  const { isAuthenticated, user, role, login, selectRole, logout } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />
  }

  if (!role) {
    return <RoleSelectPage user={user!} onRoleSelect={selectRole} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-100">
      {/* ナビゲーション */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-stone-200/60 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex justify-center gap-2 flex-wrap flex-1">
              {/* 現在の役割表示 */}
              <div className="flex items-center gap-4 mr-4">
                <span className="harmonious-text-sm font-medium">
                  {user!.name}さん
                </span>
                <div className={`harmonious-badge ${
                  role === 'student' ? 'harmonious-badge-student' :
                  role === 'parent' ? 'harmonious-badge-parent' :
                  'harmonious-badge-teacher'
                }`}>
                  {role === 'student' ? '👧 生徒' :
                   role === 'parent' ? '👨‍👩‍👧‍👦 保護者' :
                   '👨‍🏫 指導者'}モード
                </div>
              </div>

              {/* ナビゲーションボタン */}
              {role === 'student' && (
                <>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={currentView === 'dashboard' ? 'harmonious-button-primary' : 'harmonious-button-secondary'}
                  >
                    📊 ダッシュボード
                  </button>
                  <button
                    onClick={() => setCurrentView('form')}
                    className={currentView === 'form' ? 'harmonious-button-primary' : 'harmonious-button-secondary'}
                  >
                    📝 学習記録
                  </button>
                  <button
                    onClick={() => setCurrentView('history')}
                    className={currentView === 'history' ? 'harmonious-button-primary' : 'harmonious-button-secondary'}
                  >
                    📚 学習履歴
                  </button>
                  <button
                    onClick={() => setCurrentView('reflection')}
                    className={currentView === 'reflection' ? 'harmonious-button-primary' : 'harmonious-button-secondary'}
                  >
                    🤔 振り返り
                  </button>
                </>
              )}

              {(role === 'parent' || role === 'teacher') && (
                <>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={currentView === 'dashboard' ? 'harmonious-button-primary' : 'harmonious-button-secondary'}
                  >
                    📊 ダッシュボード
                  </button>
                  <button
                    onClick={() => setCurrentView('feedback')}
                    className={currentView === 'feedback' ? 'harmonious-button-primary' : 'harmonious-button-secondary'}
                  >
                    💌 フィードバック
                  </button>
                  <button
                    onClick={() => setCurrentView('history')}
                    className={currentView === 'history' ? 'harmonious-button-primary' : 'harmonious-button-secondary'}
                  >
                    📚 学習履歴
                  </button>
                  <button
                    onClick={() => setCurrentView('reflection')}
                    className={currentView === 'reflection' ? 'harmonious-button-primary' : 'harmonious-button-secondary'}
                  >
                    🤔 振り返り
                  </button>
                </>
              )}
            </div>

            {/* ログアウトボタン */}
            <button
              onClick={logout}
              className="harmonious-button-secondary border border-red-200 text-red-600 hover:bg-red-50"
            >
              🚪 ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'form' && <StudyRecordForm />}
      {currentView === 'feedback' && (
        <FeedbackPage userRole={role === 'parent' ? 'parent' : 'teacher'} />
      )}
      {currentView === 'history' && <HistoryPage />}
      {currentView === 'reflection' && (
        <ReflectionPage userRole={role} />
      )}
    </div>
  )
}

export default App
