import { Question, TopicScore, QuestionReviewItem } from '@/types/database';

export interface GradingResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  topicScores: Record<string, TopicScore>;
  review: QuestionReviewItem[];
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
  const review: QuestionReviewItem[] = [];
  const details = [];

  for (let idx = 0; idx < questions.length; idx++) {
    const q = questions[idx];
    const qMarks = Number(q.marks) || 1;
    const qNeg = Number(q.negative_marks) || 0;
    maxScore += qMarks;

    const topic = q.topic || 'General';
    if (!topicMap[topic]) {
      topicMap[topic] = { scored: 0, total: 0 };
    }
    topicMap[topic].total += qMarks;

    const studentAns = answers ? answers[q.id] : undefined;
    let isCorrect = false;
    let isSkipped = false;
    let awarded = 0;

    if (q.question_type === 'single_choice') {
      const correctIndex = Number(q.correct_answers?.[0]);
      const hasAnswered =
        studentAns !== undefined && studentAns !== null && studentAns !== '';

      if (!hasAnswered) {
        isSkipped = true;
        awarded = 0;
      } else if (Number(studentAns) === correctIndex) {
        isCorrect = true;
        awarded = qMarks;
      } else if (qNeg > 0) {
        awarded = -qNeg;
      }
    } else if (q.question_type === 'multiple_choice') {
      const studentArr = Array.isArray(studentAns)
        ? studentAns.map(Number).sort((a, b) => a - b)
        : [];
      const correctArr = Array.isArray(q.correct_answers)
        ? q.correct_answers.map(Number).sort((a, b) => a - b)
        : [];

      if (studentArr.length === 0) {
        isSkipped = true;
        awarded = 0;
      } else if (
        studentArr.length === correctArr.length &&
        studentArr.every((val, i) => val === correctArr[i])
      ) {
        isCorrect = true;
        awarded = qMarks;
      } else if (qNeg > 0) {
        awarded = -qNeg;
      }
    } else if (q.question_type === 'text_input') {
      const cleanStudent = String(studentAns || '').trim().toLowerCase();
      const acceptedAnswers = (q.correct_answers || [])
        .map((ans) => String(ans).trim().toLowerCase())
        .filter(Boolean);

      if (cleanStudent.length === 0) {
        isSkipped = true;
        awarded = 0;
      } else if (acceptedAnswers.length > 0) {
        // 1. Direct exact match
        const exactMatch = acceptedAnswers.some((ans) => cleanStudent === ans);

        // 2. Phrase containment
        const containsAnyKey = acceptedAnswers.some(
          (ans) => ans.length > 1 && cleanStudent.includes(ans)
        );

        // 3. Multi-keyword match
        const allKeywordsPresent =
          acceptedAnswers.length > 1 &&
          acceptedAnswers.every((ans) => cleanStudent.includes(ans));

        if (exactMatch || containsAnyKey || allKeywordsPresent) {
          isCorrect = true;
          awarded = qMarks;
        } else if (qNeg > 0) {
          awarded = -qNeg;
        }
      } else {
        // No answer key provided for text_input
        isSkipped = false;
        awarded = 0;
      }
    }

    totalScore += awarded;
    topicMap[topic].scored += awarded;

    // Backward compatible detail item
    details.push({
      questionId: q.id,
      isCorrect,
      marksAwarded: awarded,
      maxMarks: qMarks,
      studentAnswer: studentAns,
      correctAnswers: q.correct_answers,
    });

    // Enriched review item for UI breakdown
    review.push({
      questionId: q.id,
      orderIndex: q.order_index ?? idx + 1,
      questionText: q.question_text,
      questionType: q.question_type,
      topic: q.topic || 'General',
      options: Array.isArray(q.options) ? q.options : [],
      studentAnswer: studentAns,
      correctAnswers: Array.isArray(q.correct_answers) ? q.correct_answers : [],
      isCorrect,
      isSkipped,
      marksAwarded: awarded,
      maxMarks: qMarks,
      negativeMarks: qNeg,
      explanation: q.explanation || '',
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
    review,
    details,
  };
}
