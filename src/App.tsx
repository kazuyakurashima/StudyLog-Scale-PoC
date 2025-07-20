import { useState } from "react"
import StudyRecordForm from "./components/StudyRecordForm"
import Dashboard from "./components/Dashboard"
import FeedbackPage from "./components/FeedbackPage"
import UserSwitcher, { type UserRole } from "./components/UserSwitcher"
import "./App.css"

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'feedback' | 'userSwitch'>('dashboard')
  const [userRole, setUserRole] = useState<UserRole>('student')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* ナビゲーション */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-center gap-2 flex-wrap">
            {/* 現在の役割表示 */}
            <div className="flex items-center gap-4 mr-4">
              <span className="text-sm font-medium text-slate-600">現在:</span>
              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                userRole === 'student' ? 'bg-blue-100 text-blue-800' :
                userRole === 'parent' ? 'bg-pink-100 text-pink-800' :
                'bg-green-100 text-green-800'
              }`}>
                {userRole === 'student' ? '👧 生徒' :
                 userRole === 'parent' ? '👨‍👩‍👧‍👦 保護者' :
                 '👨‍🏫 指導者'}モード
              </div>
            </div>

            {/* ナビゲーションボタン */}
            {userRole === 'student' && (
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
              </>
            )}

            {(userRole === 'parent' || userRole === 'teacher') && (
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
              </>
            )}

            {/* 共通メニュー */}
            <button
              onClick={() => setCurrentView('userSwitch')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                currentView === 'userSwitch' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👥 役割切り替え
            </button>
            

          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'form' && <StudyRecordForm />}
      {currentView === 'feedback' && (
        <FeedbackPage userRole={userRole === 'parent' ? 'parent' : 'teacher'} />
      )}
      {currentView === 'userSwitch' && (
        <div className="p-8 max-w-4xl mx-auto">
          <UserSwitcher 
            currentRole={userRole} 
            onRoleChange={(role) => {
              setUserRole(role)
              setCurrentView('dashboard')
            }} 
          />
        </div>
      )}

    </div>
  )
}

export default App
