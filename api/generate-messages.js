import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PARENT_SYSTEM_PROMPT = `あなたは愛情深い保護者として、我が子の学習を温かく応援します。
以下の学習結果を見て、心のこもった応援メッセージを3つ提案してください。

【メッセージの特徴】
- 家庭での頑張りを認める温かい表現
- 愛情あふれる親の視点
- 30文字以内、絵文字1-2個
- 子どもが嬉しくなる言葉選び

3パターン：
1. 優しく励まし系
2. 具体的に褒める系
3. 愛情表現系

各メッセージは以下のJSON形式で返してください：
{
  "messages": [
    {"message": "メッセージ内容", "emoji": "😊", "type": "encouraging"},
    {"message": "メッセージ内容", "emoji": "🎯", "type": "specific_praise"},
    {"message": "メッセージ内容", "emoji": "💝", "type": "loving"}
  ]
}`;

const TEACHER_SYSTEM_PROMPT = `あなたは経験豊富な中学受験指導のプロ教師です。
以下の学習結果を踏まえ、教育的効果の高い応援メッセージを3つ提案してください。

【メッセージの特徴】
- 学習指導の専門的視点
- 具体的な成長ポイントの指摘
- 次への学習意欲を高める表現
- 30文字以内、適度な専門性

3パターン：
1. 成長を認める系
2. 具体的指導系
3. 次への動機付け系

各メッセージは以下のJSON形式で返してください：
{
  "messages": [
    {"message": "メッセージ内容", "emoji": "📈", "type": "encouraging"},
    {"message": "メッセージ内容", "emoji": "🎯", "type": "instructional"},
    {"message": "メッセージ内容", "emoji": "💪", "type": "motivational"}
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