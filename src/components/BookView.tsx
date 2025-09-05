// src/components/BookView.tsx
import React, { useState, useContext, useEffect } from 'react';
import { 
  Book, Plus, Download, Eye, Trash2, Clock, CheckCircle, 
  AlertCircle, Loader2, BookOpen, Target, Users, Brain,
  FileText, Sparkles, Play, Pause
} from 'lucide-react';
import { BookProject, BookSession, BookGenerationProgress } from '../types/book';
import { LanguageContext } from '../contexts/LanguageContext';
import { bookService } from '../services/bookService';

interface BookViewProps {
  books: BookProject[];
  currentBookId: string | null;
  onCreateBook: (session: BookSession) => Promise<void>;
  onSelectBook: (id: string) => void;
  onDeleteBook: (id: string) => void;
  hasApiKey: boolean;
}

export function BookView({ 
  books, 
  currentBookId, 
  onCreateBook, 
  onSelectBook, 
  onDeleteBook,
  hasApiKey 
}: BookViewProps) {
  const { selectedLanguage } = useContext(LanguageContext);
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<BookGenerationProgress | null>(null);
  const [formData, setFormData] = useState<BookSession>({
    goal: '',
    language: selectedLanguage,
    targetAudience: '',
    complexityLevel: 'intermediate',
    preferences: {
      includeExamples: true,
      includePracticalExercises: true,
      includeQuizzes: false
    }
  });

  const currentBook = currentBookId ? books.find(b => b.id === currentBookId) : null;
  
  useEffect(() => {
    setFormData(prev => ({ ...prev, language: selectedLanguage }));
  }, [selectedLanguage]);

  const handleCreateBook = async () => {
    if (!formData.goal.trim() || !hasApiKey) return;

    setIsGenerating(true);
    setProgress(null);
    
    // Set up progress callback
    bookService.setProgressCallback(setProgress);
    
    try {
      await onCreateBook(formData);
      setView('list');
      setFormData({
        goal: '',
        language: selectedLanguage,
        targetAudience: '',
        complexityLevel: 'intermediate',
        preferences: {
          includeExamples: true,
          includePracticalExercises: true,
          includeQuizzes: false
        }
      });
    } catch (error) {
      console.error('Error creating book:', error);
      alert(selectedLanguage === 'en' ? 'Failed to create book. Please try again.' : 'पुस्तक तयार करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const getStatusIcon = (status: BookProject['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'planning':
      case 'generating_roadmap':
      case 'generating_modules':
      case 'assembling':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Book className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: BookProject['status']) => {
    const statusMap = {
      planning: selectedLanguage === 'en' ? 'Planning' : 'नियोजन',
      generating_roadmap: selectedLanguage === 'en' ? 'Creating Roadmap' : 'रोडमॅप तयार करत आहे',
      generating_modules: selectedLanguage === 'en' ? 'Writing Chapters' : 'अध्याय लिहित आहे',
      assembling: selectedLanguage === 'en' ? 'Finalizing Book' : 'पुस्तक अंतिम करत आहे',
      completed: selectedLanguage === 'en' ? 'Completed' : 'पूर्ण',
      error: selectedLanguage === 'en' ? 'Error' : 'त्रुटी'
    };
    return statusMap[status] || status;
  };

  // List View
  if (view === 'list') {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 sm:p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Book className="w-6 h-6 text-[var(--color-text-primary)]" />
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                {selectedLanguage === 'en' ? 'AI Books' : 'एआय पुस्तके'}
              </h1>
            </div>
            <button
              onClick={() => setView('create')}
              disabled={!hasApiKey}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                hasApiKey
                  ? 'bg-[var(--color-accent-bg)] hover:bg-[var(--color-accent-bg-hover)] text-[var(--color-accent-text)]'
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{selectedLanguage === 'en' ? 'New Book' : 'नवीन पुस्तक'}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!hasApiKey && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <p className="text-yellow-200">
                  {selectedLanguage === 'en' 
                    ? 'Please configure your API key in Settings to create books.'
                    : 'पुस्तके तयार करण्यासाठी कृपया सेटिंग्जमध्ये तुमची API की कॉन्फिगर करा.'}
                </p>
              </div>
            </div>
          )}

          {books.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-[var(--color-text-secondary)] opacity-50 mb-4" />
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                {selectedLanguage === 'en' ? 'No books yet' : 'अजून कोणतीही पुस्तके नाहीत'}
              </h3>
              <p className="text-[var(--color-text-secondary)] mb-4">
                {selectedLanguage === 'en' 
                  ? 'Create your first AI-generated book to get started'
                  : 'सुरुवात करण्यासाठी तुमचे पहिले एआय-जनरेटेड पुस्तक तयार करा'}
              </p>
              {hasApiKey && (
                <button
                  onClick={() => setView('create')}
                  className="bg-[var(--color-accent-bg)] hover:bg-[var(--color-accent-bg-hover)] text-[var(--color-accent-text)] px-6 py-3 rounded-lg font-semibold"
                >
                  {selectedLanguage === 'en' ? 'Create First Book' : 'पहिले पुस्तक तयार करा'}
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className={`bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 sm:p-6 transition-all hover:border-gray-600 cursor-pointer ${
                    currentBookId === book.id ? 'border-blue-500' : ''
                  }`}
                  onClick={() => {
                    onSelectBook(book.id);
                    setView('detail');
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(book.status)}
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] truncate">
                          {book.title}
                        </h3>
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                        {book.goal}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(book.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="capitalize">{getStatusText(book.status)}</span>
                        {book.status !== 'completed' && book.status !== 'error' && (
                          <span>{book.progress}%</span>
                        )}
                        {book.modules.length > 0 && (
                          <span>{book.modules.length} {selectedLanguage === 'en' ? 'modules' : 'मॉड्यूल'}</span>
                        )}
                      </div>
                      {book.status !== 'completed' && book.status !== 'error' && (
                        <div className="mt-3">
                          <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${book.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {book.status === 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            bookService.downloadAsMarkdown(book);
                          }}
                          className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)] rounded-lg transition-colors"
                          title={selectedLanguage === 'en' ? 'Download' : 'डाउनलोड'}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBook(book.id);
                        }}
                        className="p-2 text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        title={selectedLanguage === 'en' ? 'Delete' : 'हटवा'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Create Book View
  if (view === 'create') {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 sm:p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('list')}
              className="p-2 hover:bg-[var(--color-card)] rounded-lg transition-colors"
            >
              <Book className="w-5 h-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
              {selectedLanguage === 'en' ? 'Create New Book' : 'नवीन पुस्तक तयार करा'}
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isGenerating ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
                <div className="text-center mb-6">
                  <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                    {selectedLanguage === 'en' ? 'Generating Your Book' : 'तुमचे पुस्तक तयार करत आहे'}
                  </h3>
                  <p className="text-[var(--color-text-secondary)]">
                    {selectedLanguage === 'en' 
                      ? 'This may take several minutes. Please do not close this tab.'
                      : 'यास काही मिनिटे लागू शकतात. कृपया हा टॅब बंद करू नका.'}
                  </p>
                </div>

                {progress && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-text-secondary)]">{progress.stage}</span>
                      <span className="text-[var(--color-text-primary)] font-medium">
                        {progress.currentModule && progress.totalModules 
                          ? `${progress.currentModule}/${progress.totalModules}` 
                          : ''}
                      </span>
                    </div>
                    <p className="text-[var(--color-text-primary)] font-medium">{progress.message}</p>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {progress.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      <Target className="w-4 h-4 inline mr-2" />
                      {selectedLanguage === 'en' ? 'Learning Goal' : 'शिकण्याचे ध्येय'}
                    </label>
                    <textarea
                      value={formData.goal}
                      onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                      placeholder={selectedLanguage === 'en' 
                        ? 'e.g., Learn Python for Data Science, Master React Development, Understanding Machine Learning...'
                        : 'उदा., डेटा सायन्ससाठी Python शिका, React डेव्हलपमेंट मास्टर करा, मशीन लर्निंग समजावून घ्या...'}
                      className="w-full h-24 p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-[var(--color-text-primary)]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                        <Users className="w-4 h-4 inline mr-2" />
                        {selectedLanguage === 'en' ? 'Target Audience' : 'लक्ष्य प्रेक्षक'}
                      </label>
                      <input
                        type="text"
                        value={formData.targetAudience}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                        placeholder={selectedLanguage === 'en' 
                          ? 'e.g., Students, Professionals, Beginners...'
                          : 'उदा., विद्यार्थी, व्यावसायिक, सुरुवातीचे...'}
                        className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                        <Brain className="w-4 h-4 inline mr-2" />
                        {selectedLanguage === 'en' ? 'Complexity Level' : 'जटिलता पातळी'}
                      </label>
                      <select
                        value={formData.complexityLevel}
                        onChange={(e) => setFormData(prev => ({ ...prev, complexityLevel: e.target.value as any }))}
                        className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[var(--color-text-primary)]"
                      >
                        <option value="beginner">{selectedLanguage === 'en' ? 'Beginner' : 'सुरुवातीचा'}</option>
                        <option value="intermediate">{selectedLanguage === 'en' ? 'Intermediate' : 'मध्यम'}</option>
                        <option value="advanced">{selectedLanguage === 'en' ? 'Advanced' : 'प्रगत'}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                      <FileText className="w-4 h-4 inline mr-2" />
                      {selectedLanguage === 'en' ? 'Book Preferences' : 'पुस्तकाची प्राधान्ये'}
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.preferences?.includeExamples}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences!, includeExamples: e.target.checked }
                          }))}
                          className="w-4 h-4 text-blue-600 bg-[var(--color-bg)] border-[var(--color-border)] rounded focus:ring-blue-500"
                        />
                        <span className="text-[var(--color-text-primary)]">
                          {selectedLanguage === 'en' ? 'Include practical examples' : 'व्यावहारिक उदाहरणे समाविष्ट करा'}
                        </span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.preferences?.includePracticalExercises}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences!, includePracticalExercises: e.target.checked }
                          }))}
                          className="w-4 h-4 text-blue-600 bg-[var(--color-bg)] border-[var(--color-border)] rounded focus:ring-blue-500"
                        />
                        <span className="text-[var(--color-text-primary)]">
                          {selectedLanguage === 'en' ? 'Include practical exercises' : 'व्यावहारिक सराव समाविष्ट करा'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateBook}
                    disabled={!formData.goal.trim() || !hasApiKey || isGenerating}
                    className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${
                      formData.goal.trim() && hasApiKey && !isGenerating
                        ? 'bg-[var(--color-accent-bg)] hover:bg-[var(--color-accent-bg-hover)] text-[var(--color-accent-text)]'
                        : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                    {selectedLanguage === 'en' ? 'Generate Book' : 'पुस्तक तयार करा'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Detail View
  if (view === 'detail' && currentBook) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 sm:p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('list')}
                className="p-2 hover:bg-[var(--color-card)] rounded-lg transition-colors"
              >
                <Book className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
                  {currentBook.title}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(currentBook.status)}
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {getStatusText(currentBook.status)}
                  </span>
                  {currentBook.status !== 'completed' && currentBook.status !== 'error' && (
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      ({currentBook.progress}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentBook.status === 'completed' && (
                <button
                  onClick={() => bookService.downloadAsMarkdown(currentBook)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-bg)] hover:bg-[var(--color-accent-bg-hover)] text-[var(--color-accent-text)] rounded-lg font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {selectedLanguage === 'en' ? 'Download' : 'डाउनलोड'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Book Info */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                {selectedLanguage === 'en' ? 'Book Details' : 'पुस्तकाचे तपशील'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {selectedLanguage === 'en' ? 'Goal:' : 'ध्येय:'}
                  </span>
                  <p className="text-[var(--color-text-primary)] font-medium">{currentBook.goal}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {selectedLanguage === 'en' ? 'Created:' : 'तयार केले:'}
                  </span>
                  <p className="text-[var(--color-text-primary)] font-medium">
                    {new Date(currentBook.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {selectedLanguage === 'en' ? 'Language:' : 'भाषा:'}
                  </span>
                  <p className="text-[var(--color-text-primary)] font-medium">
                    {currentBook.language === 'en' ? 'English' : 'मराठी'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {selectedLanguage === 'en' ? 'Modules:' : 'मॉड्यूल:'}
                  </span>
                  <p className="text-[var(--color-text-primary)] font-medium">
                    {currentBook.modules.length} {selectedLanguage === 'en' ? 'completed' : 'पूर्ण'}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress */}
            {currentBook.status !== 'completed' && currentBook.status !== 'error' && (
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  {selectedLanguage === 'en' ? 'Generation Progress' : 'निर्मिती प्रगती'}
                </h3>
                <div className="space-y-4">
                  <div className="w-full bg-[var(--color-border)] rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${currentBook.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {currentBook.progress}% {selectedLanguage === 'en' ? 'complete' : 'पूर्ण'}
                  </p>
                </div>
              </div>
            )}

            {/* Roadmap */}
            {currentBook.roadmap && (
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  {selectedLanguage === 'en' ? 'Learning Roadmap' : 'शिकण्याचा रोडमॅप'}
                </h3>
                <div className="space-y-4">
                  {currentBook.roadmap.modules.map((module, index) => {
                    const moduleCompleted = currentBook.modules.find(m => m.roadmapModuleId === module.id);
                    return (
                      <div key={module.id} className="flex items-start gap-3 p-3 border border-[var(--color-border)] rounded-lg">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          moduleCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-[var(--color-text-primary)]">{module.title}</h4>
                          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                            {module.objectives.join(', ')}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-secondary)]">
                            <span>{module.estimatedTime}</span>
                            {moduleCompleted && (
                              <span className="text-green-500 font-medium">
                                ✓ {selectedLanguage === 'en' ? 'Completed' : 'पूर्ण'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error Display */}
            {currentBook.status === 'error' && currentBook.error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-red-400">
                    {selectedLanguage === 'en' ? 'Generation Error' : 'निर्मिती त्रुटी'}
                  </h3>
                </div>
                <p className="text-red-200">{currentBook.error}</p>
              </div>
            )}

            {/* Completed Book Preview */}
            {currentBook.status === 'completed' && currentBook.finalBook && (
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  {selectedLanguage === 'en' ? 'Book Preview' : 'पुस्तकाचे पूर्वावलोकन'}
                </h3>
                <div className="bg-[var(--color-bg)] rounded-lg p-4 max-h-96 overflow-y-auto text-sm">
                  <pre className="whitespace-pre-wrap font-mono text-[var(--color-text-primary)]">
                    {currentBook.finalBook.substring(0, 2000)}...
                  </pre>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                  {selectedLanguage === 'en' 
                    ? 'Showing first 2000 characters. Download the full book to read everything.'
                    : 'पहिली 2000 अक्षरे दाखवत आहे. सर्वकाही वाचण्यासाठी संपूर्ण पुस्तक डाउनलोड करा.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
