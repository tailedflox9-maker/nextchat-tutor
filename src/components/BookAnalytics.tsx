// src/components/BookAnalytics.tsx
import React, { useContext, useMemo } from 'react';
import { 
  BarChart3, Clock, BookOpen, Target, Download, 
  FileText, Brain, TrendingUp, Hash
} from 'lucide-react';
import { BookProject, BookAnalytics as BookAnalyticsType } from '../types';
import { bookEnhancementService } from '../services/bookEnhancements';
import { LanguageContext } from '../contexts/LanguageContext';

interface BookAnalyticsProps {
  book: BookProject;
}

export function BookAnalytics({ book }: BookAnalyticsProps) {
  const { selectedLanguage } = useContext(LanguageContext);
  
  const analytics = useMemo(() => 
    bookEnhancementService.analyzeBook(book), 
    [book]
  );

  const studyMaterials = useMemo(() => 
    bookEnhancementService.generateStudyMaterials(book), 
    [book]
  );

  const downloadProgressTracker = () => {
    const progressContent = bookEnhancementService.generateProgressTracker(book);
    const blob = new Blob([progressContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_progress.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadStudySummary = () => {
    const blob = new Blob([studyMaterials.summary], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const complexityColor = {
    beginner: 'text-green-500',
    intermediate: 'text-yellow-500', 
    advanced: 'text-red-500'
  };

  return (
    <div className="space-y-6">
      {/* Main Analytics */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {selectedLanguage === 'en' ? 'Book Analytics' : 'पुस्तक विश्लेषण'}
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-lg mb-2 mx-auto">
              <Hash className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">
              {analytics.totalWords.toLocaleString()}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {selectedLanguage === 'en' ? 'Total Words' : 'एकूण शब्द'}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-lg mb-2 mx-auto">
              <Clock className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">
              {analytics.readingTime}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {selectedLanguage === 'en' ? 'Reading Time' : 'वाचन वेळ'}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-lg mb-2 mx-auto">
              <Brain className={`w-6 h-6 ${complexityColor[analytics.complexity]}`} />
            </div>
            <div className={`text-2xl font-bold ${complexityColor[analytics.complexity]} capitalize`}>
              {analytics.complexity}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {selectedLanguage === 'en' ? 'Complexity' : 'जटिलता'}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-lg mb-2 mx-auto">
              <BookOpen className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">
              {book.modules.length}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {selectedLanguage === 'en' ? 'Modules' : 'मॉड्यूल'}
            </div>
          </div>
        </div>
      </div>

      {/* Key Topics */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-purple-500" />
          <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {selectedLanguage === 'en' ? 'Key Topics' : 'मुख्य विषय'}
          </h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {analytics.topics.map((topic, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm font-medium"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Key Terms */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {selectedLanguage === 'en' ? 'Key Terms' : 'मुख्य संज्ञा'}
          </h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {analytics.keyTerms.map((term, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium"
            >
              {term}
            </span>
          ))}
        </div>
      </div>

      {/* Study Materials */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-green-500" />
            <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {selectedLanguage === 'en' ? 'Study Materials' : 'अभ्यास साहित्य'}
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={downloadProgressTracker}
            className="flex items-center gap-3 p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg hover:border-green-500 hover:bg-green-950/20 transition-all group"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-green-500/10 rounded-lg">
              <Download className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-[var(--color-text-primary)] group-hover:text-green-400">
                {selectedLanguage === 'en' ? 'Progress Tracker' : 'प्रगती ट्रैकर'}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                {selectedLanguage === 'en' ? 'Checklist for modules' : 'मॉड्यूल्ससाठी चेकलिस्ट'}
              </div>
            </div>
          </button>

          <button
            onClick={downloadStudySummary}
            className="flex items-center gap-3 p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg hover:border-blue-500 hover:bg-blue-950/20 transition-all group"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-lg">
              <Download className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-[var(--color-text-primary)] group-hover:text-blue-400">
                {selectedLanguage === 'en' ? 'Study Summary' : 'अभ्यास सारांश'}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                {selectedLanguage === 'en' ? 'Key points & objectives' : 'मुख्य मुद्दे आणि उद्दिष्टे'}
              </div>
            </div>
          </button>
        </div>

        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-yellow-500/20 rounded-lg flex-shrink-0">
              <FileText className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <h5 className="font-semibold text-yellow-400 mb-1">
                {selectedLanguage === 'en' ? 'Generated Study Cards' : 'तयार केलेली अभ्यास कार्डे'}
              </h5>
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                {studyMaterials.flashcards.length} {selectedLanguage === 'en' ? 'flashcards available for key terms' : 'मुख्य संज्ञांसाठी फ्लॅशकार्ड उपलब्ध'}
              </p>
              <div className="text-xs text-[var(--color-text-secondary)]">
                {selectedLanguage === 'en' 
                  ? 'Use these for spaced repetition and memory reinforcement'
                  : 'स्पेसड रिपिटिशन आणि मेमरी रीइन्फोर्समेंटसाठी वापरा'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
