import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
- 直接的すぎる愛情表現は避け、子どもの頑張りや成長を認める日本らしい言い回し

3パターン：
1. 成長・継続を認める系（連続日数や改善点に言及）
2. 具体的成果を褒める系（科目名、正解率、難易度などに言及）
3. 感情・気持ちに寄り添う系（今日の気持ちや学習への取り組み姿勢に言及）

【重要】今回の学習データの科目情報のみを使用し、他の科目の情報は絶対に含めないでください。

【必須】各メッセージは必ず異なる内容にし、学習データの具体的な数値（正解率、問題数など）を含めてください。

必ず以下のJSON形式のみで返答してください（他の文章は一切含めない）：
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

【重要】今回の学習データの科目情報のみを使用し、他の科目の情報は絶対に含めないでください。

【必須】各メッセージは必ず異なる内容にし、学習データの具体的な数値（正解率、問題数など）を含めてください。

必ず以下のJSON形式のみで返答してください（他の文章は一切含めない）：
{
  "messages": [
    {"message": "理科観察問題75%正解、確実に力ついてます📈", "emoji": "📈", "type": "encouraging"},
    {"message": "適性検査3日連続挑戦、継続力が素晴らしい🎯", "emoji": "🎯", "type": "instructional"},
    {"message": "国語読解の精度向上、この調子で行きましょう💪", "emoji": "💪", "type": "motivational"}
  ]
}`;

function getDefaultMessages(senderType, subjectName = '', studyData = null) {
  // 個別データを反映したデフォルトメッセージを生成
  const accuracy = studyData ? Math.round((studyData.questionsCorrect / studyData.questionsTotal) * 100) : 0;
  const correctCount = studyData ? studyData.questionsCorrect : 0;
  const totalCount = studyData ? studyData.questionsTotal : 0;
  
  if (senderType === 'parent') {
    return [
      { message: `${subjectName}${accuracy}%、今日もよく頑張ったね😊`, emoji: "😊", type: "encouraging" },
      { message: `${subjectName}${correctCount}問正解、成長してるね🎯`, emoji: "🎯", type: "specific_praise" },
      { message: `${subjectName}の勉強、パパママも応援してるよ💝`, emoji: "💝", type: "loving" }
    ];
  } else {
    return [
      { message: `${subjectName}${accuracy}%、着実に力がついています📈`, emoji: "📈", type: "encouraging" },
      { message: `${subjectName}${totalCount}問中${correctCount}問正解、素晴らしいです🎯`, emoji: "🎯", type: "instructional" },
      { message: `${subjectName}、この調子で次のステップに進みましょう💪`, emoji: "💪", type: "motivational" }
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
    
    // 科目名マッピング
    const subjectMapping = {
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
${JSON.stringify(studyHistory, null, 2)}

【重要】この${subjectName}の学習記録に関してのみメッセージを作成してください。他の科目の情報は一切使用しないでください。`;

    // GPT-4o-mini: 高性能かつ最もコスト効率の良いモデルを使用
    console.log('🚀 OpenAI APIに送信するプロンプト:', { systemPrompt: systemPrompt.substring(0, 200) + '...', userPrompt });
    
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
      temperature: 0.8  // 多様性を高めるため温度を上げる
    });

    console.log('📦 OpenAI APIからの応答:', response.choices[0]?.message?.content);

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        console.log('✅ JSON解析成功:', parsed);
        return res.status(200).json({ messages: parsed.messages });
      } catch (parseError) {
        console.error('❌ JSON解析失敗:', parseError, 'Raw content:', content);
        return res.status(200).json({ messages: getDefaultMessages(senderType, subjectName, studyData) });
      }
    }
    
    console.log('⚠️ OpenAI応答が空のため、デフォルトメッセージを使用');
    return res.status(200).json({ messages: getDefaultMessages(senderType, subjectName, studyData) });
  } catch (error) {
    console.error('OpenAI API error:', error);
    const subjectMapping = {
      aptitude: '適性',
      japanese: '国語', 
      math: '算数',
      science: '理科',
      social: '社会'
    };
    const fallbackSubject = req.body.studyData?.subject ? 
      (subjectMapping[req.body.studyData.subject] || req.body.studyData.subject) : '';
    return res.status(200).json({ messages: getDefaultMessages(req.body.senderType || 'parent', fallbackSubject, req.body.studyData) });
  }
}