import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { StudyRecord, Feedback } from '../lib/supabase'
import PersonalizedFeedback from './PersonalizedFeedback'
import type { StudyData, StudyHistory, SenderType } from '../lib/openai'

interface FeedbackPageProps {
  userRole: 'parent' | 'teacher'
}

interface ExtendedStudyRecord extends StudyRecord {
  history: {
    attempt: number
    correct: number
    total: number
    accuracy: number
    record_date: string
    emotion: string
  }[]
}

export default function FeedbackPage({ userRole }: FeedbackPageProps) {
  const [studyRecords, setStudyRecords] = useState<ExtendedStudyRecord[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<ExtendedStudyRecord | null>(null)
  const [commentText, setCommentText] = useState('')
  const [sending, setSending] = useState(false)
  const [reactionSent, setReactionSent] = useState<{recordId: number, type: string} | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // 最近の学習記録を取得（直近14日間に拡張）
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      const dateLimit = fourteenDaysAgo.toISOString().split('T')[0]

      const { data: records, error: recordsError } = await supabase
        .from('study_records')
        .select('*')
        .gte('date', dateLimit)
        .order('date', { ascending: false })

      if (recordsError) throw recordsError

      // フィードバックを取得
      const { data: allFeedbacks, error: feedbacksError } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false })

      if (feedbacksError) throw feedbacksError

      // 学習記録を拡張形式で処理
      const extendedRecords = await processStudyRecords(records || [])

      setStudyRecords(extendedRecords)
      setFeedbacks(allFeedbacks || [])

    } catch (error) {
      console.error('❌ データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const processStudyRecords = async (records: StudyRecord[]): Promise<ExtendedStudyRecord[]> => {
    const processedRecords: ExtendedStudyRecord[] = []

    for (const record of records) {
      // 同じ学習内容の履歴を取得
      const history = records
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

      processedRecords.push({
        ...record,
        history
      })
    }

    return processedRecords
  }

  const getStudyHistoryData = async (recordId: number): Promise<StudyHistory> => {
    try {
      // 過去30日間のデータを取得
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const dateLimit = thirtyDaysAgo.toISOString().split('T')[0]

      const { data: records, error } = await supabase
        .from('study_records')
        .select('*')
        .gte('date', dateLimit)
        .order('date', { ascending: false })

      if (error) throw error

      // 連続日数を計算
      const uniqueDates = [...new Set(records?.map(r => r.date) || [])]
      const continuationDays = calculateContinuationDays(uniqueDates)

      // 科目別正解率を計算
      const subjectAccuracy: Record<string, { correct: number; total: number }> = {}
      records?.forEach(record => {
        if (!subjectAccuracy[record.subject]) {
          subjectAccuracy[record.subject] = { correct: 0, total: 0 }
        }
        subjectAccuracy[record.subject].correct += record.questions_correct
        subjectAccuracy[record.subject].total += record.questions_total
      })

      // 最近の記録（5件）
      const recentRecords: StudyData[] = (records?.slice(0, 5) || []).map(record => ({
        subject: record.subject,
        questionsTotal: record.questions_total,
        questionsCorrect: record.questions_correct,
        emotion: record.emotion as 'good' | 'normal' | 'hard',
        comment: record.comment || undefined,
        date: record.date
      }))

      return {
        recentRecords,
        totalDays: uniqueDates.length,
        continuationDays,
        subjectAccuracy
      }
    } catch (error) {
      console.error('学習履歴データの取得に失敗:', error)
      return {
        recentRecords: [],
        totalDays: 0,
        continuationDays: 0,
        subjectAccuracy: {}
      }
    }
  }

  const calculateContinuationDays = (dates: string[]): number => {
    if (dates.length === 0) return 0
    
    const sortedDates = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    let continuationCount = 1
    
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i])
      const previousDate = new Date(sortedDates[i - 1])
      const diffDays = Math.floor((previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        continuationCount++
      } else {
        break
      }
    }
    
    return continuationCount
  }

  const sendPersonalizedFeedback = async (recordId: number, message: string, emoji: string) => {
    try {
      setSending(true)

      const { error } = await supabase
        .from('feedbacks')
        .insert([{
          record_id: recordId,
          sender_type: userRole,
          reaction_type: null,
          message: message
        }])

      if (error) throw error

      console.log('✅ 個別最適化メッセージ送信成功')
      
      // 送信状態をすぐにリセット
      setSending(false)
      
      // 視覚フィードバックを表示
      setReactionSent({ recordId, type: 'personalized' })
      
      // 2秒後にフィードバックを非表示にし、フィードバックを配列に追加
      setTimeout(() => {
        setReactionSent(null)
        const newFeedback: Feedback = {
          id: Date.now(),
          record_id: recordId,
          sender_type: userRole,
          reaction_type: undefined,
          message: message,
          created_at: new Date().toISOString()
        }
        setFeedbacks(prev => [newFeedback, ...prev])
      }, 2000)

    } catch (error) {
      console.error('❌ 個別最適化メッセージ送信エラー:', error)
      alert('メッセージの送信に失敗しました')
      setSending(false)
      setReactionSent(null)
    }
  }

  const sendReaction = async (recordId: number, reactionType: 'clap' | 'thumbs' | 'muscle') => {
    try {
      setSending(true)

      const { error } = await supabase
        .from('feedbacks')
        .insert([{
          record_id: recordId,
          sender_type: userRole,
          reaction_type: reactionType,
          message: null
        }])

      if (error) throw error

      console.log('✅ リアクション送信成功')
      
      // 送信状態をすぐにリセット
      setSending(false)
      
      // 視覚フィードバックを表示
      setReactionSent({ recordId, type: reactionType })
      
      // 2秒後にフィードバックを非表示にし、バックグラウンドでデータを再読み込み
      setTimeout(() => {
        setReactionSent(null)
                 // 画面遷移を避けるため、loadData()は呼ばない
         // 代わりに、フィードバックを直接feedbacks配列に追加
         const newFeedback: Feedback = {
           id: Date.now(), // 一時的なID
           record_id: recordId,
           sender_type: userRole,
           reaction_type: reactionType,
           message: undefined,
           created_at: new Date().toISOString()
         }
        setFeedbacks(prev => [newFeedback, ...prev])
      }, 2000)

    } catch (error) {
      console.error('❌ リアクション送信エラー:', error)
      alert('リアクションの送信に失敗しました')
      setSending(false)
      setReactionSent(null)
    }
  }

  const sendComment = async (recordId: number) => {
    if (!commentText.trim()) {
      alert('コメントを入力してください')
      return
    }

    try {
      setSending(true)

      const { error } = await supabase
        .from('feedbacks')
        .insert([{
          record_id: recordId,
          sender_type: userRole,
          reaction_type: null,
          message: commentText.trim()
        }])

      if (error) throw error

      console.log('✅ コメント送信成功')
      
      // 画面遷移を避けるため、loadData()は呼ばない
      // 代わりに、フィードバックを直接feedbacks配列に追加
      const newFeedback: Feedback = {
        id: Date.now(), // 一時的なID
        record_id: recordId,
        sender_type: userRole,
        reaction_type: undefined,
        message: commentText.trim(),
        created_at: new Date().toISOString()
      }
      setFeedbacks(prev => [newFeedback, ...prev])
      
      // フォームをリセット
      setCommentText('')
      setSelectedRecord(null)

    } catch (error) {
      console.error('❌ コメント送信エラー:', error)
      alert('コメントの送信に失敗しました')
    } finally {
      setSending(false)
    }
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

  const getRoleLabel = (role: string) => {
    return role === 'parent' ? '👨‍👩‍👧‍👦 保護者' : '👨‍🏫 指導者'
  }

  const getRecordFeedbacks = (recordId: number) => {
    return feedbacks.filter(feedback => feedback.record_id === recordId)
  }

  const formatHistoryDisplay = (history: ExtendedStudyRecord['history']) => {
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
      year: 'numeric',
      month: 'numeric', 
      day: 'numeric' 
    })
  }

  const formatRecordDateDisplay = (recordDate: string) => {
    return new Date(recordDate).toLocaleDateString('ja-JP', { 
      month: 'numeric', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg">学習記録を読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* ヘッダー */}
      <div className="text-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
          💌 応援・フィードバック
        </h1>
        <p className="text-slate-600 text-lg">
          {getRoleLabel(userRole)}として、がんばりを応援しよう！
        </p>
      </div>

      {/* 学習記録一覧 */}
      <div className="space-y-6">
        {studyRecords.length > 0 ? (
          studyRecords.map((record) => {
            const recordFeedbacks = getRecordFeedbacks(record.id)
            const accuracy = Math.round((record.questions_correct / record.questions_total) * 100)

            return (
              <div key={record.id} className="bg-white rounded-2xl p-6 shadow-lg border">
                {/* 学習記録の詳細ヘッダー */}
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">
                        {getSubjectLabel(record.subject)}（{getContentTypeLabel(record.content_type)}）
                      </h3>
                      <div className="flex items-center gap-4 text-slate-600">
                        <div>
                          <span className="font-medium">学習実施日:</span> {formatStudyDateDisplay(record.study_date)}
                        </div>
                        <div>
                          <span className="font-medium">記録日:</span> {formatRecordDateDisplay(record.date)}
                        </div>
                        {record.attempt_number > 1 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                            {record.attempt_number}回目
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-blue-600">
                        {accuracy}%
                      </div>
                      <div className="text-sm text-slate-500">
                        {record.questions_correct}/{record.questions_total}問正解
                      </div>
                    </div>
                  </div>

                  {/* 成績の履歴表示 */}
                  {record.history.length > 1 && (
                    <div className="bg-blue-50 p-4 rounded-xl mb-4">
                      <h4 className="font-bold text-blue-800 mb-2">📈 成績の変化</h4>
                      <div className="text-blue-700">
                        <div className="font-mono text-lg mb-2">
                          {formatHistoryDisplay(record.history)}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">成長:</span>
                          <span className="ml-2 text-green-700 font-bold">
                            +{record.history[record.history.length - 1].accuracy - record.history[0].accuracy}%改善
                          </span>
                          <span className="ml-4 text-slate-600">
                            （{record.history.length}回挑戦）
                          </span>
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {record.history.map((h, idx) => (
                            <span key={idx} className="mr-3">
                              {idx + 1}回目: {formatRecordDateDisplay(h.record_date)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 p-4 rounded-xl mb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-lg font-medium">今回の気持ち:</span>
                      <span className="text-xl">{getEmotionLabel(record.emotion)}</span>
                    </div>
                    {record.comment && (
                      <div>
                        <span className="text-lg font-medium">コメント:</span>
                        <p className="text-slate-700 mt-1">「{record.comment}」</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 個別最適化応援メッセージ */}
                <div className="mb-6">
                  <PersonalizedFeedback
                    recordId={record.id}
                    studyData={{
                      subject: record.subject,
                      questionsTotal: record.questions_total,
                      questionsCorrect: record.questions_correct,
                      emotion: record.emotion as 'good' | 'normal' | 'hard',
                      comment: record.comment || undefined,
                      date: record.date
                    }}
                    senderType={userRole as SenderType}
                    onSendFeedback={sendPersonalizedFeedback}
                    sending={sending}
                    reactionSent={reactionSent}
                    getStudyHistory={getStudyHistoryData}
                  />
                </div>

                {/* コメント入力 */}
                <div className="mb-6">
                  <h4 className="text-lg font-bold mb-3">メッセージを送る:</h4>
                  {selectedRecord?.id === record.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        maxLength={500}
                        className="w-full min-h-24 p-4 border-2 border-slate-200 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 text-lg resize-none"
                        placeholder="応援のメッセージを書いてください..."
                      />
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-500">
                          {commentText.length}/500文字
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedRecord(null)
                              setCommentText('')
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            キャンセル
                          </button>
                          <button
                            onClick={() => sendComment(record.id)}
                            disabled={sending || !commentText.trim()}
                            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sending ? '送信中...' : '送信'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
                    >
                      💬 メッセージを書く
                    </button>
                  )}
                </div>

                {/* これまでの応援 */}
                {recordFeedbacks.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold mb-3">これまでの応援:</h4>
                    <div className="space-y-2">
                      {recordFeedbacks
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((feedback) => (
                        <div key={feedback.id} className="bg-slate-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              feedback.sender_type === 'parent' 
                                ? 'bg-pink-100 text-pink-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {getRoleLabel(feedback.sender_type)}
                            </span>
                            {feedback.reaction_type && (
                              <span className="text-lg">
                                {feedback.reaction_type === 'clap' && '👏 すごい！'}
                                {feedback.reaction_type === 'thumbs' && '👍 いいね！'}
                                {feedback.reaction_type === 'muscle' && '💪 頑張って！'}
                              </span>
                            )}
                            <span className="text-xs text-slate-500 ml-auto">
                              {new Date(feedback.created_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                          {feedback.message && 
                           typeof feedback.message === 'string' && 
                           feedback.message.trim() !== '' && (
                            <p className="text-slate-700 text-sm mt-1">{feedback.message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📝</span>
            <h3 className="text-2xl font-bold text-slate-600 mb-2">学習記録がまだありません</h3>
            <p className="text-slate-500">学習記録が投稿されると、ここに表示されます</p>
          </div>
        )}
      </div>
    </div>
  )
} 