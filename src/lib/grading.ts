import { Question, TopicScore } from '@/types/database';

export interface GradingResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  topicScores: Record<string, TopicScore>;
  details: {
    questionId: string;
    isCorrect: boolean;
    marksAwarded: number;
    maxMarks: number;
    studentAnswer: any;
    correctAnswers: any;
  }[];
}

export function evaluateAssessment(
  questions: Question[],
  answers: Record<string, any>
): GradingResult {
  let totalScore = 0;
  let maxScore = 0;
  const topicMap: Record<string, { scored: number; total: number }> = {};
  const details = [];

  for (const q of questions) {
    const qMarks = Number(q.marks) || 1;
    const qNeg = Number(q.negative_marks) || 0;
    maxScore += qMarks;

    const topic = q.topic || 'General';
    if (!topicMap[topic]) {
      topicMap[topic] = { scored: 0, total: 0 };
    }
    topicMap[topic].total += qMarks;

    const studentAns = answers[q.id];
    let isCorrect = false;
    let awarded = 0;

    if (q.question_type === 'single_choice') {
      const correctIndex = Number(q.correct_answers?.[0]);
      if (studentAns !== undefined && studentAns !== null && Number(studentAns) === correctIndex) {
        isCorrect = true;
        awarded = qMarks;
      } else if (studentAns !== undefined && studentAns !== null && studentAns !== '' && qNeg > 0) {
        awarded = -qNeg;
      }
    } else if (q.question_type === 'multiple_choice') {
      const studentArr = Array.isArray(studentAns) ? studentAns.map(Number).sort((a, b) => a - b) : [];
      const correctArr = Array.isArray(q.correct_answers) ? q.correct_answers.map(Number).sort((a, b) => a - b) : [];

      if (
        studentArr.length === correctArr.length &&
        studentArr.every((val, idx) => val === correctArr[idx])
      ) {
        isCorrect = true;
        awarded = qMarks;
      } else if (studentArr.length > 0 && qNeg > 0) {
        awarded = -qNeg;
      }
    } else if (q.question_type === 'text_input') {
      const cleanStudent = String(studentAns || '').trim().toLowerCase();
      const acceptedAnswers = (q.correct_answers || [])
        .map((ans) => String(ans).trim().toLowerCase())
        .filter(Boolean);

      if (cleanStudent.length > 0 && acceptedAnswers.length > 0) {
        // 1. Direct exact match (e.g. student typed exact keyword or phrase)
        const exactMatch = acceptedAnswers.some((ans) => cleanStudent === ans);

        // 2. Phrase containment: student sentence contains any of the accepted key phrases
        const containsAnyKey = acceptedAnswers.some(
          (ans) => ans.length > 1 && cleanStudent.includes(ans)
        );

        // 3. Multi-keyword match: if all keywords are present anywhere in the student response
        const allKeywordsPresent =
          acceptedAnswers.length > 1 &&
          acceptedAnswers.every((ans) => cleanStudent.includes(ans));

        if (exactMatch || containsAnyKey || allKeywordsPresent) {
          isCorrect = true;
          awarded = qMarks;
        } else if (qNeg > 0) {
          awarded = -qNeg;
        }
      }
    }

    totalScore += awarded;
    topicMap[topic].scored += awarded;

    details.push({
      questionId: q.id,
      isCorrect,
      marksAwarded: awarded,
      maxMarks: qMarks,
      studentAnswer: studentAns,
      correctAnswers: q.correct_answers,
    });
  }

  // Cap negative total scores to 0 if needed or keep actual
  const finalScore = Math.max(0, Math.round(totalScore * 100) / 100);
  const percentage = maxScore > 0 ? Math.round((finalScore / maxScore) * 1000) / 10 : 0;

  const topicScores: Record<string, TopicScore> = {};
  for (const [top, val] of Object.entries(topicMap)) {
    const scoredCap = Math.max(0, Math.round(val.scored * 100) / 100);
    const pct = val.total > 0 ? Math.round((scoredCap / val.total) * 1000) / 10 : 0;
    topicScores[top] = {
      scored: scoredCap,
      total: val.total,
      percentage: pct,
    };
  }

  return {
    totalScore: finalScore,
    maxScore,
    percentage,
    topicScores,
    details,
  };
}
