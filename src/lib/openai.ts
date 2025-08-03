import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
});

export interface StudyData {
  subject: string;
  questionsTotal: number;
  questionsCorrect: number;
  emotion: 'good' | 'normal' | 'hard';
  comment?: string;
  date: string;
}

export interface StudyHistory {
  recentRecords: StudyData[];
  totalDays: number;
  continuationDays: number;
  subjectAccuracy: Record<string, { correct: number; total: number }>;
}

export type SenderType = 'parent' | 'teacher';

export interface PersonalizedMessage {
  message: string;
  emoji: string;
  type: 'encouraging' | 'specific_praise' | 'motivational' | 'loving' | 'instructional';
}

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

export async function generatePersonalizedMessages(
  studyData: StudyData,
  studyHistory: StudyHistory,
  senderType: SenderType
): Promise<PersonalizedMessage[]> {
  try {
    const systemPrompt = senderType === 'parent' ? PARENT_SYSTEM_PROMPT : TEACHER_SYSTEM_PROMPT;
    const userPrompt = `学習データ: ${JSON.stringify(studyData, null, 2)}
学習履歴: ${JSON.stringify(studyHistory, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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
      max_tokens: 1000,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return parsed.messages as PersonalizedMessage[];
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        return getDefaultMessages(senderType);
      }
    }
    
    return getDefaultMessages(senderType);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return getDefaultMessages(senderType);
  }
}

function getDefaultMessages(senderType: SenderType): PersonalizedMessage[] {
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