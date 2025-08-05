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
      console.error(`❌ [${requestId}] API応答エラー:`, response.status, response.statusText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ [${requestId}] 個別最適化メッセージ取得成功:`, data.messages?.length, 'messages', data.messages);
    return data.messages as PersonalizedMessage[];
  } catch (error) {
    console.error(`❌ [${requestId}] 個別最適化メッセージ生成失敗:`, error);
    console.log(`🔄 [${requestId}] 個別データ反映フォールバックメッセージを使用`);
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