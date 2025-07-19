"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Calculator, Microscope, Globe, Save, Sparkles } from "lucide-react"

export default function StudyRecordPage() {
  const [subject, setSubject] = useState("")
  const [totalQuestions, setTotalQuestions] = useState("")
  const [correctAnswers, setCorrectAnswers] = useState("")
  const [emotion, setEmotion] = useState("")
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const subjects = [
    { value: "japanese", label: "国語", icon: BookOpen, color: "from-pink-500 to-rose-500" },
    { value: "math", label: "算数", icon: Calculator, color: "from-blue-500 to-cyan-500" },
    { value: "science", label: "理科", icon: Microscope, color: "from-green-500 to-emerald-500" },
    { value: "social", label: "社会", icon: Globe, color: "from-purple-500 to-violet-500" },
  ]

  const emotions = [
    { value: "good", emoji: "😊", label: "よくできた", color: "from-green-400 to-emerald-500" },
    { value: "normal", emoji: "😐", label: "普通", color: "from-yellow-400 to-orange-500" },
    { value: "hard", emoji: "😞", label: "難しかった", color: "from-red-400 to-pink-500" },
  ]

  const handleSave = async () => {
    if (!subject || !totalQuestions || !correctAnswers || !emotion) {
      alert("必須項目を入力してください")
      return
    }

    const total = Number.parseInt(totalQuestions)
    const correct = Number.parseInt(correctAnswers)

    if (correct > total) {
      alert("正答数は問題数以下にしてください")
      return
    }

    setIsLoading(true)

    // 保存処理のシミュレーション
    await new Promise((resolve) => setTimeout(resolve, 1500))

    console.log({
      subject,
      totalQuestions: total,
      correctAnswers: correct,
      emotion,
      comment,
      date: new Date().toISOString().split("T")[0],
    })

    setIsLoading(false)
    setShowSuccess(true)

    // 成功メッセージを3秒後に非表示
    setTimeout(() => setShowSuccess(false), 3000)

    // フォームをリセット
    setSubject("")
    setTotalQuestions("")
    setCorrectAnswers("")
    setEmotion("")
    setComment("")
  }

  const selectedSubject = subjects.find((s) => s.value === subject)
  const selectedEmotion = emotions.find((e) => e.value === emotion)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 成功メッセージ */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-500">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">学習記録を保存しました！</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 max-w-md sm:max-w-lg md:max-w-2xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Studyログ
          </h1>
          <p className="text-lg text-gray-600">今日の学習を記録しよう！</p>
        </div>

        {/* 学習記録入力フォーム */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-xl sm:text-2xl text-center font-bold">今日の学習記録</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            {/* 科目選択 */}
            <div className="space-y-3">
              <Label htmlFor="subject" className="text-lg sm:text-xl font-semibold text-gray-700">
                科目
              </Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="h-12 sm:h-14 text-base sm:text-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="科目を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subj) => {
                    const Icon = subj.icon
                    return (
                      <SelectItem key={subj.value} value={subj.value} className="text-base sm:text-lg py-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-r ${subj.color} flex items-center justify-center`}
                          >
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span>{subj.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* 問題数・正答数 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3">
                <Label htmlFor="total" className="text-lg sm:text-xl font-semibold text-gray-700">
                  問題数
                </Label>
                <div className="relative">
                  <Input
                    id="total"
                    type="number"
                    min="1"
                    max="100"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(e.target.value)}
                    className="h-12 sm:h-14 text-lg sm:text-xl text-center border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors pr-12"
                    placeholder="20"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg sm:text-xl font-medium text-gray-500">
                    問
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="correct" className="text-lg sm:text-xl font-semibold text-gray-700">
                  正答数
                </Label>
                <div className="relative">
                  <Input
                    id="correct"
                    type="number"
                    min="0"
                    max={totalQuestions || "100"}
                    value={correctAnswers}
                    onChange={(e) => setCorrectAnswers(e.target.value)}
                    className="h-12 sm:h-14 text-lg sm:text-xl text-center border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors pr-12"
                    placeholder="18"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg sm:text-xl font-medium text-gray-500">
                    問
                  </span>
                </div>
              </div>
            </div>

            {/* 正答率表示 */}
            {totalQuestions && correctAnswers && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                    {Math.round((Number.parseInt(correctAnswers) / Number.parseInt(totalQuestions)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">正答率</div>
                </div>
              </div>
            )}

            {/* 感情評価 */}
            <div className="space-y-4">
              <Label className="text-lg sm:text-xl font-semibold text-gray-700">今日の気持ち</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {emotions.map((emo) => (
                  <Button
                    key={emo.value}
                    variant="outline"
                    className={`h-16 sm:h-20 flex flex-col items-center justify-center space-y-2 text-base sm:text-lg font-medium border-2 transition-all duration-200 ${
                      emotion === emo.value
                        ? `bg-gradient-to-r ${emo.color} text-white border-transparent shadow-lg scale-105`
                        : "hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:scale-102"
                    }`}
                    onClick={() => setEmotion(emo.value)}
                  >
                    <span className="text-2xl sm:text-3xl">{emo.emoji}</span>
                    <span className="text-xs sm:text-sm">{emo.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* コメント入力 */}
            <div className="space-y-3">
              <Label htmlFor="comment" className="text-lg sm:text-xl font-semibold text-gray-700">
                一言コメント（任意）
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={100}
                className="min-h-20 sm:min-h-24 text-base sm:text-lg resize-none border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors"
                placeholder="今日の学習で感じたことを書いてみよう..."
              />
              <div className="text-right text-sm text-gray-500">{comment.length}/100文字</div>
            </div>

            {/* 保存ボタン */}
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full h-14 sm:h-16 text-lg sm:text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>保存中...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="w-5 h-5" />
                  <span>学習記録を保存する</span>
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 励ましメッセージ */}
        <div className="mt-8 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <div className="text-2xl mb-2">🌟</div>
            <p className="text-lg font-medium text-gray-700 mb-2">頑張って学習を続けよう！</p>
            <p className="text-sm text-gray-600">記録を続けることで成長が見えるよ</p>
          </div>
        </div>
      </div>
    </div>
  )
}
