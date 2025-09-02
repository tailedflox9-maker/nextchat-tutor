import React, { useState, useEffect, useRef, useContext } from 'react';
import { X, Settings, Key, Download, Upload, Languages, Shield, Database, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { APISettings } from '../types';
import { storageUtils } from '../utils/storage';
import { LanguageContext } from '../contexts/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: APISettings;
  onSaveSettings: (settings: APISettings) => void;
  isSidebarFolded: boolean;
  isSidebarOpen: boolean;
}

const apiInfo = {
  google: { name: 'Google AI', url: 'https://aistudio.google.com/app/apikey' },
  zhipu: { name: 'ZhipuAI', url: 'https://open.bigmodel.cn/' },
  mistral: { name: 'Mistral', url: 'https://console.mistral.ai/api-keys' },
};

export function SettingsModal({ isOpen, onClose, settings, onSaveSettings, isSidebarFolded, isSidebarOpen }: SettingsModalProps) {
  const { selectedLanguage, setSelectedLanguage } = useContext(LanguageContext);
  const [localSettings, setLocalSettings] = useState<APISettings>(settings);
  const [visibleApis, setVisibleApis] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleLanguageChange = (language: 'en' | 'mr') => {
    setSelectedLanguage(language);
    localStorage.setItem('ai-tutor-language', language);
  };

  const toggleApiVisibility = (id: string) => {
    setVisibleApis(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
  };

  const handleExportData = () => {
    const conversations = storageUtils.getConversations();
    const data = {
      conversations,
      settings: storageUtils.getSettings(),
      language: selectedLanguage,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-tutor-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.conversations) storageUtils.saveConversations(data.conversations);
        if (data.settings) {
          setLocalSettings(data.settings);
          storageUtils.saveSettings(data.settings);
        }
        if (data.language) {
          setSelectedLanguage(data.language);
          localStorage.setItem('ai-tutor-language', data.language);
        }
        alert(selectedLanguage === 'en' ? 'Data imported successfully!' : 'डेटा यशस्वीपणे आयात केला!');
      } catch (error) {
        console.error('Error importing data:', error);
        alert(selectedLanguage === 'en' ? 'Failed to import data.' : 'डेटा आयात अयशस्वी.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const sidebarWidth = isSidebarOpen ? (isSidebarFolded ? '4rem' : '16rem') : '0rem';

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        className={`fixed top-0 bottom-0 z-40 w-full max-w-xs bg-[var(--color-sidebar)] border-r border-[var(--color-border)] shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ left: sidebarWidth }}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" />
                <h2 className="text-xl font-bold">
                  {selectedLanguage === 'en' ? 'Settings' : 'सेटिंग्ज'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-card)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1 space-y-10">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Languages /> {selectedLanguage === 'en' ? 'General' : 'सामान्य'}
              </h3>
              <fieldset>
                <legend className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  {selectedLanguage === 'en' ? 'Language' : 'भाषा'}
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleLanguageChange('en')} className={`p-3 border rounded-lg transition-colors text-sm font-semibold ${selectedLanguage === 'en' ? 'bg-[var(--color-card)] border-[var(--color-border)]' : 'bg-transparent border-[var(--color-border)] hover:bg-[var(--color-card)]'}`}>English</button>
                  <button onClick={() => handleLanguageChange('mr')} className={`p-3 border rounded-lg transition-colors text-sm font-semibold ${selectedLanguage === 'mr' ? 'bg-[var(--color-card)] border-[var(--color-border)]' : 'bg-transparent border-[var(--color-border)] hover:bg-[var(--color-card)]'}`}>मराठी</button>
                </div>
              </fieldset>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Shield /> {selectedLanguage === 'en' ? 'API Keys' : 'API की'}
              </h3>
              {Object.keys(apiInfo).map(key => {
                const id = key as keyof typeof apiInfo;
                const apiKeyId = `${id}ApiKey` as keyof APISettings;
                return (
                  <div key={id}>
                    <label htmlFor={apiKeyId} className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 flex items-center gap-1.5">
                      {apiInfo[id].name} API Key
                      <a href={apiInfo[id].url} target="_blank" rel="noopener noreferrer" title={`Get ${apiInfo[id].name} key`}>
                        <HelpCircle className="w-3.5 h-3.5 text-[var(--color-text-placeholder)] hover:text-[var(--color-text-primary)]" />
                      </a>
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-[var(--color-text-secondary)] absolute top-1/2 left-3 -translate-y-1/2" />
                      <input
                        id={apiKeyId}
                        type={visibleApis[id] ? 'text' : 'password'}
                        value={localSettings[apiKeyId]}
                        onChange={(e) => setLocalSettings(prev => ({ ...prev, [apiKeyId]: e.target.value }))}
                        placeholder={`${apiInfo[id].name} key`}
                        className="w-full pl-9 pr-10 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-card)] focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                      />
                      <button type="button" onClick={() => toggleApiVisibility(id)} className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                        {visibleApis[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Database /> {selectedLanguage === 'en' ? 'Data Management' : 'डेटा व्यवस्थापन'}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleExportData} className="flex items-center justify-center gap-2 p-3 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors"> <Download className="w-4 h-4"/> {selectedLanguage === 'en' ? 'Export' : 'निर्यात'}</button>
                <button onClick={triggerFileInput} className="flex items-center justify-center gap-2 p-3 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors"> <Upload className="w-4 h-4"/> {selectedLanguage === 'en' ? 'Import' : 'आयात'}</button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden"/>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
            <button onClick={onClose} className="px-6 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg transition-colors font-semibold">
              {selectedLanguage === 'en' ? 'Cancel' : 'रद्द करा'}
            </button>
            <button onClick={handleSave} className="px-6 py-2 bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] rounded-lg hover:bg-[var(--color-accent-bg-hover)] transition-colors font-semibold">
              {selectedLanguage === 'en' ? 'Save' : 'जतन करा'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
