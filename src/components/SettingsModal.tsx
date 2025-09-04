import React, { useState } from 'react';
import { X, Settings, Key, Download, Upload, Languages, Shield, Database, Eye, EyeOff, HelpCircle, Trash2 } from 'lucide-react';
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

type ActiveTab = 'general' | 'keys' | 'data';

export function SettingsModal({ isOpen, onClose, settings, onSaveSettings }: SettingsModalProps) {
  const { selectedLanguage, setSelectedLanguage } = React.useContext(LanguageContext);
  const [localSettings, setLocalSettings] = useState<APISettings>(settings);
  const [visibleApis, setVisibleApis] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
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
        alert(selectedLanguage === 'en' ? 'Data imported successfully! The app will now reload.' : 'डेटा यशस्वीपणे आयात केला! ॲप आता रीलोड होईल.');
        window.location.reload();
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

  const handleClearData = () => {
    const confirmationText = selectedLanguage === 'en'
      ? 'Are you sure you want to delete all conversations and settings? This action cannot be undone.'
      : 'तुम्हाला खात्री आहे की तुम्हाला सर्व संभाषणे आणि सेटिंग्ज हटवायची आहेत? ही क्रिया पूर्ववत केली जाऊ शकत नाही.';
      
    if (window.confirm(confirmationText)) {
      storageUtils.clearAllData();
      alert(selectedLanguage === 'en' ? 'All data has been cleared. The app will now reload.' : 'सर्व डेटा साफ झाला आहे. ॲप आता रीलोड होईल.');
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  const TabButton = ({ id, label, Icon }: { id: ActiveTab; label: string; Icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold transition-colors rounded-lg ${
        activeTab === id ? 'bg-[var(--color-card)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[var(--color-sidebar)] border border-[var(--color-border)] rounded-lg shadow-2xl flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5" />
            <h2 className="text-xl font-bold">{selectedLanguage === 'en' ? 'Settings' : 'सेटिंग्ज'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-card)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="p-3 grid grid-cols-3 gap-2 border-b border-[var(--color-border)]">
          <TabButton id="general" label={selectedLanguage === 'en' ? 'General' : 'सामान्य'} Icon={Languages} />
          <TabButton id="keys" label={selectedLanguage === 'en' ? 'API Keys' : 'API की'} Icon={Shield} />
          <TabButton id="data" label={selectedLanguage === 'en' ? 'Data' : 'डेटा'} Icon={Database} />
        </div>
        
        {/* Content */}
        <div className="p-6 min-h-[20rem]">
          {activeTab === 'general' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {selectedLanguage === 'en' ? 'Language' : 'भाषा'}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleLanguageChange('en')} className={`p-3 border rounded-lg transition-colors text-sm font-semibold ${selectedLanguage === 'en' ? 'bg-[var(--color-card)] border-[var(--color-border)]' : 'bg-transparent border-[var(--color-border)] hover:bg-[var(--color-card)]'}`}>English</button>
                <button onClick={() => handleLanguageChange('mr')} className={`p-3 border rounded-lg transition-colors text-sm font-semibold ${selectedLanguage === 'mr' ? 'bg-[var(--color-card)] border-[var(--color-border)]' : 'bg-transparent border-[var(--color-border)] hover:bg-[var(--color-card)]'}`}>मराठी</button>
              </div>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="space-y-4 animate-fadeIn">
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
          )}

          {activeTab === 'data' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="font-semibold mb-2">{selectedLanguage === 'en' ? 'Import / Export' : 'आयात / निर्यात'}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleExportData} className="flex items-center justify-center gap-2 p-3 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors"> <Download className="w-4 h-4"/> {selectedLanguage === 'en' ? 'Export' : 'निर्यात'}</button>
                  <button onClick={triggerFileInput} className="flex items-center justify-center gap-2 p-3 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors"> <Upload className="w-4 h-4"/> {selectedLanguage === 'en' ? 'Import' : 'आयात'}</button>
                  <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden"/>
                </div>
              </div>
               <div>
                <h3 className="font-semibold mb-2 text-red-400">{selectedLanguage === 'en' ? 'Danger Zone' : 'धोका क्षेत्र'}</h3>
                <button onClick={handleClearData} className="w-full flex items-center justify-center gap-2 p-3 border border-red-500/30 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 hover:text-red-300 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  {selectedLanguage === 'en' ? 'Clear All Data' : 'सर्व डेटा साफ करा'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
          <button onClick={onClose} className="px-6 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg transition-colors font-semibold">
            {selectedLanguage === 'en' ? 'Cancel' : 'रद्द करा'}
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] rounded-lg hover:bg-[var(--color-accent-bg-hover)] transition-colors font-semibold">
            {selectedLanguage === 'en' ? 'Save' : 'जतन करा'}
          </button>
        </div>
      </div>
    </div>
  );
}
