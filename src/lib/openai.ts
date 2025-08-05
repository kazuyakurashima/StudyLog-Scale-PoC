// OpenAI SDK removed - using API route instead

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

export async function generatePersonalizedMessages(
  studyData: StudyData,
  studyHistory: StudyHistory,
  senderType: SenderType
): Promise<PersonalizedMessage[]> {
  try {
    console.log('🚀 個別最適化メッセージ生成開始:', { subject: studyData.subject, senderType });
    
    // Use API route instead of direct OpenAI SDK call with timeout
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
      console.error('❌ API応答エラー:', response.status, response.statusText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ 個別最適化メッセージ取得成功:', data.messages?.length, 'messages');
    return data.messages as PersonalizedMessage[];
  } catch (error) {
    console.error('❌ 個別最適化メッセージ生成失敗:', error);
    console.log('🔄 個別データ反映フォールバックメッセージを使用');
    // より良いフォールバック: 学習データを反映したメッセージを生成
    return getPersonalizedFallbackMessages(studyData, studyHistory, senderType);
  }
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
  
  if (senderType === 'parent') {
    return [
      { 
        message: `${subjectName}${accuracy}%、今日もよく頑張ったね😊`, 
        emoji: "😊", 
        type: "encouraging" 
      },
      { 
        message: `${subjectName}${totalCount}問中${correctCount}問正解、成長してるね🎯`, 
        emoji: "🎯", 
        type: "specific_praise" 
      },
      { 
        message: `${continuationDays}日継続中、パパママも応援してるよ💝`, 
        emoji: "💝", 
        type: "loving" 
      }
    ];
  } else {
    return [
      { 
        message: `${subjectName}${accuracy}%、着実に力がついています📈`, 
        emoji: "📈", 
        type: "encouraging" 
      },
      { 
        message: `${subjectName}${totalCount}問中${correctCount}問正解、素晴らしいです🎯`, 
        emoji: "🎯", 
        type: "instructional" 
      },
      { 
        message: `${continuationDays}日継続、この調子で次のステップへ💪`, 
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