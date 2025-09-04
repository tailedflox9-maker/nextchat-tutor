import React, { useState, useMemo } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { StudySession, StudyQuestion } from '../types';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: StudySession | null;
}

export function QuizModal({ isOpen, onClose, session }: QuizModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = session?.questions[currentQuestionIndex];
  const isCorrect = currentQuestion && selectedAnswer === currentQuestion.answer;

  const handleAnswerSelect = (option: string) => {
    if (showFeedback) return;
    setSelectedAnswer(option);
    setUserAnswers(prev => ({ ...prev, [currentQuestion!.id]: option }));
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < session!.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const score = useMemo(() => {
    if (!session) return 0;
    return session.questions.reduce((acc, question) => {
      if (userAnswers[question.id] === question.answer) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [quizCompleted, session, userAnswers]);

  const handleClose = () => {
    // Reset state on close
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserAnswers({});
    setShowFeedback(false);
    setQuizCompleted(false);
    onClose();
  };

  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-2xl bg-[var(--color-sidebar)] border border-[var(--color-border)] rounded-lg shadow-2xl flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-[var(--color-border)]">
          <h2 className="text-xl font-bold">Quiz Time!</h2>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-card)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[24rem]">
          {!quizCompleted && currentQuestion ? (
            <div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">Question {currentQuestionIndex + 1} of {session.questions.length}</p>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">{currentQuestion.question}</h3>
              <div className="space-y-3">
                {currentQuestion.options?.map(option => (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showFeedback}
                    className={`w-full text-left p-4 border rounded-lg transition-all duration-200 text-base ${
                      showFeedback && option === currentQuestion.answer ? 'bg-green-500/20 border-green-500 text-white' :
                      showFeedback && option === selectedAnswer && !isCorrect ? 'bg-red-500/20 border-red-500 text-white' :
                      'border-[var(--color-border)] hover:bg-[var(--color-card)] disabled:cursor-not-allowed'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {showFeedback && (
                <div className="mt-6 p-4 rounded-lg bg-[var(--color-card)] animate-fade-in-up">
                  {isCorrect ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Correct!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400">
                      <XCircle className="w-5 h-5" />
                      <span className="font-semibold">Incorrect.</span>
                    </div>
                  )}
                  {currentQuestion.explanation && (
                     <p className="text-sm text-[var(--color-text-secondary)] mt-2">{currentQuestion.explanation}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center flex flex-col items-center justify-center h-full">
              <h3 className="text-3xl font-bold mb-4">Quiz Completed!</h3>
              <p className="text-lg text-[var(--color-text-secondary)] mb-6">You scored:</p>
              <p className="text-6xl font-bold text-blue-400 mb-8">{score} / {session.questions.length}</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
          {showFeedback && !quizCompleted ? (
            <button onClick={handleNextQuestion} className="px-6 py-2 bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] rounded-lg hover:bg-[var(--color-accent-bg-hover)] transition-colors font-semibold">
              Next
            </button>
          ) : quizCompleted ? (
            <button onClick={handleClose} className="px-6 py-2 bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] rounded-lg hover:bg-[var(--color-accent-bg-hover)] transition-colors font-semibold">
              Finish
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
