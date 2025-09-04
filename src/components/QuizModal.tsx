import React, { useState, useMemo, useEffect } from 'react';
import { X, Check, XCircle, CheckCircle } from 'lucide-react';
import { StudySession } from '../types';

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

  // Reset state when a new session is passed or the modal is closed
  useEffect(() => {
    if (isOpen) {
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setUserAnswers({});
      setShowFeedback(false);
      setQuizCompleted(false);
    }
  }, [isOpen, session]);

  const handleAnswerSelect = (option: string) => {
    if (showFeedback) return;
    setSelectedAnswer(option);
    setUserAnswers(prev => ({ ...prev, [currentQuestion!.id]: option }));
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (session && currentQuestionIndex < session.questions.length - 1) {
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
      return userAnswers[question.id] === question.answer ? acc + 1 : acc;
    }, 0);
  }, [quizCompleted, session, userAnswers]);
  
  const scorePercentage = useMemo(() => {
    if (!session || session.questions.length === 0) return 0;
    return (score / session.questions.length) * 100;
  }, [score, session]);

  const getScoreFeedback = useMemo(() => {
    if (scorePercentage === 100) return "Perfect Score! You're a master!";
    if (scorePercentage >= 75) return "Great job! You know your stuff.";
    if (scorePercentage >= 50) return "Good effort! A little more review might help.";
    return "Keep studying! You'll get it next time.";
  }, [scorePercentage]);

  if (!isOpen || !session) return null;

  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-lg bg-[var(--color-sidebar)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-title"
      >
        {/* Progress Bar */}
        <div className="w-full bg-[var(--color-card)] h-2">
          <div 
            className="bg-blue-500 h-2 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-[var(--color-border)]">
          <h2 id="quiz-title" className="text-lg font-bold flex items-center gap-2">
            Study Quiz
          </h2>
          <button onClick={onClose} className="interactive-button w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-card)] transition-colors" aria-label="Close quiz">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!quizCompleted && currentQuestion ? (
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">
                Question {currentQuestionIndex + 1} of {session.questions.length}
              </p>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6 leading-snug">
                {currentQuestion.question}
              </h3>
              
              <div className="space-y-3">
                {currentQuestion.options?.map(option => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = currentQuestion.answer === option;

                  let buttonClass = 'border-[var(--color-border)] hover:bg-[var(--color-card)] hover:border-blue-500';
                  if (showFeedback) {
                    if (isCorrectAnswer) {
                      buttonClass = 'bg-green-500/10 border-green-500/50 text-green-300';
                    } else if (isSelected && !isCorrectAnswer) {
                      buttonClass = 'bg-red-500/10 border-red-500/50 text-red-300';
                    } else {
                       buttonClass = 'border-[var(--color-border)] text-[var(--color-text-secondary)]';
                    }
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={showFeedback}
                      className={`w-full text-left p-4 border rounded-lg transition-all duration-200 text-base font-medium flex items-center justify-between disabled:cursor-not-allowed ${buttonClass}`}
                    >
                      <span>{option}</span>
                      {showFeedback && isCorrectAnswer && <Check className="w-5 h-5 text-green-400" />}
                      {showFeedback && isSelected && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-400" />}
                    </button>
                  );
                })}
              </div>
              
              {showFeedback && currentQuestion.explanation && (
                <div className="mt-6 p-4 rounded-lg bg-[var(--color-card)] animate-fade-in-up border border-[var(--color-border)]">
                  <p className="text-sm text-[var(--color-text-secondary)]">{currentQuestion.explanation}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center flex flex-col items-center justify-center h-full py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Quiz Completed!</h3>
              <p className="text-base text-[var(--color-text-secondary)] mb-6">{getScoreFeedback}</p>
              <p className="text-5xl font-bold text-blue-400 mb-8">{score} / {session.questions.length}</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        {(showFeedback || quizCompleted) && (
          <div className="flex justify-end p-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]/50">
            {quizCompleted ? (
              <button onClick={onClose} className="chat-ui-button px-6 py-2 rounded-lg font-semibold interactive-button">
                Finish
              </button>
            ) : (
              <button onClick={handleNextQuestion} className="chat-ui-button px-6 py-2 rounded-lg font-semibold interactive-button">
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
