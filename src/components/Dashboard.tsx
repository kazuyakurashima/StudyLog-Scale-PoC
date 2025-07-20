import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { StudyRecord, Feedback } from '../lib/supabase'

interface DashboardStats {
  continueDays: number
  todayRecords: TodayRecord[]
  subjectStats: {
    subject: string
    label: string
    totalQuestions: number
    totalCorrect: number
    accuracy: number
    icon: string
    color: string
  }[]
  recentEmotions: { date: string; emotion: string }[]
  totalSessions: number
}

interface TodayRecord {
  id: number
  study_date: string
  subject: string
  content_type: 'class' | 'homework'
  attempt_number: number
  questions_total: number
  questions_correct: number
  emotion: string
  comment?: string
  history: {
    attempt: number
    correct: number
    total: number
    accuracy: number
    record_date: string
    emotion: string
  }[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
    
    // 30秒ごとにデータを更新してフィードバックの変更を反映
    const interval = setInterval(loadDashboardData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. 全ての学習記録を取得
      const { data: allRecords, error: recordsError } = await supabase
        .from('study_records')
        .select('*')
        .order('date', { ascending: false })

      if (recordsError) throw recordsError

      // 2. フィードバックを取得
      const { data: allFeedbacks, error: feedbacksError } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false })

      if (feedbacksError) throw feedbacksError

      // 3. 統計データを計算
      const today = new Date().toISOString().split('T')[0]
      const todayRecordsRaw = allRecords?.filter(record => record.date === today) || []

      // 今日の記録を拡張形式で処理
      const todayRecords = await processTodayRecords(todayRecordsRaw, allRecords || [])

      // 継続日数を計算
      const continueDays = calculateContinueDays(allRecords || [])

      // 科目別統計を計算
      const subjectStats = calculateSubjectStats(allRecords || [])

      // 最近の感情推移（直近5日間）
      const recentEmotions = calculateRecentEmotions(allRecords || [])

      setStats({
        continueDays,
        todayRecords,
        subjectStats,
        recentEmotions,
        totalSessions: allRecords?.length || 0
      })

      setFeedbacks(allFeedbacks || [])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データの取得に失敗しました'
      setError(errorMessage)
      console.error('❌ ダッシュボードデータ取得エラー:', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const processTodayRecords = async (todayRecords: StudyRecord[], allRecords: StudyRecord[]): Promise<TodayRecord[]> => {
    const processedRecords = new Map<string, TodayRecord>()

    for (const record of todayRecords) {
      const key = `${record.study_date}-${record.subject}-${record.content_type}`
      
      // 同じ学習内容の履歴を取得
      const history = allRecords
        .filter(r => 
          r.study_date === record.study_date && 
          r.subject === record.subject && 
          r.content_type === record.content_type &&
          r.date <= record.date
        )
        .sort((a, b) => a.attempt_number - b.attempt_number)
        .map(r => ({
          attempt: r.attempt_number,
          correct: r.questions_correct,
          total: r.questions_total,
          accuracy: Math.round((r.questions_correct / r.questions_total) * 100),
          record_date: r.date,
          emotion: r.emotion
        }))

      // 最新の記録を使用（同日に複数記録がある場合）
      const latestRecord = allRecords
        .filter(r => 
          r.study_date === record.study_date && 
          r.subject === record.subject && 
          r.content_type === record.content_type &&
          r.date === record.date
        )
        .sort((a, b) => b.attempt_number - a.attempt_number)[0] || record

      processedRecords.set(key, {
        id: latestRecord.id,
        study_date: latestRecord.study_date,
        subject: latestRecord.subject,
        content_type: latestRecord.content_type,
        attempt_number: latestRecord.attempt_number,
        questions_total: latestRecord.questions_total,
        questions_correct: latestRecord.questions_correct,
        emotion: latestRecord.emotion,
        comment: latestRecord.comment,
        history
      })
    }

    return Array.from(processedRecords.values())
  }

  const calculateContinueDays = (records: StudyRecord[]): number => {
    if (!records.length) return 0

    // 日付別にグループ化
    const dateGroups = new Map<string, StudyRecord[]>()
    records.forEach(record => {
      const date = record.date
      if (!dateGroups.has(date)) {
        dateGroups.set(date, [])
      }
      dateGroups.get(date)!.push(record)
    })

    // 連続日数を計算
    const today = new Date()
    let continueDays = 0
    let currentDate = new Date(today)

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0]
      if (dateGroups.has(dateStr)) {
        continueDays++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return continueDays
  }

  const calculateSubjectStats = (records: StudyRecord[]) => {
    const subjects = [
      { key: 'aptitude', label: '適性', icon: '🧠', color: 'from-purple-400 to-purple-600' },
      { key: 'japanese', label: '国語', icon: '📚', color: 'from-rose-400 to-rose-600' },
      { key: 'math', label: '算数', icon: '🔢', color: 'from-blue-400 to-blue-600' },
      { key: 'science', label: '理科', icon: '🔬', color: 'from-green-400 to-green-600' },
      { key: 'social', label: '社会', icon: '🌍', color: 'from-amber-400 to-amber-600' },
    ]

    return subjects.map(subject => {
      const subjectRecords = records.filter(record => record.subject === subject.key)
      const totalQuestions = subjectRecords.reduce((sum, record) => sum + record.questions_total, 0)
      const totalCorrect = subjectRecords.reduce((sum, record) => sum + record.questions_correct, 0)
      const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

      return {
        subject: subject.key,
        label: subject.label,
        totalQuestions,
        totalCorrect,
        accuracy,
        icon: subject.icon,
        color: subject.color
      }
    }).filter(stat => stat.totalQuestions > 0) // 学習履歴がある科目のみ表示
  }

  const calculateRecentEmotions = (records: StudyRecord[]) => {
    // 日付ごとの主要な感情を取得（直近5日間）
    const dateGroups = new Map<string, StudyRecord[]>()
    records.forEach(record => {
      const date = record.date
      if (!dateGroups.has(date)) {
        dateGroups.set(date, [])
      }
      dateGroups.get(date)!.push(record)
    })

    const sortedDates = Array.from(dateGroups.keys()).sort().reverse().slice(0, 5)
    
    return sortedDates.map(date => {
      const dayRecords = dateGroups.get(date) || []
      // その日の最も多い感情を取得
      const emotionCounts = { good: 0, normal: 0, hard: 0 }
      dayRecords.forEach(record => {
        emotionCounts[record.emotion as keyof typeof emotionCounts]++
      })
      
      const dominantEmotion = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)[0][0]

      return { date, emotion: dominantEmotion }
    })
  }

