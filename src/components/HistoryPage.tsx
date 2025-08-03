import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { StudyRecord, Feedback } from '../lib/supabase'

interface HistoryRecord {
  record: StudyRecord
  feedbacks: Feedback[]
}

type SortType = 'date' | 'accuracy' | 'emotion'
type SortOrder = 'asc' | 'desc'
type SubjectFilter = 'all' | 'aptitude' | 'japanese' | 'math' | 'science' | 'social'

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'study' | 'feedback' | 'combined'>('study')
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all')
  const [sortType, setSortType] = useState<SortType>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    loadHistoryData()
  }, [])

  const loadHistoryData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 学習記録を取得
      const { data: studyRecords, error: studyError } = await supabase
        .from('study_records')
        .select('*')
        .order('study_date', { ascending: false })
        .order('date', { ascending: false })

      if (studyError) throw studyError

      // フィードバックを取得
      const { data: feedbacks, error: feedbackError } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false })

      if (feedbackError) throw feedbackError

      // 学習記録とフィードバックを組み合わせ
      const combinedData = (studyRecords || []).map(record => ({
        record,
        feedbacks: (feedbacks || []).filter(feedback => feedback.record_id === record.id)
      }))

      setHistoryData(combinedData)
    } catch (err) {
      console.error('履歴データの読み込みでエラーが発生しました:', err)
      setError('履歴データの読み込みに失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const getSubjectLabel = (subject: string) => {
    const labels: { [key: string]: string } = {
      aptitude: '適性検査',
      japanese: '国語',
      math: '算数',
      science: '理科',
      social: '社会'
    }
    return labels[subject] || subject
  }

  const getSubjectIcon = (subject: string) => {
    const icons: { [key: string]: string } = {
      aptitude: '🎯',
      japanese: '✍️',
      math: '🔢',
      science: '🧪',
      social: '🌍'
    }
    return icons[subject] || '📚'
  }

  const getContentTypeLabel = (type: string) => {
    return type === 'class' ? '授業' : '宿題'
  }

  const getEmotionLabel = (emotion: string) => {
    const emotions: { [key: string]: string } = {
      good: '😊 よくできた',
      normal: '😐 ふつう',
      hard: '😵 むずかしかった'
    }
    return emotions[emotion] || emotion
  }

  const formatStudyDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
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

  const getFilteredAndSortedData = () => {
    let filteredData = historyData

    // 科目別フィルタ
    if (subjectFilter !== 'all') {
      filteredData = historyData.filter(item => item.record.subject === subjectFilter)
    }

    // ソート
    const sortedData = [...filteredData].sort((a, b) => {
      let compareValue = 0

      switch (sortType) {
        case 'date':
          compareValue = new Date(a.record.study_date).getTime() - new Date(b.record.study_date).getTime()
          break
        case 'accuracy':
          const accuracyA = (a.record.questions_correct / a.record.questions_total) * 100
          const accuracyB = (b.record.questions_correct / b.record.questions_total) * 100
          compareValue = accuracyA - accuracyB
          break
        case 'emotion':
          const emotionOrder = { hard: 0, normal: 1, good: 2 }
          compareValue = emotionOrder[a.record.emotion as keyof typeof emotionOrder] - 
                        emotionOrder[b.record.emotion as keyof typeof emotionOrder]
          break
      }

      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    return sortedData
  }

  const toggleSort = (type: SortType) => {
    if (sortType === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortType(type)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (type: SortType) => {
    if (sortType !== type) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const renderStudyHistory = () => {
    const filteredData = getFilteredAndSortedData()
    
    return (
      <div className="space-y-4">
        {filteredData.map((item) => (
          <div key={item.record.id} className="bg-white p-6 rounded-xl shadow border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getSubjectIcon(item.record.subject)}</span>
                <div>
                  <h3 className="font-bold text-lg">
                    {getSubjectLabel(item.record.subject)}（{getContentTypeLabel(item.record.content_type)}）
                  </h3>
                  <div className="text-sm text-slate-500">
                    📅 {formatStudyDateDisplay(item.record.study_date)}実施分
                    {item.record.attempt_number > 1 && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {item.record.attempt_number}回目
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right text-sm text-slate-500">
                記録日: {formatDateTimeDisplay(item.record.date)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">正答率</div>
                <div className="text-xl font-bold text-blue-700">
                  {Math.round((item.record.questions_correct / item.record.questions_total) * 100)}%
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600 font-medium">正解数</div>
                <div className="text-xl font-bold text-green-700">
                  {item.record.questions_correct}/{item.record.questions_total}
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">感想</div>
                <div className="text-lg text-purple-700">
                  {getEmotionLabel(item.record.emotion)}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">応援数</div>
                <div className="text-xl font-bold text-orange-700">
                  {item.feedbacks.length}件
                </div>
              </div>
            </div>

            {item.record.comment && (
              <div className="bg-slate-50 p-3 rounded-lg mb-4">
                <div className="text-sm text-slate-600 font-medium mb-1">コメント</div>
                <p className="text-slate-700">{item.record.comment}</p>
              </div>
            )}

            {item.feedbacks.length > 0 && (
              <div className="border-t pt-4">
                <div className="text-sm text-slate-600 font-medium mb-2">
                  応援メッセージ・スタンプ ({item.feedbacks.length}件)
                </div>
                <div className="space-y-2">
                  {item.feedbacks.map((feedback) => (
                    <div key={feedback.id} className="flex items-start gap-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        feedback.sender_type === 'parent' 
                          ? 'bg-pink-100 text-pink-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {feedback.sender_type === 'parent' ? '👨‍👩‍👧‍👦' : '👨‍🏫'}
                      </span>
                      {feedback.reaction_type && (
                        <span className="text-lg">
                          {feedback.reaction_type === 'clap' && '👏'}
                          {feedback.reaction_type === 'thumbs' && '👍'}
                          {feedback.reaction_type === 'muscle' && '💪'}
                        </span>
                      )}
                      <span className="flex-1 text-slate-700">
                        {feedback.message || (
                          feedback.reaction_type === 'clap' ? 'すごい！' :
                          feedback.reaction_type === 'thumbs' ? 'いいね！' :
                          feedback.reaction_type === 'muscle' ? '頑張って！' : ''
                        )}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDateTimeDisplay(feedback.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderFeedbackHistory = () => {
    const allFeedbacks = historyData
      .flatMap(item => item.feedbacks.map(feedback => ({ feedback, record: item.record })))
      .sort((a, b) => new Date(b.feedback.created_at).getTime() - new Date(a.feedback.created_at).getTime())

    return (
      <div className="space-y-4">
        {allFeedbacks.map(({ feedback, record }) => (
          <div key={feedback.id} className="bg-white p-6 rounded-xl shadow border">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                feedback.sender_type === 'parent' 
                  ? 'bg-pink-100 text-pink-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {feedback.sender_type === 'parent' ? '👨‍👩‍👧‍👦 保護者' : '👨‍🏫 指導者'}
              </span>
              {feedback.reaction_type && (
                <span className="text-2xl">
                  {feedback.reaction_type === 'clap' && '👏'}
                  {feedback.reaction_type === 'thumbs' && '👍'}
                  {feedback.reaction_type === 'muscle' && '💪'}
                </span>
              )}
              <span className="text-sm text-slate-500 ml-auto">
                {formatDateTimeDisplay(feedback.created_at)}
              </span>
            </div>

            <div className="mb-3 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getSubjectIcon(record.subject)}</span>
                <span className="font-semibold">{getSubjectLabel(record.subject)}</span>
                <span className="text-sm px-2 py-1 bg-slate-200 text-slate-600 rounded">
                  {getContentTypeLabel(record.content_type)}
                </span>
              </div>
              <div className="text-sm text-slate-600">
                📅 {formatStudyDateDisplay(record.study_date)}実施分 | 
                🎯 {record.questions_correct}/{record.questions_total}問正解 
                ({Math.round((record.questions_correct / record.questions_total) * 100)}%)
              </div>
            </div>

            {feedback.message && typeof feedback.message === 'string' && feedback.message.trim() !== '' ? (
              <p className="text-slate-700 text-lg">{feedback.message}</p>
            ) : feedback.reaction_type && (
              <p className="text-slate-600 italic">
                {feedback.reaction_type === 'clap' && 'すごい！'}
                {feedback.reaction_type === 'thumbs' && 'いいね！'}
                {feedback.reaction_type === 'muscle' && '頑張って！'}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderCombinedHistory = () => {
    const allItems = [
      ...historyData.map(item => ({ type: 'study' as const, data: item, date: item.record.date })),
      ...historyData.flatMap(item => 
        item.feedbacks.map(feedback => ({ 
          type: 'feedback' as const, 
          data: { feedback, record: item.record }, 
          date: feedback.created_at 
        }))
      )
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
      <div className="space-y-4">
        {allItems.map((item, index) => (
          <div key={`${item.type}-${index}`} className="bg-white p-6 rounded-xl shadow border">
            {item.type === 'study' ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">📝 学習記録</span>
                  <span className="text-sm text-slate-500">{formatDateTimeDisplay(item.data.record.date)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getSubjectIcon(item.data.record.subject)}</span>
                  <span className="font-semibold">{getSubjectLabel(item.data.record.subject)}</span>
                  <span className="text-sm px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    {getContentTypeLabel(item.data.record.content_type)}
                  </span>
                  <span className="text-sm text-blue-600 font-medium">
                    {item.data.record.questions_correct}/{item.data.record.questions_total}問正解 
                    ({Math.round((item.data.record.questions_correct / item.data.record.questions_total) * 100)}%)
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">💌 応援</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.data.feedback.sender_type === 'parent' 
                      ? 'bg-pink-100 text-pink-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.data.feedback.sender_type === 'parent' ? '👨‍👩‍👧‍👦' : '👨‍🏫'}
                  </span>
                  {item.data.feedback.reaction_type && (
                    <span className="text-lg">
                      {item.data.feedback.reaction_type === 'clap' && '👏'}
                      {item.data.feedback.reaction_type === 'thumbs' && '👍'}
                      {item.data.feedback.reaction_type === 'muscle' && '💪'}
                    </span>
                  )}
                  <span className="text-sm text-slate-500">{formatDateTimeDisplay(item.data.feedback.created_at)}</span>
                </div>
                <div className="text-slate-700">
                  {getSubjectLabel(item.data.record.subject)}への応援: {
                    item.data.feedback.message || (
                      item.data.feedback.reaction_type === 'clap' ? 'すごい！' :
                      item.data.feedback.reaction_type === 'thumbs' ? 'いいね！' :
                      item.data.feedback.reaction_type === 'muscle' ? '頑張って！' : ''
                    )
                  }
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin text-4xl">⏳</div>
        <p className="mt-4 text-slate-600">履歴を読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-4">❌</div>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadHistoryData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          再試行
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">📚 学習履歴</h1>
          <p className="text-center text-slate-600">これまでの学習記録と応援メッセージを確認できます</p>
        </div>

        {/* タブメニュー */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('study')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'study'
                  ? 'bg-blue-500 text-white rounded-t-xl'
                  : 'text-slate-600 hover:text-blue-500'
              }`}
            >
              📝 学習履歴
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'feedback'
                  ? 'bg-blue-500 text-white rounded-t-xl'
                  : 'text-slate-600 hover:text-blue-500'
              }`}
            >
              💌 応援履歴
            </button>
            <button
              onClick={() => setActiveTab('combined')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'combined'
                  ? 'bg-blue-500 text-white rounded-t-xl'
                  : 'text-slate-600 hover:text-blue-500'
              }`}
            >
              📊 まとめて表示
            </button>
          </div>
        </div>

        {/* フィルタとソートコントロール */}
        {activeTab === 'study' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🔍</span>
              絞り込み・並び替え
            </h3>
            
            {/* 科目フィルタ */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                科目で絞り込み
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <button
                  onClick={() => setSubjectFilter('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    subjectFilter === 'all' 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setSubjectFilter('aptitude')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 min-h-[44px] ${
                    subjectFilter === 'aptitude' 
                      ? 'bg-purple-500 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="hidden sm:inline">🎯</span> 適性
                </button>
                <button
                  onClick={() => setSubjectFilter('japanese')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 min-h-[44px] ${
                    subjectFilter === 'japanese' 
                      ? 'bg-rose-500 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="hidden sm:inline">✍️</span> 国語
                </button>
                <button
                  onClick={() => setSubjectFilter('math')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 min-h-[44px] ${
                    subjectFilter === 'math' 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="hidden sm:inline">🔢</span> 算数
                </button>
                <button
                  onClick={() => setSubjectFilter('science')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 min-h-[44px] ${
                    subjectFilter === 'science' 
                      ? 'bg-green-500 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="hidden sm:inline">🧪</span> 理科
                </button>
                <button
                  onClick={() => setSubjectFilter('social')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 min-h-[44px] ${
                    subjectFilter === 'social' 
                      ? 'bg-amber-500 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="hidden sm:inline">🌍</span> 社会
                </button>
              </div>
            </div>

            {/* ソートコントロール */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                並び替え
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => toggleSort('date')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 min-h-[44px] ${
                    sortType === 'date' 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="hidden sm:inline">📅</span> 実施日 <span className="ml-1">{getSortIcon('date')}</span>
                </button>
                <button
                  onClick={() => toggleSort('accuracy')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 min-h-[44px] ${
                    sortType === 'accuracy' 
                      ? 'bg-green-500 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="hidden sm:inline">🎯</span> 正答率 <span className="ml-1">{getSortIcon('accuracy')}</span>
                </button>
                <button
                  onClick={() => toggleSort('emotion')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 min-h-[44px] ${
                    sortType === 'emotion' 
                      ? 'bg-purple-500 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="hidden sm:inline">😊</span> 感想 <span className="ml-1">{getSortIcon('emotion')}</span>
                </button>
              </div>
            </div>

            {/* 現在のフィルタ状態表示 */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600">
                <span className="font-medium">
                  表示中: <span className="text-blue-600">{subjectFilter === 'all' ? 'すべての科目' : getSubjectLabel(subjectFilter)}</span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  並び順: <span className="font-medium">{
                    sortType === 'date' ? '実施日' :
                    sortType === 'accuracy' ? '正答率' :
                    '感想'
                  }</span>
                  <span className="text-slate-500">
                    {sortOrder === 'desc' ? ' (高い順)' : ' (低い順)'}
                  </span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {getFilteredAndSortedData().length}件
                </span>
              </div>
            </div>
          </div>
        )}

        {/* コンテンツ */}
        <div className="mb-8">
          {activeTab === 'study' && renderStudyHistory()}
          {activeTab === 'feedback' && renderFeedbackHistory()}
          {activeTab === 'combined' && renderCombinedHistory()}
        </div>

        {historyData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-slate-600 mb-2">履歴がありません</h2>
            <p className="text-slate-500">学習記録をつけると、ここに履歴が表示されます</p>
          </div>
        )}
      </div>
    </div>
  )
}