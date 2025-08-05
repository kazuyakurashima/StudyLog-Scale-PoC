import { useState, useEffect } from 'react'
import { generatePersonalizedMessages, type PersonalizedMessage, type StudyData, type StudyHistory, type SenderType } from '../lib/openai'
import { supabase } from '../lib/supabase'

interface PersonalizedFeedbackProps {
  recordId: number
  studyData: StudyData
  senderType: SenderType
  onSendFeedback: (recordId: number, message: string, emoji: string) => Promise<void>
  sending: boolean
  reactionSent: { recordId: number; type: string } | null
  getStudyHistory: (recordId: number) => Promise<StudyHistory>
}

export default function PersonalizedFeedback({
  recordId,
  studyData,
  senderType,
  onSendFeedback,
  sending,
  reactionSent,
  getStudyHistory
}: PersonalizedFeedbackProps) {
  const [messages, setMessages] = useState<PersonalizedMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // カスタムメッセージ機能は統合のため削除

  useEffect(() => {
    loadPersonalizedMessages()
  }, [recordId, senderType])

  const loadPersonalizedMessages = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 学習履歴データを取得
      const studyHistory = await getStudyHistory(recordId)
      
      const personalizedMessages = await generatePersonalizedMessages(
        studyData,
        studyHistory,
        senderType
      )
      
      setMessages(personalizedMessages)
    } catch (err) {
      console.error('個別最適化メッセージの生成に失敗:', err)
      setError('メッセージの生成に失敗しました')
      // フォールバック: デフォルトメッセージを使用
      setMessages(getDefaultMessages(senderType))
    } finally {
      setLoading(false)
    }
  }

  const getDefaultMessages = (senderType: SenderType): PersonalizedMessage[] => {
    if (senderType === 'parent') {
      return [
        { message: "今日もよく頑張ったね！😊", emoji: "😊", type: "encouraging" },
        { message: "コツコツ続ける姿が素晴らしい🎯", emoji: "🎯", type: "specific_praise" },
        { message: "パパママも応援してるよ💝", emoji: "💝", type: "loving" }
      ]
    } else {
      return [
        { message: "着実に力がついています📈", emoji: "📈", type: "encouraging" },
        { message: "この調子で継続しましょう🎯", emoji: "🎯", type: "instructional" },
        { message: "次のステップに進みましょう💪", emoji: "💪", type: "motivational" }
      ]
    }
  }

  const handleMessageSelect = async (message: PersonalizedMessage) => {
    await onSendFeedback(recordId, message.message, message.emoji)
  }

  // カスタムメッセージ送信機能は削除（統合のため）

  if (reactionSent?.recordId === recordId) {
    return (
      <div className="bg-green-100 border border-green-300 text-green-800 px-6 py-4 rounded-xl flex items-center justify-center gap-3 animate-pulse">
        <span className="text-3xl">✨</span>
        <span className="font-bold text-lg">応援メッセージを送信しました！</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-bold mb-3">
        {senderType === 'parent' ? '👨‍👩‍👧‍👦 保護者として応援する:' : '👨‍🏫 指導者として応援する:'}
      </h4>
      
      {loading && (
        <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span className="text-blue-700">あなた専用の応援メッセージを生成中...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-xl text-red-700">
          <p>{error}</p>
          <button 
            onClick={loadPersonalizedMessages}
            className="mt-2 text-sm underline hover:no-underline"
          >
            再試行
          </button>
        </div>
      )}

      {!loading && messages.length > 0 && (
        <div className="space-y-3">
          {messages.map((message, index) => (
            <button
              key={index}
              onClick={() => handleMessageSelect(message)}
              disabled={sending}
              className="w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-200 rounded-xl text-left transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{message.emoji}</span>
                <div className="flex-1">
                  <p className="text-slate-800 font-medium text-lg">{message.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getTypeColor(message.type)
                    }`}>
                      {getTypeLabel(message.type)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {senderType === 'parent' ? '保護者' : '指導者'}向け
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
          
          {/* カスタムメッセージ機能は統合のため削除 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            💡 より詳しいメッセージを送りたい場合は、下の「メッセージを送る」セクションをご利用ください
          </div>
        </div>
      )}
    </div>
  )
}

function getTypeColor(type: PersonalizedMessage['type']): string {
  const colors = {
    encouraging: 'bg-green-100 text-green-700',
    specific_praise: 'bg-blue-100 text-blue-700',
    motivational: 'bg-red-100 text-red-700',
    loving: 'bg-pink-100 text-pink-700',
    instructional: 'bg-purple-100 text-purple-700'
  }
  return colors[type] || 'bg-gray-100 text-gray-700'
}

function getTypeLabel(type: PersonalizedMessage['type']): string {
  const labels = {
    encouraging: '励まし',
    specific_praise: '具体的称賛',
    motivational: '動機付け',
    loving: '愛情表現',
    instructional: '指導的'
  }
  return labels[type] || type
}