  const getEmotionEmoji = (emotion: string) => {
    const emojis = { good: '😊', normal: '😐', hard: '😞' }
    return emojis[emotion as keyof typeof emojis] || '😐'
  }

  const getSubjectLabel = (subject: string) => {
    const labels: Record<string, string> = {
      aptitude: '適性', japanese: '国語', math: '算数', science: '理科', social: '社会'
    }
    return labels[subject] || subject
  }

  const getContentTypeLabel = (contentType: string) => {
    return contentType === 'class' ? '授業' : '宿題'
  }

  const getEmotionLabel = (emotion: string) => {
    const emotions: Record<string, string> = {
      good: '😊 よくできた', normal: '😐 普通', hard: '😞 難しかった'
    }
    return emotions[emotion] || emotion
  }

  const formatHistoryDisplay = (history: TodayRecord['history']) => {
    if (history.length <= 1) return ''
    
    return history
      .map(h => `(${h.correct}/${h.total})`)
      .join(' → ')
  }

  const formatStudyDateDisplay = (studyDate: string) => {
    if (!studyDate || studyDate === '1970-01-01') {
      return '未設定'
    }
    return new Date(studyDate).toLocaleDateString('ja-JP', { 
      month: 'numeric', 
      day: 'numeric' 
    })
  }

