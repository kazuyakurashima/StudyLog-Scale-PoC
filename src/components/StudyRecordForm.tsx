"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "./ui/Card"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { Textarea } from "./ui/Textarea"
import { EmotionButton } from "./ui/EmotionButton"

interface StudyRecord {
  subject: string
  totalQuestions: string
  correctAnswers: string
  emotion: string
  comment: string
}

const StudyRecordForm: React.FC = () => {
  const [record, setRecord] = useState<StudyRecord>({
    subject: "",
    totalQuestions: "",
    correctAnswers: "",
    emotion: "",
    comment: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const subjects = [
    { value: "japanese", label: "国語", icon: "📚", color: "from-red-400 to-pink-500" },
    { value: "math", label: "算数", icon: "🔢", color: "from-blue-400 to-cyan-500" },
    { value: "science", label: "理科", icon: "🔬", color: "from-green-400 to-emerald-500" },
    { value: "social", label: "社会", icon: "🌍", color: "from-yellow-400 to-orange-500" },
  ]

  const emotions = [
    { value: "excellent", emoji: "😊", label: "よくできた", color: "from-green-400 to-emerald-500" },
    { value: "normal", emoji: "😐", label: "ふつう", color: "from-yellow-400 to-orange-500" },
    { value: "difficult", emoji: "😞", label: "むずかしかった", color: "from-red-400 to-pink-500" },
  ]

  const handleInputChange = (field: keyof StudyRecord, value: string) => {
    setRecord((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!record.subject || !record.totalQuestions || !record.correctAnswers || !record.emotion) {
      alert("必須項目を入力してください")
      return
    }

    const total = Number.parseInt(record.totalQuestions)
    const correct = Number.parseInt(record.correctAnswers)

    if (correct > total) {
      alert("正答数は問題数以下にしてください")
      return
    }

    setIsSubmitting(true)

    // シミュレート保存処理
    await new Promise((resolve) => setTimeout(resolve, 1500))

    console.log({
      ...record,
      totalQuestions: total,
      correctAnswers: correct,
      date: new Date().toISOString().split("T")[0],
    })

    setIsSubmitting(false)
    setShowSuccess(true)

    // 成功メッセージを3秒後に非表示
    setTimeout(() => {
      setShowSuccess(false)
      setRecord({
        subject: "",
        totalQuestions: "",
        correctAnswers: "",
        emotion: "",
        comment: "",
      })
    }, 3000)
  }

  const selectedSubject = subjects.find((s) => s.value === record.subject)
  const selectedEmotion = emotions.find((e) => e.value === record.emotion)

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
          <span className="text-2xl sm:text-3xl">📖</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Studyログ
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 font-medium">今日の学習を記録しよう！</p>
      </div>

      {/* 成功メッセージ */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <Card className="mx-4 p-8 text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">すばらしい！</h3>
            <p className="text-gray-600">学習記録を保存しました</p>
          </Card>
        </div>
      )}

      {/* メインフォーム */}
      <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 sm:p-8 rounded-t-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center flex items-center justify-center gap-3">
            <span className="text-3xl">✨</span>
            今日の学習記録
            <span className="text-3xl">✨</span>
          </h2>
        </div>

        <div className="p-6 sm:p-8 lg:p-10 space-y-8 sm:space-y-10">
          {/* 科目選択 */}
          <div className="space-y-4">
            <label className="block text-xl sm:text-2xl font-bold text-gray-800">📚 科目を選んでね</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {subjects.map((subject) => (
                <button
                  key={subject.value}
                  onClick={() => handleInputChange("subject", subject.value)}
                  className={`p-4 sm:p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    record.subject === subject.value
                      ? `bg-gradient-to-r ${subject.color} text-white border-transparent shadow-lg`
                      : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <div className="text-2xl sm:text-3xl mb-2">{subject.icon}</div>
                  <div className="font-bold text-sm sm:text-base">{subject.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 問題数・正答数 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4">
              <label className="block text-xl sm:text-2xl font-bold text-gray-800">📝 問題数</label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={record.totalQuestions}
                  onChange={(e) => handleInputChange("totalQuestions", e.target.value)}
                  className="text-center text-xl sm:text-2xl font-bold h-16 sm:h-20 pr-12"
                  placeholder="20"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl sm:text-2xl font-bold text-gray-500">
                  問
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xl sm:text-2xl font-bold text-gray-800">✅ 正答数</label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max={record.totalQuestions || "100"}
                  value={record.correctAnswers}
                  onChange={(e) => handleInputChange("correctAnswers", e.target.value)}
                  className="text-center text-xl sm:text-2xl font-bold h-16 sm:h-20 pr-12"
                  placeholder="18"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl sm:text-2xl font-bold text-gray-500">
                  問
                </span>
              </div>
            </div>
          </div>

          {/* 正答率表示 */}
          {record.totalQuestions && record.correctAnswers && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100">
              <div className="text-center">
                <div className="text-sm sm:text-base text-gray-600 mb-2">正答率</div>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {Math.round((Number.parseInt(record.correctAnswers) / Number.parseInt(record.totalQuestions)) * 100)}%
                </div>
              </div>
            </div>
          )}

          {/* 感情評価 */}
          <div className="space-y-4">
            <label className="block text-xl sm:text-2xl font-bold text-gray-800">💭 今日の気持ちは？</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {emotions.map((emotion) => (
                <EmotionButton
                  key={emotion.value}
                  emotion={emotion}
                  isSelected={record.emotion === emotion.value}
                  onClick={() => handleInputChange("emotion", emotion.value)}
                />
              ))}
            </div>
          </div>

          {/* コメント */}
          <div className="space-y-4">
            <label className="block text-xl sm:text-2xl font-bold text-gray-800">💬 一言コメント（任意）</label>
            <Textarea
              value={record.comment}
              onChange={(e) => handleInputChange("comment", e.target.value)}
              maxLength={100}
              className="min-h-24 sm:min-h-32 text-base sm:text-lg resize-none"
              placeholder="今日の学習で感じたことを書いてみよう..."
            />
            <div className="text-right text-sm text-gray-500">{record.comment.length}/100文字</div>
          </div>

          {/* 保存ボタン */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-16 sm:h-20 text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                保存中...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">💾</span>
                学習記録を保存する
              </div>
            )}
          </Button>
        </div>
      </Card>

      {/* 励ましメッセージ */}
      <div className="text-center mt-8 sm:mt-12">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="text-4xl sm:text-5xl mb-4">🌟</div>
          <p className="text-lg sm:text-xl font-bold text-gray-700 mb-2">毎日コツコツ続けることが大切だよ！</p>
          <p className="text-sm sm:text-base text-gray-600">記録を続けることで、きっと成長が見えるはず</p>
        </div>
      </div>
    </div>
  )
}

export default StudyRecordForm
