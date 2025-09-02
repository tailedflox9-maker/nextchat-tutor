import React, { createContext, useState, useEffect } from 'react';

interface LanguageContextType {
  selectedLanguage: 'en' | 'mr';
  setSelectedLanguage: (language: 'en' | 'mr') => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  selectedLanguage: 'en',
  setSelectedLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'mr'>(
    (localStorage.getItem('ai-tutor-language') as 'en' | 'mr') || 'en'
  );

  useEffect(() => {
    localStorage.setItem('ai-tutor-language', selectedLanguage);
  }, [selectedLanguage]);

  return (
    <LanguageContext.Provider value={{ selectedLanguage, setSelectedLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
