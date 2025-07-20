"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function StudyRecordPage() {
  const [subject, setSubject] = useState("")
  const [totalQuestions, setTotalQuestions] = useState("")
  const [correctAnswers, setCorrectAnswers] = useState("")
  const [emotion, setEmotion] = useState("")
  const [comment, setComment] = useState("")

  const subjects = [
    { value: "aptitude", label: "適性", color: "bg-purple-100 border-purple-200 text-purple-800", icon: "🧠" },
    { value: "japanese", label: "国語", color: "bg-rose-100 border-rose-200 text-rose-800", icon: "📚" },
    { value: "math", label: "算数", color: "bg-blue-100 border-blue-200 text-blue-800", icon: "🔢" },
    { value: "science", label: "理科", color: "bg-green-100 border-green-200 text-green-800", icon: "🔬" },
    { value: "social", label: "社会", color: "bg-amber-100 border-amber-200 text-amber-800", icon: "🌍" },
  ]

  const emotions = [
    { value: "good", emoji: "😊", label: "よくできた", color: "bg-green-50 border-green-200 hover:bg-green-100" },
    { value: "normal", emoji: "😐", label: "普通", color: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
    { value: "hard", emoji: "😞", label: "難しかった", color: "bg-orange-50 border-orange-200 hover:bg-orange-100" },
  ]

  const handleSave = () => {
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

    // ここでSupabaseに保存する処理を実装
    console.log({
      subject,
      totalQuestions: total,
      correctAnswers: correct,
      emotion,
      comment,
      date: new Date().toISOString().split("T")[0],
    })

    alert("学習記録を保存しました！")

    // フォームをリセット
    setSubject("")
    setTotalQuestions("")
    setCorrectAnswers("")
    setEmotion("")
    setComment("")
  }

  const selectedSubject = subjects.find(s => s.value === subject)
  const selectedEmotion = emotions.find(e => e.value === emotion)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* ヘッダー部分 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              📖 Studyログ
            </h1>
            <p className="text-slate-600 text-lg font-medium">今日もがんばって学習を記録しよう！</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* メインカード */}
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-8">
            <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
              <span className="text-4xl">✏️</span>
              今日の学習記録
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8 lg:p-12 space-y-10">
            {/* 科目選択 */}
            <div className="space-y-4">
              <Label className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                科目を選んでね
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subj) => (
                  <Button
                    key={subj.value}
                    variant="outline"
                    className={`h-20 text-lg font-semibold border-2 transition-all duration-200 ${
                      subject === subj.value 
                        ? `${subj.color} border-current shadow-lg scale-105` 
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                    onClick={() => setSubject(subj.value)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">{subj.icon}</span>
                      <span>{subj.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* 問題数・正答数入力 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 問題数 */}
              <div className="space-y-4">
                <Label className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  問題数
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(e.target.value)}
                    className="h-16 text-2xl text-center font-bold border-2 border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl"
                    placeholder="20"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl font-bold text-slate-500">
                    問
                  </div>
                </div>
              </div>

              {/* 正答数 */}
              <div className="space-y-4">
                <Label className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  正答数
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max={totalQuestions || "100"}
                    value={correctAnswers}
                    onChange={(e) => setCorrectAnswers(e.target.value)}
                    className="h-16 text-2xl text-center font-bold border-2 border-slate-200 focus:border-green-400 focus:ring-4 focus:ring-green-100 rounded-xl"
                    placeholder="18"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl font-bold text-slate-500">
                    問
                  </div>
                </div>
              </div>
            </div>

            {/* 正答率表示 */}
            {totalQuestions && correctAnswers && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                <div className="text-center">
                  <p className="text-lg font-medium text-slate-600 mb-2">正答率</p>
                  <p className="text-4xl font-black text-blue-600">
                    {Math.round((Number.parseInt(correctAnswers) / Number.parseInt(totalQuestions)) * 100)}%
                  </p>
                </div>
              </div>
            )}

            {/* 感情評価 */}
            <div className="space-y-6">
              <Label className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="text-2xl">💭</span>
                今日の気持ちはどう？
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {emotions.map((emo) => (
                  <Button
                    key={emo.value}
                    variant="outline"
                    className={`h-24 flex flex-col items-center justify-center space-y-3 text-lg font-bold border-2 rounded-2xl transition-all duration-200 ${
                      emotion === emo.value 
                        ? `${emo.color.replace('hover:', '')} border-current shadow-lg scale-105` 
                        : `${emo.color} border-slate-200`
                    }`}
                    onClick={() => setEmotion(emo.value)}
                  >
                    <span className="text-4xl">{emo.emoji}</span>
                    <span className="text-slate-700">{emo.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* コメント入力 */}
            <div className="space-y-4">
              <Label className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="text-2xl">💬</span>
                一言コメント（自由に書いてね）
              </Label>
              <div className="relative">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={300}
                  className="min-h-32 text-lg resize-none border-2 border-slate-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 rounded-xl p-4"
                  placeholder="今日の学習でどんなことを感じたかな？ 難しかったところ、楽しかったところ、新しく覚えたことなど、なんでも書いてみよう！"
                />
                <div className="absolute bottom-3 right-3 text-sm font-medium text-slate-400 bg-white px-2 py-1 rounded-lg">
                  {comment.length}/300文字
                </div>
              </div>
            </div>

            {/* 保存ボタン */}
            <div className="pt-4">
              <Button
                onClick={handleSave}
                className="w-full h-20 text-2xl font-black bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                <span className="flex items-center justify-center gap-3">
                  <span className="text-3xl">🎉</span>
                  学習記録を保存する
                  <span className="text-3xl">🎉</span>
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 励ましメッセージ */}
        <div className="mt-12 text-center bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50">
          <div className="flex justify-center mb-4">
            <span className="text-6xl">🌟</span>
          </div>
          <p className="text-xl font-bold text-slate-700 mb-2">毎日コツコツ続けることが大切だよ！</p>
          <p className="text-lg text-slate-600">記録を続けることで、きっと成長が見えてくるから頑張ろう</p>
        </div>
      </div>
    </div>
  )
}
