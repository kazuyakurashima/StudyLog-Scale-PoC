import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Reflection } from '../lib/supabase'

interface ReflectionPageProps {
  userRole: 'student' | 'teacher'
}

export default function ReflectionPage({ userRole }: ReflectionPageProps) {
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

  useEffect(() => {
    loadReflections()
    // 今日の日付をデフォルトに設定
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
  }, [])

  const loadReflections = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: reflectionError } = await supabase
        .from('reflections')
        .select('*')
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

      // 同じ日付の振り返りが既に存在するかチェック
      const existingReflection = reflections.find(r => r.date === selectedDate)
      
      if (existingReflection) {
        // 更新
        const { error: updateError } = await supabase
          .from('reflections')
          .update({
            reflection_content: reflectionContent.trim(),
            improvement_points: improvementPoints.trim() || null
          })
          .eq('id', existingReflection.id)

        if (updateError) throw updateError
      } else {
        // 新規作成
        const { error: insertError } = await supabase
          .from('reflections')
          .insert({
            date: selectedDate,
            reflection_content: reflectionContent.trim(),
            improvement_points: improvementPoints.trim() || null
          })

        if (insertError) throw insertError
      }

      // フォームをリセット
      setReflectionContent('')
      setImprovementPoints('')
      
      // データを再読み込み
      await loadReflections()
      
    } catch (err) {
      console.error('振り返りの保存でエラーが発生しました:', err)
      setError('振り返りの保存に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
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
    return date.toLocaleDateString('ja-JP', {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">🤔 振り返り</h1>
          <p className="text-center text-slate-600">
            {userRole === 'student' 
              ? '学習を振り返って、成長につなげよう' 
              : '生徒の振り返りにコメントして、成長をサポートしよう'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 生徒用: 振り返り記入フォーム */}
        {userRole === 'student' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-2xl">✍️</span>
              振り返りを記入する
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
                {reflections.find(r => r.date === selectedDate) && (
                  <p className="text-sm text-amber-600 mt-1">
                    ⚠️ この日付の振り返りは既に存在します。保存すると上書きされます。
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '保存中...' : '振り返りを保存'}
              </button>
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
                    <span className="text-sm text-slate-500">
                      記録: {formatDateTimeDisplay(reflection.created_at)}
                    </span>
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
                    ) : userRole === 'teacher' && (
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
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {isSubmitting ? '保存中...' : 'コメント保存'}
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
                    )}
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