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
    { value: "japanese", label: "国語" },
    { value: "math", label: "算数" },
    { value: "science", label: "理科" },
    { value: "social", label: "社会" },
  ]

  const emotions = [
    { value: "good", emoji: "😊", label: "よくできた" },
    { value: "normal", emoji: "😐", label: "普通" },
    { value: "hard", emoji: "😞", label: "難しかった" },
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Studyログ</h1>
          <p className="text-lg text-gray-600">今日の学習を記録しよう！</p>
        </div>

        {/* 学習記録入力フォーム */}
        <Card className="shadow-lg">
          <CardHeader className="bg-blue-500 text-white rounded-t-lg">
            <CardTitle className="text-2xl text-center">今日の学習記録</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* 科目選択 */}
            <div className="space-y-3">
              <Label htmlFor="subject" className="text-xl font-medium">
                科目
              </Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="h-14 text-lg">
                  <SelectValue placeholder="科目を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subj) => (
                    <SelectItem key={subj.value} value={subj.value} className="text-lg py-3">
                      {subj.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 問題数入力 */}
            <div className="space-y-3">
              <Label htmlFor="total" className="text-xl font-medium">
                問題数
              </Label>
              <div className="flex items-center space-x-3">
                <Input
                  id="total"
                  type="number"
                  min="1"
                  max="100"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(e.target.value)}
                  className="h-14 text-lg text-center"
                  placeholder="20"
                />
                <span className="text-xl font-medium">問</span>
              </div>
            </div>

            {/* 正答数入力 */}
            <div className="space-y-3">
              <Label htmlFor="correct" className="text-xl font-medium">
                正答数
              </Label>
              <div className="flex items-center space-x-3">
                <Input
                  id="correct"
                  type="number"
                  min="0"
                  max={totalQuestions || "100"}
                  value={correctAnswers}
                  onChange={(e) => setCorrectAnswers(e.target.value)}
                  className="h-14 text-lg text-center"
                  placeholder="18"
                />
                <span className="text-xl font-medium">問</span>
              </div>
            </div>

            {/* 感情評価 */}
            <div className="space-y-4">
              <Label className="text-xl font-medium">今日の気持ち</Label>
              <div className="grid grid-cols-3 gap-4">
                {emotions.map((emo) => (
                  <Button
                    key={emo.value}
                    variant={emotion === emo.value ? "default" : "outline"}
                    className={`h-20 flex flex-col items-center justify-center space-y-2 text-lg font-medium ${
                      emotion === emo.value ? "bg-blue-500 text-white" : "hover:bg-blue-50"
                    }`}
                    onClick={() => setEmotion(emo.value)}
                  >
                    <span className="text-3xl">{emo.emoji}</span>
                    <span>{emo.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* コメント入力 */}
            <div className="space-y-3">
              <Label htmlFor="comment" className="text-xl font-medium">
                一言コメント（任意）
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={100}
                className="min-h-24 text-lg resize-none"
                placeholder="今日の学習で感じたことを書いてみよう..."
              />
              <div className="text-right text-sm text-gray-500">{comment.length}/100文字</div>
            </div>

            {/* 保存ボタン */}
            <Button
              onClick={handleSave}
              className="w-full h-16 text-xl font-bold bg-green-500 hover:bg-green-600 text-white"
            >
              学習記録を保存する
            </Button>
          </CardContent>
        </Card>

        {/* 今日の記録表示エリア（保存後に表示される予定） */}
        <div className="mt-8 text-center text-gray-500">
          <p className="text-lg">頑張って学習を続けよう！</p>
          <p className="text-sm mt-2">記録を続けることで成長が見えるよ</p>
        </div>
      </div>
    </div>
  )
}