  const getTodaysFeedbacks = () => {
    const today = new Date().toISOString().split('T')[0]
    
    // 今日の記録に対するフィードバックを取得
    const todayRecordIds = stats?.todayRecords.map(record => record.id) || []
    
    // 今日の記録に対するフィードバックを抽出して新しい順に並び替え
    const todaysFeedbacks = feedbacks
      .filter(feedback => todayRecordIds.includes(feedback.record_id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // フィードバックと対応する学習記録を組み合わせて返す
    return todaysFeedbacks.map(feedback => {
      const record = stats?.todayRecords.find(r => r.id === feedback.record_id)
      return {
        feedback,
        record
      }
    })
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg">ダッシュボードを読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <h3 className="font-bold">エラーが発生しました</h3>
          <p>{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* ヘッダー */}
      <div className="text-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          📊 学習ダッシュボード
        </h1>
        <p className="text-slate-600 text-lg">がんばりの記録を確認しよう！</p>
      </div>

      {/* 継続日数カウンター */}
      <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-2xl p-8 text-center shadow-xl">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-6xl">🔥</span>
          <div>
            <h2 className="text-4xl font-black">継続日数</h2>
            <p className="text-xl opacity-90">がんばり日数</p>
          </div>
        </div>
        <div className="text-6xl font-black mb-2">
          {stats.continueDays}<span className="text-3xl">/17</span>日
        </div>
        <div className="text-xl opacity-90">
          {stats.continueDays >= 17 ? '🎉 完走達成！' : 
           stats.continueDays >= 10 ? '💪 もう少し！' : 
           stats.continueDays >= 5 ? '🌟 順調です！' : 
           '📈 がんばろう！'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 今日の記録 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            今日の記録
          </h2>
          {stats.todayRecords.length > 0 ? (
            <div className="space-y-4">
              {stats.todayRecords.map((record) => (
                <div key={record.id} className="bg-slate-50 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {getSubjectLabel(record.subject)}（{getContentTypeLabel(record.content_type)}）
                      </h3>
                      <div className="text-sm text-slate-500">
                        {formatStudyDateDisplay(record.study_date)}実施分 
                        {record.attempt_number > 1 && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {record.attempt_number}回目
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-slate-500">
                      {getEmotionLabel(record.emotion)}
                    </span>
                  </div>
                  
                  <div className="text-blue-600 font-medium mb-2">
                    現在: {record.questions_correct}/{record.questions_total}問正解
                    <span className="ml-2 text-sm text-slate-600">
                      ({Math.round((record.questions_correct / record.questions_total) * 100)}%)
                    </span>
                  </div>

                  {/* 履歴表示 */}
                  {record.history.length > 1 && (
                    <div className="text-sm text-slate-600 mb-2">
                      <span className="font-medium">成績の変化:</span>
                      <div className="mt-1 font-mono text-blue-700">
                        {formatHistoryDisplay(record.history)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {record.history.length > 1 && (
                          <span>
                            改善: +{record.history[record.history.length - 1].accuracy - record.history[0].accuracy}%
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {record.comment && (
                    <p className="text-slate-600 text-sm mt-2 bg-white p-2 rounded">
                      {record.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <span className="text-4xl mb-4 block">📝</span>
              <p className="text-lg">今日はまだ学習記録がありません</p>
              <p className="text-sm">がんばって記録をつけよう！</p>
            </div>
          )}
        </div>

        {/* 最近の調子 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-2xl">💭</span>
            最近の調子
          </h2>
          {stats.recentEmotions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-center items-center gap-2 text-4xl">
                {stats.recentEmotions.map((day, index) => (
                  <span key={index} className="transition-transform hover:scale-125">
                    {getEmotionEmoji(day.emotion)}
                  </span>
                ))}
              </div>
              <div className="text-center text-sm text-slate-500">
                {stats.recentEmotions.map((day, index) => (
                  <span key={index} className="inline-block mx-1">
                    {new Date(day.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <span className="text-4xl mb-4 block">🤔</span>
              <p>まだデータが少ないです</p>
            </div>
          )}
        </div>
      </div>

      {/* 科目別成績 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="text-2xl">📈</span>
          科目別成績
        </h2>
        {stats.subjectStats.length > 0 ? (
          <div className="space-y-4">
            {stats.subjectStats.map((stat) => (
              <div key={stat.subject} className="flex items-center gap-4">
                <div className="flex items-center gap-3 w-24">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="font-medium">{stat.label}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-slate-200 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-500`}
                        style={{ width: `${stat.accuracy}%` }}
                      />
                    </div>
                    <div className="text-lg font-bold text-slate-700 w-12 text-right">
                      {stat.accuracy}%
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {stat.totalCorrect}/{stat.totalQuestions}問正解
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <span className="text-4xl mb-4 block">📊</span>
            <p>学習記録を追加すると成績が表示されます</p>
          </div>
        )}
      </div>

      {/* 応援メッセージ */}
      {getTodaysFeedbacks().length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-2xl">💌</span>
              今日の応援メッセージ
            </h2>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
            >
              🔄 更新
            </button>
          </div>
          <div className="space-y-4">
            {getTodaysFeedbacks()
              .sort((a, b) => new Date(b.feedback.created_at).getTime() - new Date(a.feedback.created_at).getTime())
              .map((feedbackWithRecord) => (
              <div key={feedbackWithRecord.feedback.id} className="bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    feedbackWithRecord.feedback.sender_type === 'parent' 
                      ? 'bg-pink-100 text-pink-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {feedbackWithRecord.feedback.sender_type === 'parent' ? '👨‍👩‍👧‍👦 保護者' : '👨‍🏫 指導者'}
                  </span>
                  {feedbackWithRecord.feedback.reaction_type && (
                    <span>
                      {feedbackWithRecord.feedback.reaction_type === 'clap' && '👏 すごい！'}
                      {feedbackWithRecord.feedback.reaction_type === 'thumbs' && '👍 いいね！'}
                      {feedbackWithRecord.feedback.reaction_type === 'muscle' && '💪 頑張って！'}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 ml-auto">
                    {new Date(feedbackWithRecord.feedback.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                
                {/* 対象となる学習内容を表示 */}
                {feedbackWithRecord.record && (
                  <div className="bg-white p-3 rounded-lg mb-3 border border-slate-200">
                    <div className="text-sm font-medium text-slate-700 mb-1">
                      📚 {getSubjectLabel(feedbackWithRecord.record.subject)}（{getContentTypeLabel(feedbackWithRecord.record.content_type)}）
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatStudyDateDisplay(feedbackWithRecord.record.study_date)}実施分 • {feedbackWithRecord.record.questions_correct}/{feedbackWithRecord.record.questions_total}問正解
                      {feedbackWithRecord.record.attempt_number > 1 && (
                        <span className="ml-2 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {feedbackWithRecord.record.attempt_number}回目
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {feedbackWithRecord.feedback.message && (
                  <p className="text-slate-700">{feedbackWithRecord.feedback.message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 