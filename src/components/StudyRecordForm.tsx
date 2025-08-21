"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { StudyRecord } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'

export default function StudyRecordForm() {
  const { user } = useAuth()
  
  // フォームの状態管理
  const [studyDate, setStudyDate] = useState('')
  const [subject, setSubject] = useState('')
  const [contentType, setContentType] = useState<'class' | 'homework'>('class')
  const [questionsTotal, setQuestionsTotal] = useState('')
  const [questionsCorrect, setQuestionsCorrect] = useState('')
  const [emotion, setEmotion] = useState('')
  const [comment, setComment] = useState('')
  
  // UI状態管理
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [existingRecords, setExistingRecords] = useState<StudyRecord[]>([])
  const [nextAttemptNumber, setNextAttemptNumber] = useState(1)

  // コンポーネント初期化時に今日の日付を設定
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setStudyDate(today)
  }, [])

  // 学習実施日、科目、種別が変更された時に履歴をチェック
  useEffect(() => {
    if (studyDate && subject && contentType) {
      checkExistingRecords()
    }
  }, [studyDate, subject, contentType])

  const checkExistingRecords = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('study_records')
        .select('*')
        .eq('student_id', user.id)
        .eq('study_date', studyDate)
        .eq('subject', subject)
        .eq('content_type', contentType)
        .order('attempt_number', { ascending: true })

      if (error) throw error

      setExistingRecords(data || [])
      setNextAttemptNumber((data?.length || 0) + 1)
    } catch (error) {
      console.error('履歴取得エラー:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      setMessage('ユーザー情報が取得できません')
      setMessageType('error')
      return
    }
    
    if (!studyDate || !subject || !contentType || !questionsTotal || !questionsCorrect || !emotion) {
      setMessage('すべての項目を入力してください')
      setMessageType('error')
      return
    }

    const total = parseInt(questionsTotal)
    const correct = parseInt(questionsCorrect)

    if (isNaN(total) || isNaN(correct) || total <= 0 || correct < 0 || correct > total) {
      setMessage('問題数と正解数を正しく入力してください')
      setMessageType('error')
      return
    }

    try {
      setLoading(true)
      setMessage('')

      const today = new Date().toISOString().split('T')[0]

      const { error } = await supabase
        .from('study_records')
        .insert([{
          student_id: user.id, // 生徒ID
          date: today, // 記録をつけた日（今日）
          study_date: studyDate, // 学習内容の実施日
          subject,
          content_type: contentType,
          attempt_number: nextAttemptNumber,
          questions_total: total,
          questions_correct: correct,
          emotion,
          comment: comment.trim() || null
        }])

      if (error) throw error

      setMessage('✅ 学習記録を保存しました！')
      setMessageType('success')
      
      // フォームをリセット（一部の項目は保持）
      setQuestionsTotal('')
      setQuestionsCorrect('')
      setEmotion('')
      setComment('')
      
      // 履歴を更新
      await checkExistingRecords()
      
    } catch (error) {
      console.error('❌ 保存エラー:', error)
      setMessage('保存に失敗しました。もう一度お試しください。')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const getSubjectLabel = (subjectKey: string) => {
    const subjects: Record<string, string> = {
      aptitude: '適性',
      japanese: '国語',
      math: '算数',
      science: '理科',
      social: '社会'
    }
    return subjects[subjectKey] || subjectKey
  }

  const formatHistoryDisplay = (records: StudyRecord[]) => {
    if (records.length === 0) return ''
    
    return records.map(record => 
      `${record.questions_correct}/${record.questions_total}`
    ).join(' → ')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          📝 学習記録
        </h1>
        <p className="text-slate-600 text-lg">今日のがんばりを記録しよう！</p>
      </div>

      {/* 履歴表示 */}
      {existingRecords.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="font-bold text-blue-800 mb-2">📚 この学習内容の履歴</h3>
          <div className="text-blue-700">
            <div className="font-medium">
              {getSubjectLabel(subject)}（{contentType === 'class' ? '授業' : '宿題'}）
              - {new Date(studyDate).toLocaleDateString('ja-JP')}実施分
            </div>
            <div className="text-lg mt-1">
              これまでの成績: {formatHistoryDisplay(existingRecords)}
            </div>
            <div className="text-sm text-blue-600 mt-1">
              今回は{nextAttemptNumber}回目の挑戦です
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 学習実施日の選択 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <label className="block text-lg font-bold text-slate-700 mb-3">
            📅 いつの学習内容ですか？
          </label>
          <input
            type="date"
            value={studyDate}
            onChange={(e) => setStudyDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full text-lg p-4 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            required
          />
          <p className="text-sm text-slate-500 mt-2">
            今日復習した学習内容が、いつ実施されたものかを選択してください
          </p>
        </div>

        {/* 科目選択 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <label className="block text-lg font-bold text-slate-700 mb-3">
            📚 科目を選択
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'aptitude', label: '適性', icon: '🧠', color: 'purple' },
              { key: 'japanese', label: '国語', icon: '📚', color: 'rose' },
              { key: 'math', label: '算数', icon: '🔢', color: 'blue' },
              { key: 'science', label: '理科', icon: '🔬', color: 'green' },
              { key: 'social', label: '社会', icon: '🌍', color: 'amber' },
            ].map((subjectOption) => (
              <button
                key={subjectOption.key}
                type="button"
                onClick={() => setSubject(subjectOption.key)}
                className={`p-4 rounded-xl border-2 transition-all font-medium ${
                  subject === subjectOption.key
                    ? subjectOption.color === 'purple' ? 'border-purple-400 bg-purple-50 text-purple-700' :
                      subjectOption.color === 'rose' ? 'border-rose-400 bg-rose-50 text-rose-700' :
                      subjectOption.color === 'blue' ? 'border-blue-400 bg-blue-50 text-blue-700' :
                      subjectOption.color === 'green' ? 'border-green-400 bg-green-50 text-green-700' :
                      subjectOption.color === 'amber' ? 'border-amber-400 bg-amber-50 text-amber-700' :
                      'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="text-2xl mb-1">{subjectOption.icon}</div>
                <div className="text-sm">{subjectOption.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 授業・宿題の種別選択 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <label className="block text-lg font-bold text-slate-700 mb-3">
            🎯 授業？宿題？
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setContentType('class')}
              className={`p-4 rounded-xl border-2 transition-all font-medium ${
                contentType === 'class'
                  ? 'border-blue-400 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="text-3xl mb-2">🏫</div>
              <div className="font-bold">授業</div>
              <div className="text-sm">授業で習った内容</div>
            </button>
            <button
              type="button"
              onClick={() => setContentType('homework')}
              className={`p-4 rounded-xl border-2 transition-all font-medium ${
                contentType === 'homework'
                  ? 'border-orange-400 bg-orange-50 text-orange-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="text-3xl mb-2">📝</div>
              <div className="font-bold">宿題</div>
              <div className="text-sm">宿題として出された内容</div>
            </button>
          </div>
        </div>

        {/* 問題数と正解数 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <label className="block text-lg font-bold text-slate-700 mb-3">
            🎯 今回の成績
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                問題数（全体）
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={questionsTotal}
                onChange={(e) => setQuestionsTotal(e.target.value)}
                className="w-full text-lg p-3 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="例: 10"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                正解数
              </label>
              <input
                type="number"
                min="0"
                max={questionsTotal || "200"}
                value={questionsCorrect}
                onChange={(e) => setQuestionsCorrect(e.target.value)}
                className="w-full text-lg p-3 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="例: 7"
                required
              />
            </div>
          </div>
          {questionsTotal && questionsCorrect && (
            <div className="mt-3 text-center">
              <span className="text-2xl font-bold text-blue-600">
                正答率: {Math.round((parseInt(questionsCorrect) / parseInt(questionsTotal)) * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* 今日の気持ち */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <label className="block text-lg font-bold text-slate-700 mb-3">
            😊 今日の気持ち
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'good', label: 'よくできた', icon: '😊', color: 'green' },
              { key: 'normal', label: '普通', icon: '😐', color: 'blue' },
              { key: 'hard', label: '難しかった', icon: '😞', color: 'orange' },
            ].map((emotionOption) => (
              <button
                key={emotionOption.key}
                type="button"
                onClick={() => setEmotion(emotionOption.key)}
                className={`p-4 rounded-xl border-2 transition-all font-medium ${
                  emotion === emotionOption.key
                    ? emotionOption.color === 'green' ? 'border-green-400 bg-green-50 text-green-700' :
                      emotionOption.color === 'blue' ? 'border-blue-400 bg-blue-50 text-blue-700' :
                      emotionOption.color === 'orange' ? 'border-orange-400 bg-orange-50 text-orange-700' :
                      'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="text-3xl mb-2">{emotionOption.icon}</div>
                <div className="text-sm">{emotionOption.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* コメント */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <label className="block text-lg font-bold text-slate-700 mb-3">
            💭 今日の振り返り（自由記入）
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={300}
            className="w-full min-h-24 p-4 border-2 border-slate-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-lg resize-none"
            placeholder="今日の学習でどんなことを感じましたか？（任意）"
          />
          <div className="text-right text-sm text-slate-500 mt-2">
            {comment.length}/300文字
          </div>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`p-4 rounded-xl font-medium ${
            messageType === 'success' 
              ? 'bg-green-100 border border-green-300 text-green-800' 
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold py-4 px-6 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '保存中...' : '📝 学習記録を保存'}
        </button>
      </form>
    </div>
  )
}
