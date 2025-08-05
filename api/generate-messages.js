import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PARENT_SYSTEM_PROMPT = `あなたは愛情深い日本の保護者として、我が子の学習を温かく応援します。
以下の学習結果と履歴を詳しく分析して、具体的で心のこもった応援メッセージを3つ提案してください。

【メッセージの特徴】
- 学習データの具体的な内容（科目、正解率、連続日数、感情など）を必ず盛り込む
- 日本の家庭らしい自然で温かい表現（「〜してくれて嬉しいよ」「〜で成長してるね」など）
- 30文字以内、絵文字1個
- 直接的すぎる愛情表現は避け、子どもの頑張りや成長を認める日本らしい言い回し

3パターン：
1. 成長・継続を認める系（連続日数や改善点に言及）
2. 具体的成果を褒める系（科目名、正解率、難易度などに言及）
3. 感情・気持ちに寄り添う系（今日の気持ちや学習への取り組み姿勢に言及）

【重要】学習履歴の具体的なデータ（科目名、正解率、連続日数、感情状態）を必ずメッセージに含めてください。

各メッセージは以下のJSON形式で返してください：
{
  "messages": [
    {"message": "算数90%正解、3日連続で頑張ってるね😊", "emoji": "😊", "type": "encouraging"},
    {"message": "国語の読解問題、前より解けるようになったね🎯", "emoji": "🎯", "type": "specific_praise"},
    {"message": "今日は難しく感じても最後まで取り組んだね💪", "emoji": "💪", "type": "loving"}
  ]
}`;

const TEACHER_SYSTEM_PROMPT = `あなたは経験豊富な中学受験指導のプロ教師です。
以下の学習結果と履歴を詳しく分析して、教育的効果の高い応援メッセージを3つ提案してください。

【メッセージの特徴】
- 学習データの具体的な内容（科目、正解率、学習傾向、感情変化など）を必ず盛り込む
- 指導者としての専門的視点から成長ポイントを具体的に指摘
- 次への学習戦略や意欲を高める建設的な表現
- 30文字以内、絵文字1個

3パターン：
1. 学習成果・成長を認める系（具体的な改善点、継続効果に言及）
2. 学習方法・取り組み姿勢を評価する系（学習への向き合い方、努力の仕方に言及）
3. 次への目標・動機付け系（今後の学習方針、励ましに言及）

【重要】学習履歴の具体的なデータ（科目名、正解率、連続日数、正答率の変化など）を必ずメッセージに含めてください。

各メッセージは以下のJSON形式で返してください：
{
  "messages": [
    {"message": "算数計算問題80%→90%、着実に力ついてます📈", "emoji": "📈", "type": "encouraging"},
    {"message": "理科3日連続挑戦、継続力が素晴らしいです🎯", "emoji": "🎯", "type": "instructional"},
    {"message": "難しい問題も諦めず、この調子で行きましょう💪", "emoji": "💪", "type": "motivational"}
  ]
}`;

function getDefaultMessages(senderType) {
  if (senderType === 'parent') {
    return [
      { message: "今日もよく頑張ったね！😊", emoji: "😊", type: "encouraging" },
      { message: "コツコツ続ける姿が素晴らしい🎯", emoji: "🎯", type: "specific_praise" },
      { message: "パパママも応援してるよ💝", emoji: "💝", type: "loving" }
    ];
  } else {
    return [
      { message: "着実に力がついています📈", emoji: "📈", type: "encouraging" },
      { message: "この調子で継続しましょう🎯", emoji: "🎯", type: "instructional" },
      { message: "次のステップに進みましょう💪", emoji: "💪", type: "motivational" }
    ];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { studyData, studyHistory, senderType } = req.body;

    if (!studyData || !studyHistory || !senderType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const systemPrompt = senderType === 'parent' ? PARENT_SYSTEM_PROMPT : TEACHER_SYSTEM_PROMPT;
    const userPrompt = `学習データ: ${JSON.stringify(studyData, null, 2)}
学習履歴: ${JSON.stringify(studyHistory, null, 2)}`;

    // GPT-4o-mini: 高性能かつ最もコスト効率の良いモデルを使用
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 800,
      temperature: 0.6
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return res.status(200).json({ messages: parsed.messages });
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        return res.status(200).json({ messages: getDefaultMessages(senderType) });
      }
    }
    
    return res.status(200).json({ messages: getDefaultMessages(senderType) });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(200).json({ messages: getDefaultMessages(req.body.senderType || 'parent') });
  }
}