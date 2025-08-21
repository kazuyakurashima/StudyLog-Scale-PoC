import OpenAI from 'openai'

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
  source?: 'ai' | 'fallback'; // メッセージの生成元を識別
}

export async function generatePersonalizedMessages(
  studyData: StudyData,
  studyHistory: StudyHistory,
  senderType: SenderType
): Promise<PersonalizedMessage[]> {
  const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`🚀 [${requestId}] 個別最適化メッセージ生成開始:`, { 
      subject: studyData.subject, 
      senderType, 
      studyData: {
        subject: studyData.subject,
        questionsTotal: studyData.questionsTotal,
        questionsCorrect: studyData.questionsCorrect,
        accuracy: Math.round((studyData.questionsCorrect / studyData.questionsTotal) * 100),
        emotion: studyData.emotion,
        date: studyData.date
      },
      studyHistory: {
        continuationDays: studyHistory.continuationDays,
        totalDays: studyHistory.totalDays,
        recentRecordsCount: studyHistory.recentRecords.length
      }
    });
    
    // 開発環境の場合は直接OpenAI APIを呼び出し
    if (import.meta.env.DEV) {
      console.log(`🔧 [${requestId}] 開発環境: 直接OpenAI API呼び出し`);
      const messages = await generateMessagesDirectly(studyData, studyHistory, senderType, requestId);
      return messages.map(msg => ({ ...msg, source: 'ai' as const }));
    }
    
    // 本番環境の場合はAPI route経由
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト
    
    const response = await fetch('/api/generate-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studyData,
        studyHistory,
        senderType
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`❌ [${requestId}] API応答エラー:`, response.status, response.statusText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ [${requestId}] 個別最適化メッセージ取得成功:`, data.messages?.length, 'messages', data.messages);
    // AI生成メッセージであることを示すフラグを追加
    const messagesWithSource = (data.messages as PersonalizedMessage[]).map(msg => ({
      ...msg,
      source: 'ai' as const
    }));
    return messagesWithSource;
  } catch (error) {
    console.error(`❌ [${requestId}] 個別最適化メッセージ生成失敗:`, error);
    console.log(`🔄 [${requestId}] 個別データ反映フォールバックメッセージを使用`);
    // より良いフォールバック: 学習データを反映したメッセージを生成
    const fallbackMessages = getPersonalizedFallbackMessages(studyData, studyHistory, senderType);
    // フォールバックメッセージであることを示すフラグを追加
    const messagesWithSource = fallbackMessages.map(msg => ({
      ...msg,
      source: 'fallback' as const
    }));
    return messagesWithSource;
  }
}

async function generateMessagesDirectly(
  studyData: StudyData,
  studyHistory: StudyHistory,
  senderType: SenderType,
  requestId: string
): Promise<PersonalizedMessage[]> {
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // 開発環境でのみ使用
  });

  const PARENT_SYSTEM_PROMPT = `あなたは愛情深い日本の保護者として、我が子の学習を温かく応援します。
以下の学習結果と履歴を詳しく分析して、具体的で心のこもった応援メッセージを3つ提案してください。

【絶対に守るべきルール】
1. 科目名は必ず学習データと完全に一致させる：
   - aptitude → 適性
   - japanese → 国語
   - math → 算数
   - science → 理科
   - social → 社会
2. 他の科目の情報を絶対に混在させない
3. 学習データにない情報は一切使わない

【メッセージの特徴】
- 学習データの具体的な内容（科目、正解率、連続日数、感情など）を必ず盛り込む
- 日本の家庭らしい自然で温かい表現（「〜してくれて嬉しいよ」「〜で成長してるね」など）
- 30文字以内、絵文字1個

3パターン：
1. 成長・継続を認める系（連続日数や改善点に言及）
2. 具体的成果を褒める系（科目名、正解率、難易度などに言及）
3. 感情・気持ちに寄り添う系（今日の気持ちや学習への取り組み姿勢に言及）

必ず以下のJSON形式のみで返答してください：
{
  "messages": [
    {"message": "理科実験問題8割正解、よく頑張ったね😊", "emoji": "😊", "type": "encouraging"},
    {"message": "社会の地理、前回より理解が深まってる🎯", "emoji": "🎯", "type": "specific_praise"},
    {"message": "適性検査難しくても諦めず取り組んだね💪", "emoji": "💪", "type": "loving"}
  ]
}`;

  const TEACHER_SYSTEM_PROMPT = `あなたは経験豊富な中学受験指導のプロ教師です。
以下の学習結果と履歴を詳しく分析して、教育的効果の高い応援メッセージを3つ提案してください。

【絶対に守るべきルール】
1. 科目名は必ず学習データと完全に一致させる：
   - aptitude → 適性
   - japanese → 国語
   - math → 算数
   - science → 理科
   - social → 社会
2. 他の科目の情報を絶対に混在させない
3. 学習データにない情報は一切使わない

【メッセージの特徴】
- 学習データの具体的な内容（科目、正解率、学習傾向、感情変化など）を必ず盛り込む
- 指導者としての専門的視点から成長ポイントを具体的に指摘
- 次への学習戦略や意欲を高める建設的な表現
- 30文字以内、絵文字1個

3パターン：
1. 学習成果・成長を認める系（具体的な改善点、継続効果に言及）
2. 学習方法・取り組み姿勢を評価する系（学習への向き合い方、努力の仕方に言及）
3. 次への目標・動機付け系（今後の学習方針、励ましに言及）

必ず以下のJSON形式のみで返答してください：
{
  "messages": [
    {"message": "理科観察問題75%正解、確実に力ついてます📈", "emoji": "📈", "type": "encouraging"},
    {"message": "適性検査3日連続挑戦、継続力が素晴らしい🎯", "emoji": "🎯", "type": "instructional"},
    {"message": "国語読解の精度向上、この調子で行きましょう💪", "emoji": "💪", "type": "motivational"}
  ]
}`;

  const systemPrompt = senderType === 'parent' ? PARENT_SYSTEM_PROMPT : TEACHER_SYSTEM_PROMPT;
  
  // 科目名マッピング
  const subjectMapping: Record<string, string> = {
    aptitude: '適性',
    japanese: '国語', 
    math: '算数',
    science: '理科',
    social: '社会'
  };
  
  const subjectName = subjectMapping[studyData.subject] || studyData.subject;
  
  const userPrompt = `【今回の学習記録】
科目: ${subjectName} (${studyData.subject})
正解数: ${studyData.questionsCorrect}/${studyData.questionsTotal}問
正解率: ${Math.round((studyData.questionsCorrect / studyData.questionsTotal) * 100)}%
感情: ${studyData.emotion}
コメント: ${studyData.comment || 'なし'}
学習日: ${studyData.date}

【学習履歴】
継続日数: ${studyHistory.continuationDays}日
総学習日数: ${studyHistory.totalDays}日
最近の記録数: ${studyHistory.recentRecords.length}件

【重要】この${subjectName}の学習記録に関してのみメッセージを作成してください。他の科目の情報は一切使用しないでください。`;

  console.log(`🚀 [${requestId}] OpenAI API直接呼び出し開始`);
  
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
    temperature: 0.8
  });

  console.log(`📦 [${requestId}] OpenAI APIからの応答:`, response.choices[0]?.message?.content);

  const content = response.choices[0]?.message?.content;
  if (content) {
    try {
      const parsed = JSON.parse(content);
      console.log(`✅ [${requestId}] JSON解析成功:`, parsed);
      return parsed.messages;
    } catch (parseError) {
      console.error(`❌ [${requestId}] JSON解析失敗:`, parseError);
      throw new Error('JSON parsing failed');
    }
  }
  
  throw new Error('Empty response from OpenAI');
}

function getPersonalizedFallbackMessages(
  studyData: StudyData,
  studyHistory: StudyHistory,
  senderType: SenderType
): PersonalizedMessage[] {
  // 科目名マッピング
  const subjectMapping: Record<string, string> = {
    aptitude: '適性',
    japanese: '国語', 
    math: '算数',
    science: '理科',
    social: '社会'
  };
  
  const subjectName = subjectMapping[studyData.subject] || studyData.subject;
  const accuracy = Math.round((studyData.questionsCorrect / studyData.questionsTotal) * 100);
  const correctCount = studyData.questionsCorrect;
  const totalCount = studyData.questionsTotal;
  const continuationDays = studyHistory.continuationDays;
  
  // バリエーション用のランダムシード（学習データ固有だが一意性を保つ）
  const uniqueSeed = `${studyData.subject}_${studyData.date}_${studyData.questionsCorrect}_${studyData.questionsTotal}_${studyData.emotion}_${Date.now()}`;
  const randomIndex = Math.abs(uniqueSeed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 100;
  
  if (senderType === 'parent') {
    // 保護者向けメッセージのバリエーション
    const encouragingMessages = [
      `${subjectName}${accuracy}%、今日もよく頑張ったね😊`,
      `${subjectName}${accuracy}%達成、素晴らしい努力だね😊`,
      `${subjectName}で${accuracy}%、本当によく頑張ってる😊`,
      `${subjectName}${accuracy}%、継続する力が立派だね😊`
    ];
    
    const specificMessages = [
      `${subjectName}${totalCount}問中${correctCount}問正解、成長してるね🎯`,
      `${subjectName}で${correctCount}/${totalCount}問正解、力がついてる🎯`,
      `${subjectName}${correctCount}問正解、確実に上達してるね🎯`,
      `${subjectName}の${correctCount}問正解、頑張りが実ってる🎯`
    ];
    
    const lovingMessages = [
      `${continuationDays}日継続中、パパママも応援してるよ💝`,
      `${continuationDays}日も続けて、本当に頑張り屋さんだね💝`,
      `${continuationDays}日継続、その努力を誇らしく思うよ💝`,
      `${continuationDays}日間コツコツと、素晴らしい姿勢だね💝`
    ];
    
    return [
      { 
        message: encouragingMessages[randomIndex % encouragingMessages.length], 
        emoji: "😊", 
        type: "encouraging" 
      },
      { 
        message: specificMessages[(randomIndex + 1) % specificMessages.length], 
        emoji: "🎯", 
        type: "specific_praise" 
      },
      { 
        message: lovingMessages[(randomIndex + 2) % lovingMessages.length], 
        emoji: "💝", 
        type: "loving" 
      }
    ];
  } else {
    // 指導者向けメッセージのバリエーション
    const encouragingMessages = [
      `${subjectName}${accuracy}%、着実に力がついています📈`,
      `${subjectName}で${accuracy}%達成、順調な成長です📈`,
      `${subjectName}${accuracy}%、確実にレベルアップしています📈`,
      `${subjectName}の${accuracy}%、基礎力が定着してきました📈`
    ];
    
    const instructionalMessages = [
      `${subjectName}${totalCount}問中${correctCount}問正解、素晴らしいです🎯`,
      `${subjectName}で${correctCount}/${totalCount}問正解、理解が深まっています🎯`,
      `${subjectName}${correctCount}問正解、学習効果が表れています🎯`,
      `${subjectName}の${correctCount}問正解、着実な進歩です🎯`
    ];
    
    const motivationalMessages = [
      `${continuationDays}日継続、この調子で次のステップへ💪`,
      `${continuationDays}日間の継続、継続力が素晴らしいです💪`,
      `${continuationDays}日続けて、学習習慣が定着していますね💪`,
      `${continuationDays}日継続中、この momentum を大切に💪`
    ];
    
    return [
      { 
        message: encouragingMessages[randomIndex % encouragingMessages.length], 
        emoji: "📈", 
        type: "encouraging" 
      },
      { 
        message: instructionalMessages[(randomIndex + 1) % instructionalMessages.length], 
        emoji: "🎯", 
        type: "instructional" 
      },
      { 
        message: motivationalMessages[(randomIndex + 2) % motivationalMessages.length], 
        emoji: "💪", 
        type: "motivational" 
      }
    ];
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