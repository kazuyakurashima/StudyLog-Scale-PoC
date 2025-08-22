import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Reflection } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { formatDateTimeToJST } from '../lib/utils'

interface ReflectionPageProps {
  userRole: 'student' | 'teacher' | 'parent'
}

export default function ReflectionPage({ userRole }: ReflectionPageProps) {
  const { user } = useAuth()
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // フォーム状態
  const [selectedDate, setSelectedDate] = useState('')
  const [reflectionContent, setReflectionContent] = useState('')
  const [improvementPoints, setImprovementPoints] = useState('')
  const [editingReflection, setEditingReflection] = useState<Reflection | null>(null)
  const [teacherComment, setTeacherComment] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingReflectionForm, setEditingReflectionForm] = useState<Reflection | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formHighlight, setFormHighlight] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadReflections()
      // 今日の日付をデフォルトに設定
      const today = new Date().toISOString().split('T')[0]
      setSelectedDate(today)
    }
  }, [user?.id])

  // 日付が変更された時に既存の振り返りをチェック
  useEffect(() => {
    if (selectedDate && reflections.length > 0) {
      const existingReflection = reflections.find(r => r.date === selectedDate)
      if (existingReflection) {
        setEditingReflectionForm(existingReflection)
        setReflectionContent(existingReflection.reflection_content)
        setImprovementPoints(existingReflection.improvement_points || '')
        setIsEditMode(true)
      } else {
        setEditingReflectionForm(null)
        setReflectionContent('')
        setImprovementPoints('')
        setIsEditMode(false)
      }
    }
  }, [selectedDate, reflections])

  const loadReflections = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      setError(null)

      const { data, error: reflectionError } = await supabase
        .from('reflections')
        .select('*')
        .eq('student_id', user.id)
        .order('date', { ascending: false })

      if (reflectionError) throw reflectionError

      setReflections(data || [])
    } catch (err) {
      console.error('振り返りデータの読み込みでエラーが発生しました:', err)
      setError('振り返りデータの読み込みに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate || !reflectionContent.trim()) {
      setError('日付と振り返り内容は必須です。')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      if (isEditMode && editingReflectionForm) {
        // 更新
        const { error: updateError } = await supabase
          .from('reflections')
          .update({
            reflection_content: reflectionContent.trim(),
            improvement_points: improvementPoints.trim() || null
          })
          .eq('id', editingReflectionForm.id)

        if (updateError) throw updateError
      } else {
        // 新規作成
        const { error: insertError } = await supabase
          .from('reflections')
          .insert({
            student_id: user!.id,
            date: selectedDate,
            reflection_content: reflectionContent.trim(),
            improvement_points: improvementPoints.trim() || null
          })

        if (insertError) throw insertError
      }

      // フォームをリセット
      setReflectionContent('')
      setImprovementPoints('')
      setIsEditMode(false)
      setEditingReflectionForm(null)
      
      // データを再読み込み
      await loadReflections()
      
      // 成功メッセージを表示
      const message = isEditMode ? '✅ 振り返りを更新しました！' : '✅ 振り返りを保存しました！'
      setSuccessMessage(message)
      setShowSuccess(true)
      
      // フォームを一時的にハイライト
      setFormHighlight(true)
      setTimeout(() => setFormHighlight(false), 1000)
      
      // 3秒後に成功メッセージを非表示
      setTimeout(() => {
        setShowSuccess(false)
        setTimeout(() => setSuccessMessage(null), 300) // フェードアウト後にクリア
      }, 3000)
      
    } catch (err) {
      console.error('振り返りの保存でエラーが発生しました:', err)
      setError('振り返りの保存に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setReflectionContent('')
    setImprovementPoints('')
    setIsEditMode(false)
    setEditingReflectionForm(null)
    // 今日の日付に戻す
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
  }

  const handleAddTeacherComment = async (reflectionId: number) => {
    if (!teacherComment.trim()) {
      setError('コメントを入力してください。')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('reflections')
        .update({
          teacher_comment: teacherComment.trim()
        })
        .eq('id', reflectionId)

      if (updateError) throw updateError

      setTeacherComment('')
      setEditingReflection(null)
      await loadReflections()
      
      // 成功メッセージを表示
      setSuccessMessage('✅ 先生のコメントを追加しました！')
      setShowSuccess(true)
      
      // 3秒後に成功メッセージを非表示
      setTimeout(() => {
        setShowSuccess(false)
        setTimeout(() => setSuccessMessage(null), 300)
      }, 3000)
      
    } catch (err) {
      console.error('先生コメントの保存でエラーが発生しました:', err)
      setError('先生コメントの保存に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const formatDateTimeDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    // UTC時間を日本時間（JST）に変換
    const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000))
    return jstDate.toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin text-4xl">⏳</div>
        <p className="mt-4 text-slate-600">振り返りデータを読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="harmonious-header-1">🤔 振り返り</h1>
          <p className="harmonious-text-lg">
            {userRole === 'student' 
              ? '学習を振り返って、成長につなげよう' 
              : userRole === 'teacher'
              ? '生徒の振り返りにコメントして、成長をサポートしよう'
              : '生徒の振り返りを確認して、成長を見守ろう'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 成功メッセージ */}
        {successMessage && (
          <div className={`mb-6 p-4 bg-green-50 border border-green-200 rounded-lg transition-all duration-300 ${
            showSuccess ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">🎉</span>
              <p className="text-green-700 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* 生徒用: 振り返り記入フォーム */}
        {userRole === 'student' && (
          <div className={`bg-white rounded-xl shadow-lg p-6 mb-8 transition-all duration-1000 ${
            formHighlight ? 'ring-4 ring-green-200 shadow-green-100 shadow-2xl' : ''
          }`}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-2xl">{isEditMode ? '📝' : '✍️'}</span>
              {isEditMode ? '振り返りを編集する' : '振り返りを記入する'}
            </h2>
            
            <form onSubmit={handleSubmitReflection} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  振り返り日付 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {isEditMode && (
                  <p className="text-sm text-blue-600 mt-1">
                    📝 既存の振り返りを編集中です。
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  今日の振り返り <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reflectionContent}
                  onChange={(e) => setReflectionContent(e.target.value)}
                  placeholder="今日の学習はどうでしたか？うまくいったこと、うまくいかなかったことを書いてみましょう。"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
                  required
                />
                <div className="text-xs text-slate-500 mt-1">
                  {reflectionContent.length}/500文字
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  明日からの改善点
                </label>
                <textarea
                  value={improvementPoints}
                  onChange={(e) => setImprovementPoints(e.target.value)}
                  placeholder="明日からどんなことを改善したいですか？具体的な目標を書いてみましょう。"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                />
                <div className="text-xs text-slate-500 mt-1">
                  {improvementPoints.length}/300文字
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    isSubmitting 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">{isEditMode ? '💾' : '📝'}</span>
                      {isEditMode ? '変更を保存' : '振り返りを保存'}
                    </>
                  )}
                </button>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-3 bg-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-400 transition-colors"
                  >
                    キャンセル
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* 振り返り履歴 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="text-2xl">📖</span>
            これまでの振り返り
          </h2>

          {reflections.length > 0 ? (
            <div className="space-y-6">
              {reflections.map((reflection) => (
                <div key={reflection.id} className="border border-slate-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {formatDateDisplay(reflection.date)}
                    </h3>
                    <div className="flex items-center gap-2">
                      {userRole === 'student' && (
                        <button
                          onClick={() => {
                            setSelectedDate(reflection.date)
                            setReflectionContent(reflection.reflection_content)
                            setImprovementPoints(reflection.improvement_points || '')
                            setEditingReflectionForm(reflection)
                            setIsEditMode(true)
                            // フォームまでスクロール
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          ✏️ 編集
                        </button>
                      )}
                      <span className="text-sm text-slate-500">
                        記録: {formatDateTimeDisplay(reflection.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">📝 振り返り内容</h4>
                      <p className="text-slate-700 whitespace-pre-wrap">{reflection.reflection_content}</p>
                    </div>

                    {reflection.improvement_points && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">🎯 改善点</h4>
                        <p className="text-slate-700 whitespace-pre-wrap">{reflection.improvement_points}</p>
                      </div>
                    )}

                    {/* 先生のコメント */}
                    {reflection.teacher_comment ? (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-800 mb-2">👨‍🏫 先生からのコメント</h4>
                        <p className="text-slate-700 whitespace-pre-wrap">{reflection.teacher_comment}</p>
                      </div>
                    ) : userRole === 'teacher' ? (
                      <div className="bg-slate-50 p-4 rounded-lg">
                        {editingReflection?.id === reflection.id ? (
                          <div className="space-y-3">
                            <h4 className="font-medium text-slate-800">👨‍🏫 先生からのコメントを追加</h4>
                            <textarea
                              value={teacherComment}
                              onChange={(e) => setTeacherComment(e.target.value)}
                              placeholder="生徒の振り返りに対してコメントを書いてください。"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddTeacherComment(reflection.id)}
                                disabled={isSubmitting}
                                className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                                  isSubmitting 
                                    ? 'bg-blue-400 cursor-not-allowed' 
                                    : 'bg-blue-500 hover:bg-blue-600 hover:shadow-lg transform hover:scale-105'
                                }`}
                              >
                                {isSubmitting ? (
                                  <>
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    保存中...
                                  </>
                                ) : (
                                  <>
                                    <span>💬</span>
                                    コメント保存
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingReflection(null)
                                  setTeacherComment('')
                                }}
                                className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-400 transition-colors"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingReflection(reflection)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            💬 コメントを追加
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-slate-600 mb-2">振り返りがありません</h2>
              <p className="text-slate-500">
                {userRole === 'student' 
                  ? '上のフォームから振り返りを記入してみましょう' 
                  : '生徒が振り返りを記入すると、ここに表示されます'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}