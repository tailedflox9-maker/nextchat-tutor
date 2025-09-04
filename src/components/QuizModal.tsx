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
    <div className="modal-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="fixed inset-0" 
        onClick={handleClose}
        aria-label="Close modal"
      />
      <div className={`modal-content ${isOpen ? 'open' : ''} relative w-full max-w-2xl bg-[var(--color-sidebar)] border border-[var(--color-border)] rounded-xl shadow-2xl flex flex-col`}>
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-[var(--color-border)]">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            Quiz Time!
          </h2>
          <button 
            onClick={handleClose} 
            className="interactive-button w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--color-card)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            aria-label="Close quiz"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 min-h-[24rem] overflow-y-auto scroll-container">
          {!quizCompleted && currentQuestion ? (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Question {currentQuestionIndex + 1} of {session.questions.length}
                </p>
                <div className="w-full max-w-48 bg-[var(--color-border)] rounded-full h-2 ml-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / session.questions.length) * 100}%` }}
                  />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6 leading-relaxed">
                {currentQuestion.question}
              </h3>
              
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={showFeedback}
                    className={`interactive-button w-full text-left p-4 border rounded-xl transition-all duration-200 text-base font-medium ${
                      showFeedback && option === currentQuestion.answer 
                        ? 'bg-green-500/20 border-green-500/50 text-green-100 shadow-lg shadow-green-500/10' :
                      showFeedback && option === selectedAnswer && !isCorrect 
                        ? 'bg-red-500/20 border-red-500/50 text-red-100 shadow-lg shadow-red-500/10' :
                      selectedAnswer === option && !showFeedback
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-100'
                        : 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-card)]/80 hover:border-[var(--color-border)]/60 disabled:cursor-not-allowed disabled:opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-sm font-bold">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              {showFeedback && (
                <div className="mt-6 p-4 rounded-xl bg-[var(--color-card)]/50 backdrop-blur-sm border border-[var(--color-border)]/30 animate-fade-in-up">
                  {isCorrect ? (
                    <div className="flex items-start gap-3 text-green-400">
                      <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-lg">Correct!</span>
                        {currentQuestion.explanation && (
                          <p className="text-[var(--color-text-secondary)] mt-2 text-sm leading-relaxed">
                            {currentQuestion.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 text-red-400">
                      <XCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-lg">Incorrect.</span>
                        <p className="text-[var(--color-text-secondary)] mt-1 text-sm">
                          The correct answer is: <span className="text-green-400 font-medium">{currentQuestion.answer}</span>
                        </p>
                        {currentQuestion.explanation && (
                          <p className="text-[var(--color-text-secondary)] mt-2 text-sm leading-relaxed">
                            {currentQuestion.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in-up">
              <div className="mb-8">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-[var(--color-text-primary)]">
                  Quiz Completed!
                </h3>
                <p className="text-lg text-[var(--color-text-secondary)] mb-6">
                  Final Score
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-8 border border-blue-500/30">
                <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  {score} / {session.questions.length}
                </div>
                <div className="text-[var(--color-text-secondary)]">
                  {((score / session.questions.length) * 100).toFixed(0)}% Accuracy
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-[var(--color-text-secondary)] text-sm">
                  {score === session.questions.length 
                    ? "Perfect score! Outstanding work! 🎉"
                    : score >= session.questions.length * 0.8
                    ? "Great job! You're doing excellent! 👏"
                    : score >= session.questions.length * 0.6
                    ? "Good effort! Keep practicing! 📚"
                    : "Don't give up! Practice makes perfect! 💪"
                  }
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]/50 backdrop-blur-sm">
          {showFeedback && !quizCompleted ? (
            <button 
              onClick={handleNextQuestion} 
              className="chat-ui-button interactive-button px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2"
            >
              <span>
                {currentQuestionIndex < session.questions.length - 1 ? 'Next Question' : 'View Results'}
              </span>
            </button>
          ) : quizCompleted ? (
            <button 
              onClick={handleClose} 
              className="chat-ui-button interactive-button px-6 py-2.5 rounded-lg font-semibold"
            >
              Complete Quiz
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
