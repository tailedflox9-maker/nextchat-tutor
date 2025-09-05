// src/components/BookTemplateSelector.tsx
import React, { useContext } from 'react';
import { 
  Code, Briefcase, Database, BookOpen, Palette, 
  Target, Users, Clock, CheckCircle
} from 'lucide-react';
import { BookTemplate } from '../services/bookEnhancements';
import { LanguageContext } from '../contexts/LanguageContext';

interface BookTemplateSelectorProps {
  templates: BookTemplate[];
  onSelectTemplate: (template: BookTemplate) => void;
  onSkip: () => void;
}

const categoryIcons = {
  programming: Code,
  business: Briefcase,
  science: Database,
  language: BookOpen,
  creative: Palette,
  general: Target
};

const categoryNames = {
  en: {
    programming: 'Programming',
    business: 'Business',
    science: 'Science',
    language: 'Language',
    creative: 'Creative',
    general: 'General'
  },
  mr: {
    programming: 'प्रोग्रामिंग',
    business: 'व्यवसाय',
    science: 'विज्ञान',
    language: 'भाषा',
    creative: 'सर्जनशील',
    general: 'सामान्य'
  }
};

export function BookTemplateSelector({ 
  templates, 
  onSelectTemplate, 
  onSkip 
}: BookTemplateSelectorProps) {
  const { selectedLanguage } = useContext(LanguageContext);

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, BookTemplate[]>);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
          {selectedLanguage === 'en' ? 'Choose a Book Template' : 'पुस्तक टेम्प्लेट निवडा'}
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-4">
          {selectedLanguage === 'en' 
            ? 'Get started faster with pre-configured templates, or create from scratch'
            : 'पूर्व-कॉन्फिगर केलेल्या टेम्प्लेट्सबरोबर जलद सुरुवात करा, किंवा सुरवातीपासून तयार करा'}
        </p>
        <button
          onClick={onSkip}
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline text-sm"
        >
          {selectedLanguage === 'en' ? 'Skip and create custom book' : 'स्किप करा आणि कस्टम पुस्तक तयार करा'}
        </button>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
          const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
          
          return (
            <div key={category} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CategoryIcon className="w-5 h-5 text-[var(--color-text-primary)]" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {categoryNames[selectedLanguage][category as keyof typeof categoryNames.en]}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => onSelectTemplate(template)}
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-950/20 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors">
                        {template.name}
                      </h4>
                      <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-card)] px-2 py-1 rounded">
                        {template.estimatedModules} modules
                      </div>
                    </div>
                    
                    <p className="text-sm text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{template.targetAudience}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      {template.preferences.includeExamples && (
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          <span>{selectedLanguage === 'en' ? 'Examples' : 'उदाहरणे'}</span>
                        </div>
                      )}
                      {template.preferences.includePracticalExercises && (
                        <div className="flex items-center gap-1 text-xs text-blue-400">
                          <CheckCircle className="w-3 h-3" />
                          <span>{selectedLanguage === 'en' ? 'Exercises' : 'सराव'}</span>
                        </div>
                      )}
                      {template.preferences.includeQuizzes && (
                        <div className="flex items-center gap-1 text-xs text-purple-400">
                          <CheckCircle className="w-3 h-3" />
                          <span>{selectedLanguage === 'en' ? 'Quizzes' : 'प्रश्नोत्तरी'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
