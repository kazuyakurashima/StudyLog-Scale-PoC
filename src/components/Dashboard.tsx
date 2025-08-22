import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { StudyRecord, Feedback } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'

interface DashboardStats {
  continueDays: number
  cumulativeDays: number
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
  growthMetrics: {
    todayImprovement: {
      percentage: number
      isImprovement: boolean
    }
    weeklyAverage: {
      current: number
      previous: number
      improvement: number
    }
    consecutiveStreak: number
    mostImprovedSubject: {
      subject: string
      label: string
      improvement: number
    } | null
  }
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
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
      
      // 30秒ごとにデータを更新してフィードバックの変更を反映
      const interval = setInterval(loadDashboardData, 30000)
      
      return () => clearInterval(interval)
    }
  }, [user?.id])

  const loadDashboardData = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      setError(null)

      // 1. 全ての学習記録を取得（生徒IDでフィルタ）
      const { data: allRecordsData, error: recordsError } = await supabase
        .from('study_records')
        .select('*')
        .eq('student_id', user.id)
        .order('date', { ascending: false })

      if (recordsError) throw recordsError

      // 2. フィードバックを取得（関連する学習記録も含む）
      const { data: allFeedbacks, error: feedbacksError } = await supabase
        .from('feedbacks')
        .select(`
          *,
          study_records (
            id,
            student_id,
            date,
            study_date,
            subject,
            content_type,
            attempt_number,
            questions_total,
            questions_correct,
            emotion,
            comment
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (feedbacksError) throw feedbacksError

      // 3. 統計データを計算
      const today = new Date().toISOString().split('T')[0]
      const todayRecordsRaw = allRecordsData?.filter(record => {
        // TIMESTAMP型の場合、日付部分のみを比較
        const recordDate = new Date(record.date).toISOString().split('T')[0]
        return recordDate === today
      }) || []

      // 今日の記録を拡張形式で処理
      const todayRecords = await processTodayRecords(todayRecordsRaw, allRecordsData || [])

      // 継続日数を計算
      const continueDays = calculateContinueDays(allRecordsData || [])

      // 累積日数を計算
      const cumulativeDays = calculateCumulativeDays(allRecordsData || [])

      // 科目別統計を計算
      const subjectStats = calculateSubjectStats(allRecordsData || [])

      // 最近の感情推移（直近5日間）
      const recentEmotions = calculateRecentEmotions(allRecordsData || [])

      // 成長指標を計算
      const growthMetrics = calculateGrowthMetrics(allRecordsData || [])

      setStats({
        continueDays,
        cumulativeDays,
        todayRecords,
        subjectStats,
        recentEmotions,
        totalSessions: allRecordsData?.length || 0,
        growthMetrics
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

    // 今日の日付を取得
    const today = new Date().toISOString().split('T')[0]
    
    // TIMESTAMP型の場合、日付部分のみを抽出
    const uniqueDates = Array.from(new Set(
      records.map(r => new Date(r.date).toISOString().split('T')[0])
    )).sort().reverse()

    if (uniqueDates.length === 0) return 0

    // 今日から連続している日数をカウント
    let continueDays = 0
    let checkDate = new Date(today)

    // 今日から過去に向かって連続している日をチェック
    while (true) {
      const checkDateStr = checkDate.toISOString().split('T')[0]
      
      if (uniqueDates.includes(checkDateStr)) {
        continueDays++
        // 前日に移動
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return continueDays
  }

  const calculateCumulativeDays = (records: StudyRecord[]): number => {
    if (!records.length) return 0

    // TIMESTAMP型の場合、日付部分のみを抽出（全期間の学習日数をカウント）
    const uniqueDates = Array.from(new Set(
      records.map(r => new Date(r.date).toISOString().split('T')[0])
    )).sort()

    return uniqueDates.length
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
      // TIMESTAMP型の場合、日付部分のみを取得
      const date = new Date(record.date).toISOString().split('T')[0]
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

  const calculateGrowthMetrics = (records: StudyRecord[]) => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // 今日の成果（昨日との比較）
    const todayRecords = records.filter(r => {
      const recordDate = new Date(r.date).toISOString().split('T')[0]
      return recordDate === today
    })
    const yesterdayRecords = records.filter(r => {
      const recordDate = new Date(r.date).toISOString().split('T')[0]
      return recordDate === yesterday
    })
    
    const todayAccuracy = todayRecords.length > 0 ? 
      todayRecords.reduce((sum, r) => sum + (r.questions_correct / r.questions_total), 0) / todayRecords.length * 100 : 0
    const yesterdayAccuracy = yesterdayRecords.length > 0 ? 
      yesterdayRecords.reduce((sum, r) => sum + (r.questions_correct / r.questions_total), 0) / yesterdayRecords.length * 100 : 0
    
    const todayImprovement = {
      percentage: Math.abs(todayAccuracy - yesterdayAccuracy),
      isImprovement: todayAccuracy > yesterdayAccuracy
    }

    // 週間平均（今週と先週の比較）
    const now = new Date()
    const weekStart = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000))
    const lastWeekStart = new Date(weekStart.getTime() - (7 * 24 * 60 * 60 * 1000))
    const lastWeekEnd = new Date(weekStart.getTime() - 1)

    const thisWeekRecords = records.filter(r => {
      const recordDate = new Date(r.date)
      return recordDate >= weekStart
    })
    
    const lastWeekRecords = records.filter(r => {
      const recordDate = new Date(r.date)
      return recordDate >= lastWeekStart && recordDate <= lastWeekEnd
    })

    const currentWeekAvg = thisWeekRecords.length > 0 ? 
      thisWeekRecords.reduce((sum, r) => sum + (r.questions_correct / r.questions_total), 0) / thisWeekRecords.length * 100 : 0
    const previousWeekAvg = lastWeekRecords.length > 0 ? 
      lastWeekRecords.reduce((sum, r) => sum + (r.questions_correct / r.questions_total), 0) / lastWeekRecords.length * 100 : 0

    const weeklyAverage = {
      current: Math.round(currentWeekAvg),
      previous: Math.round(previousWeekAvg),
      improvement: Math.round(currentWeekAvg - previousWeekAvg)
    }

    // 連続記録更新（継続日数と同じ）
    const consecutiveStreak = calculateContinueDays(records)

    // 最も成長した科目（過去2週間の比較）
    const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000))
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))

    const subjects = ['aptitude', 'japanese', 'math', 'science', 'social']
    const subjectLabels = {
      aptitude: '適性', japanese: '国語', math: '算数', science: '理科', social: '社会'
    }

    let mostImprovedSubject = null
    let maxImprovement = 0

    subjects.forEach(subject => {
      const recentRecords = records.filter(r => 
        r.subject === subject && new Date(r.date) >= oneWeekAgo
      )
      const olderRecords = records.filter(r => 
        r.subject === subject && new Date(r.date) >= twoWeeksAgo && new Date(r.date) < oneWeekAgo
      )

      if (recentRecords.length > 0 && olderRecords.length > 0) {
        const recentAvg = recentRecords.reduce((sum, r) => sum + (r.questions_correct / r.questions_total), 0) / recentRecords.length * 100
        const olderAvg = olderRecords.reduce((sum, r) => sum + (r.questions_correct / r.questions_total), 0) / olderRecords.length * 100
        const improvement = recentAvg - olderAvg

        if (improvement > maxImprovement) {
          maxImprovement = improvement
          mostImprovedSubject = {
            subject,
            label: subjectLabels[subject as keyof typeof subjectLabels],
            improvement: Math.round(improvement)
          }
        }
      }
    })

    return {
      todayImprovement,
      weeklyAverage,
      consecutiveStreak,
      mostImprovedSubject
    }
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

  const getSubjectIcon = (subject: string) => {
    const icons: Record<string, string> = {
      aptitude: '🎯', japanese: '✍️', math: '🔢', science: '🧪', social: '🌍'
    }
    return icons[subject] || '📚'
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

  const getRecentFeedbacks = () => {
    // 最近7日間のフィードバックを取得
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    // 全てのフィードバック（コメント付き、スタンプのみ両方含む）を抽出し、新しい順に並び替え
    const recentFeedbacks = feedbacks
      .filter(feedback => new Date(feedback.created_at) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10) // 最新10件まで表示

    // フィードバックと対応する学習記録を組み合わせて返す
    const result = recentFeedbacks.map(feedback => {
      return {
        feedback,
        record: (feedback as any).study_records || null
      }
    })
    
    return result
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
        <div className="flex items-center justify-center gap-8 mb-4">
          <div className="text-center">
            <div className="text-5xl font-black mb-1">
              {stats.continueDays}<span className="text-2xl">/10</span>
            </div>
            <div className="text-lg opacity-80">連続日数</div>
          </div>
          <div className="text-white/50 text-4xl">|</div>
          <div className="text-center">
            <div className="text-5xl font-black mb-1">
              {stats.cumulativeDays}<span className="text-2xl">/10</span>
            </div>
            <div className="text-lg opacity-80">累積日数</div>
          </div>
        </div>
        <div className="text-xl opacity-90">
          {stats.continueDays >= 17 ? '🎉 完走達成！' : 
           stats.continueDays >= 10 ? '💪 もう少し！' : 
           stats.continueDays >= 5 ? '🌟 順調です！' : 
           '📈 がんばろう！'}
        </div>
      </div>

      {/* 成長指標 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 今日の成果 */}
        <div className="bg-white rounded-xl p-6 shadow-lg border">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📈</span>
            <h3 className="font-bold text-lg">今日の成果</h3>
          </div>
          {stats.growthMetrics.todayImprovement.percentage > 0 ? (
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                stats.growthMetrics.todayImprovement.isImprovement ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.growthMetrics.todayImprovement.isImprovement ? '+' : '-'}
                {stats.growthMetrics.todayImprovement.percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600 mt-1">
                昨日より {stats.growthMetrics.todayImprovement.isImprovement ? 'UP!' : 'DOWN'}
                {stats.growthMetrics.todayImprovement.isImprovement && stats.growthMetrics.todayImprovement.percentage >= 10 ? ' 🔥' : ''}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 text-sm">
              昨日のデータなし
            </div>
          )}
        </div>

        {/* 週間平均 */}
        <div className="bg-white rounded-xl p-6 shadow-lg border">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📊</span>
            <h3 className="font-bold text-lg">週間平均</h3>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.growthMetrics.weeklyAverage.current}%
            </div>
            {stats.growthMetrics.weeklyAverage.previous > 0 && (
              <div className="text-sm text-slate-600 mt-1">
                先週: {stats.growthMetrics.weeklyAverage.previous}%
                {stats.growthMetrics.weeklyAverage.improvement !== 0 && (
                  <span className={`ml-1 ${
                    stats.growthMetrics.weeklyAverage.improvement > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ({stats.growthMetrics.weeklyAverage.improvement > 0 ? '+' : ''}
                    {stats.growthMetrics.weeklyAverage.improvement}%)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 連続記録更新 */}
        <div className="bg-white rounded-xl p-6 shadow-lg border">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⭐</span>
            <h3 className="font-bold text-lg">連続記録</h3>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.growthMetrics.consecutiveStreak}日連続
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {stats.growthMetrics.consecutiveStreak >= 5 ? '素晴らしい！' : 'がんばろう！'}
            </div>
          </div>
        </div>

        {/* 最も成長した科目 */}
        <div className="bg-white rounded-xl p-6 shadow-lg border">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🚀</span>
            <h3 className="font-bold text-lg">成長科目</h3>
          </div>
          {stats.growthMetrics.mostImprovedSubject ? (
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {stats.growthMetrics.mostImprovedSubject.label}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                +{stats.growthMetrics.mostImprovedSubject.improvement}% UP!
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 text-sm">
              データ蓄積中
            </div>
          )}
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
          <>
            {/* 累積正答率 */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-4">累積正答率</h3>
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

          </>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <span className="text-4xl mb-4 block">📊</span>
            <p>学習記録を追加すると成績が表示されます</p>
          </div>
        )}
      </div>

      {/* 応援メッセージ */}
      {getRecentFeedbacks().length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-2xl">💌</span>
              最近の応援メッセージ・スタンプ
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
            {getRecentFeedbacks()
              .map((feedbackWithRecord) => (
              <div key={feedbackWithRecord.feedback.id} className="bg-slate-50 p-4 rounded-xl">
                {/* 学習記録情報を表示 */}
                {feedbackWithRecord.record && (
                  <div className="mb-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getSubjectIcon(feedbackWithRecord.record.subject)}</span>
                      <span className="font-semibold">{getSubjectLabel(feedbackWithRecord.record.subject)}</span>
                      <span className="text-sm px-2 py-1 bg-slate-100 text-slate-600 rounded">
                        {getContentTypeLabel(feedbackWithRecord.record.content_type)}
                      </span>
                      {feedbackWithRecord.record.attempt_number > 1 && (
                        <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {feedbackWithRecord.record.attempt_number}回目
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 flex items-center gap-4">
                      <span>📅 {formatStudyDateDisplay(feedbackWithRecord.record.study_date)}実施分</span>
                      <span className="font-medium text-blue-600">
                        🎯 {feedbackWithRecord.record.questions_correct}/{feedbackWithRecord.record.questions_total}問正解 
                        ({Math.round((feedbackWithRecord.record.questions_correct / feedbackWithRecord.record.questions_total) * 100)}%)
                      </span>
                      <span>{getEmotionLabel(feedbackWithRecord.record.emotion)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    feedbackWithRecord.feedback.sender_type === 'parent' 
                      ? 'bg-pink-100 text-pink-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {feedbackWithRecord.feedback.sender_type === 'parent' ? '👨‍👩‍👧‍👦 保護者' : '👨‍🏫 指導者'}
                  </span>
                  {feedbackWithRecord.feedback.reaction_type && (
                    <span className="text-2xl">
                      {feedbackWithRecord.feedback.reaction_type === 'clap' && '👏'}
                      {feedbackWithRecord.feedback.reaction_type === 'thumbs' && '👍'}
                      {feedbackWithRecord.feedback.reaction_type === 'muscle' && '💪'}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 ml-auto">
                    {(() => {
                      const date = new Date(feedbackWithRecord.feedback.created_at)
                      const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000))
                      return jstDate.toLocaleString('ja-JP', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    })()}
                  </span>
                </div>

                {feedbackWithRecord.feedback.message && 
                 typeof feedbackWithRecord.feedback.message === 'string' && 
                 feedbackWithRecord.feedback.message.trim() !== '' ? (
                  <p className="text-slate-700">{feedbackWithRecord.feedback.message}</p>
                ) : feedbackWithRecord.feedback.reaction_type && (
                  <p className="text-slate-600 italic text-sm">
                    {feedbackWithRecord.feedback.reaction_type === 'clap' && 'すごい！'}
                    {feedbackWithRecord.feedback.reaction_type === 'thumbs' && 'いいね！'}
                    {feedbackWithRecord.feedback.reaction_type === 'muscle' && '頑張って！'}
                  </p>
                )}
              </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
} 