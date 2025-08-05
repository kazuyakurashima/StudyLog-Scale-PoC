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
    // Use API route instead of direct OpenAI SDK call
    const response = await fetch('/api/generate-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studyData,
        studyHistory,
        senderType
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.messages as PersonalizedMessage[];
  } catch (error) {
    console.error('API request error:', error);
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