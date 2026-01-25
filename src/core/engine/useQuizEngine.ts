import { useState, useEffect, useCallback } from 'react';
import type { Question, QuizState } from '../types';

interface EngineProps<T> {
  questions: Question<T>[];
  initialCorrect?: Question<T>[];
  scoreCalculator: (item: T) => number;
}

export function useQuizEngine<T>({ questions, initialCorrect = [], scoreCalculator }: EngineProps<T>) {
  const [state, setState] = useState<QuizState<T>>({
    status: 'IDLE',
    queue: [],
    currentQuestion: null,
    lastWrong: null,
    history: { correct: [], wrong: [] },
    feedback: null,
    score: 0,
    stats: { total: 0, remaining: 0, correctCount: 0, wrongCount: 0 }
  });

  // Initialization
  useEffect(() => {
    if (questions.length === 0) {
      setState(s => ({ ...s, status: 'FINISHED' }));
      return;
    }

    const startScore = initialCorrect.reduce((acc, q) => acc + scoreCalculator(q.payload), 0);

    setState({
      status: 'PLAYING',
      queue: questions,
      currentQuestion: questions[0],
      lastWrong: null,
      history: { correct: initialCorrect, wrong: [] },
      feedback: null,
      score: startScore,
      stats: {
        total: questions.length + initialCorrect.length,
        remaining: questions.length,
        correctCount: 0,
        wrongCount: 0
      }
    });
  }, [questions, initialCorrect, scoreCalculator]);

  const advance = useCallback((result: 'CORRECT' | 'WRONG' | 'DONT_KNOW') => {
    setState(prev => {
      const { currentQuestion, queue, history, score } = prev;
      if (!currentQuestion) return prev;

      const nextQueue = queue.slice(1);
      const isFinished = nextQueue.length === 0;

      let newScore = score;
      const newHistory = { ...history };
      let lastWrong = null;

      if (result === 'CORRECT') {
        newHistory.correct = [...history.correct, currentQuestion];
        newScore += scoreCalculator(currentQuestion.payload);
      } else {
        newHistory.wrong = [...history.wrong, currentQuestion];
        lastWrong = currentQuestion;
      }

      return {
        ...prev,
        status: isFinished ? 'FINISHED' : 'PLAYING',
        queue: nextQueue,
        currentQuestion: isFinished ? null : nextQueue[0],
        lastWrong: lastWrong,
        history: newHistory,
        feedback: result === 'CORRECT' || result === 'WRONG' ? result : null,
        score: newScore,
        stats: {
          total: prev.stats.total,
          remaining: nextQueue.length,
          correctCount: newHistory.correct.length,
          wrongCount: newHistory.wrong.length
        }
      };
    });

    // Clear feedback
    if (result !== 'DONT_KNOW') {
      setTimeout(() => {
        setState(s => ({ ...s, feedback: null }));
      }, 500);
    }
  }, [scoreCalculator]);

  const submitAnswer = useCallback((isCorrect: boolean) => {
    advance(isCorrect ? 'CORRECT' : 'WRONG');
  }, [advance]);

  const skip = useCallback(() => {
    setState(prev => {
      if (!prev.currentQuestion) return prev;
      const [head, ...tail] = prev.queue;
      // Move current to back of queue
      return {
        ...prev,
        queue: [...tail, head],
        currentQuestion: tail[0] || head
      };
    });
  }, []);

  const giveUp = useCallback(() => {
    advance('DONT_KNOW');
  }, [advance]);

  return {
    state,
    actions: { submitAnswer, skip, giveUp }
  };
}
