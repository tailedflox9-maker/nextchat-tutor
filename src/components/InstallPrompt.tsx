import React, { useContext } from 'react';
import { Download } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';

interface InstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export function InstallPrompt({ onInstall, onDismiss }: InstallPromptProps) {
  const { selectedLanguage } = useContext(LanguageContext);

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-2xl p-4 z-50 animate-slide-up">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-sidebar)] rounded-lg flex items-center justify-center p-2">
          <img 
            src="/white-logo.png" 
            alt="AI Tutor Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Text content */}
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--color-text-primary)] text-base">
            {selectedLanguage === 'en' ? 'Install AI Tutor App' : 'AI ट्यूटर ॲप इंस्टॉल करा'}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {selectedLanguage === 'en'
              ? 'Get the best full-screen experience.'
              : 'उत्तम पूर्ण-स्क्रीन अनुभव मिळवा.'}
          </p>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={onDismiss}
          className="px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)] rounded-lg transition-colors touch-target"
        >
          {selectedLanguage === 'en' ? 'Later' : 'नंतर'}
        </button>
        <button
          onClick={onInstall}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[var(--color-accent-bg)] hover:bg-[var(--color-accent-bg-hover)] text-[var(--color-accent-text)] rounded-lg transition-colors touch-target"
        >
          <Download className="w-4 h-4" />
          {selectedLanguage === 'en' ? 'Install' : 'इंस्टॉल करा'}
        </button>
      </div>
    </div>
  );
}
