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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* ナビゲーション */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex justify-center gap-2 flex-wrap flex-1">
              {/* 現在の役割表示 */}
              <div className="flex items-center gap-4 mr-4">
                <span className="text-sm font-medium text-slate-600">
                  {user!.name}さん
                </span>
                <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  role === 'student' ? 'bg-blue-100 text-blue-800' :
                  role === 'parent' ? 'bg-pink-100 text-pink-800' :
                  'bg-green-100 text-green-800'
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
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentView === 'dashboard' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📊 ダッシュボード
                  </button>
                  <button
                    onClick={() => setCurrentView('form')}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentView === 'form' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📝 学習記録
                  </button>
                  <button
                    onClick={() => setCurrentView('history')}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentView === 'history' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📚 学習履歴
                  </button>
                  <button
                    onClick={() => setCurrentView('reflection')}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentView === 'reflection' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🤔 振り返り
                  </button>
                </>
              )}

              {(role === 'parent' || role === 'teacher') && (
                <>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentView === 'dashboard' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📊 進捗確認
                  </button>
                  <button
                    onClick={() => setCurrentView('feedback')}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentView === 'feedback' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    💌 フィードバック
                  </button>
                  <button
                    onClick={() => setCurrentView('history')}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentView === 'history' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📚 学習履歴
                  </button>
                  <button
                    onClick={() => setCurrentView('reflection')}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentView === 'reflection' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🤔 振り返り
                  </button>
                </>
              )}
            </div>

            {/* ログアウトボタン */}
            <button
              onClick={logout}
              className="px-3 py-2 rounded-lg font-medium transition-colors text-sm bg-red-100 text-red-700 hover:bg-red-200"
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
