import React, { useState, useContext } from 'react';
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
  const { selectedLanguage, setSelectedLanguage } = useContext(LanguageContext);
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
    const notes = storageUtils.getNotes();
    const data = {
      conversations,
      notes,
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
        if (data.notes) storageUtils.saveNotes(data.notes);
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
      className={`interactive-button flex-1 flex items-center justify-center gap-2 p-2.5 sm:p-3 text-xs sm:text-sm font-semibold transition-colors rounded-lg touch-target ${
        activeTab === id 
          ? 'bg-[var(--color-card)] text-[var(--color-text-primary)]' 
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="modal-content open relative w-full max-w-lg bg-[var(--color-sidebar)] border border-[var(--color-border)] rounded-lg shadow-2xl flex flex-col animate-fade-in-up max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 flex items-center justify-between border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-[var(--color-text-primary)]" />
            <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
              {selectedLanguage === 'en' ? 'Settings' : 'सेटिंग्ज'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="interactive-button w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-card)] transition-colors touch-target"
            title={selectedLanguage === 'en' ? 'Close' : 'बंद करा'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="p-3 sm:p-4 grid grid-cols-3 gap-2 border-b border-[var(--color-border)] flex-shrink-0">
          <TabButton 
            id="general" 
            label={selectedLanguage === 'en' ? 'General' : 'सामान्य'} 
            Icon={Languages} 
          />
          <TabButton 
            id="keys" 
            label={selectedLanguage === 'en' ? 'API Keys' : 'API की'} 
            Icon={Shield} 
          />
          <TabButton 
            id="data" 
            label={selectedLanguage === 'en' ? 'Data' : 'डेटा'} 
            Icon={Database} 
          />
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto scroll-container">
          {activeTab === 'general' && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] mb-3 sm:mb-4">
                  {selectedLanguage === 'en' ? 'Language' : 'भाषा'}
                </h3>
                <div className="model-grid">
                  <button 
                    onClick={() => handleLanguageChange('en')} 
                    className={`interactive-button p-3 sm:p-4 border rounded-lg transition-colors text-sm font-semibold touch-target ${
                      selectedLanguage === 'en' 
                        ? 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-primary)]' 
                        : 'bg-transparent border-[var(--color-border)] hover:bg-[var(--color-card)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => handleLanguageChange('mr')} 
                    className={`interactive-button p-3 sm:p-4 border rounded-lg transition-colors text-sm font-semibold touch-target ${
                      selectedLanguage === 'mr' 
                        ? 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text-primary)]' 
                        : 'bg-transparent border-[var(--color-border)] hover:bg-[var(--color-card)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    मराठी
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                  {selectedLanguage === 'en' ? 'About' : 'बद्दल'}
                </h3>
                <div className="text-sm text-[var(--color-text-secondary)] space-y-2">
                  <p>
                    {selectedLanguage === 'en' 
                      ? 'AI Tutor - Your personal learning assistant powered by multiple AI models.'
                      : 'AI ट्यूटर - अनेक AI मॉडेलद्वारे संचालित तुमचा वैयक्तिक शिक्षण सहाय्यक.'}
                  </p>
                  <p className="text-xs">
                    {selectedLanguage === 'en' ? 'Version 2.0' : 'आवृत्ती 2.0'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                  {selectedLanguage === 'en' ? 'API Configuration' : 'API कॉन्फिगरेशन'}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  {selectedLanguage === 'en' 
                    ? 'Configure your API keys to enable AI functionality. Your keys are stored locally and never shared.'
                    : 'AI कार्यक्षमता सक्षम करण्यासाठी तुमच्या API की कॉन्फिगर करा. तुमच्या की स्थानिकपणे संग्रहीत केल्या जातात आणि कधीही सामायिक केल्या जात नाहीत.'}
                </p>
              </div>
              
              {Object.keys(apiInfo).map(key => {
                const id = key as keyof typeof apiInfo;
                const apiKeyId = `${id}ApiKey` as keyof APISettings;
                return (
                  <div key={id} className="space-y-2">
                    <label 
                      htmlFor={apiKeyId} 
                      className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5"
                    >
                      {apiInfo[id].name} API Key
                      <a 
                        href={apiInfo[id].url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title={`Get ${apiInfo[id].name} key`}
                        className="interactive-button p-0.5 hover:bg-[var(--color-border)] rounded"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-[var(--color-text-placeholder)] hover:text-[var(--color-text-primary)] transition-colors" />
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
                        className="w-full pl-9 pr-10 py-2.5 sm:py-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-card)] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                      />
                      <button 
                        type="button" 
                        onClick={() => toggleApiVisibility(id)} 
                        className="interactive-button absolute top-1/2 right-3 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1 rounded touch-target"
                        title={visibleApis[id] ? 'Hide key' : 'Show key'}
                      >
                        {visibleApis[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6 sm:space-y-8 animate-fadeIn">
              <div>
                <h3 className="font-semibold mb-3 text-[var(--color-text-primary)]">
                  {selectedLanguage === 'en' ? 'Import / Export' : 'आयात / निर्यात'}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  {selectedLanguage === 'en' 
                    ? 'Backup your conversations and notes, or import from a previous backup.'
                    : 'तुमच्या संभाषणा आणि नोट्सचा बॅकअप घ्या, किंवा मागील बॅकअपपासून आयात करा.'}
                </p>
                <div className="model-grid gap-3">
                  <button 
                    onClick={handleExportData} 
                    className="interactive-button flex items-center justify-center gap-2 p-3 sm:p-4 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors text-sm font-medium touch-target"
                  > 
                    <Download className="w-4 h-4"/> 
                    {selectedLanguage === 'en' ? 'Export' : 'निर्यात'}
                  </button>
                  <button 
                    onClick={triggerFileInput} 
                    className="interactive-button flex items-center justify-center gap-2 p-3 sm:p-4 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-card)] transition-colors text-sm font-medium touch-target"
                  > 
                    <Upload className="w-4 h-4"/> 
                    {selectedLanguage === 'en' ? 'Import' : 'आयात'}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportData} 
                    accept=".json" 
                    className="hidden"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-red-400">
                  {selectedLanguage === 'en' ? 'Danger Zone' : 'धोका क्षेत्र'}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  {selectedLanguage === 'en' 
                    ? 'Permanently delete all your data. This action cannot be undone.'
                    : 'तुमचा सर्व डेटा कायमचा हटवा. ही क्रिया पूर्ववत केली जाऊ शकत नाही.'}
                </p>
                <button 
                  onClick={handleClearData} 
                  className="interactive-button w-full flex items-center justify-center gap-2 p-3 sm:p-4 border border-red-500/30 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 hover:text-red-300 transition-colors font-medium touch-target"
                >
                  <Trash2 className="w-4 h-4" />
                  {selectedLanguage === 'en' ? 'Clear All Data' : 'सर्व डेटा साफ करा'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-[var(--color-border)] bg-[var(--color-bg)] flex-shrink-0">
          <button 
            onClick={onClose} 
            className="interactive-button px-4 sm:px-6 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg transition-colors font-semibold touch-target"
          >
            {selectedLanguage === 'en' ? 'Cancel' : 'रद्द करा'}
          </button>
          <button 
            onClick={handleSave} 
            className="interactive-button px-4 sm:px-6 py-2 bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] rounded-lg hover:bg-[var(--color-accent-bg-hover)] transition-colors font-semibold touch-target"
          >
            {selectedLanguage === 'en' ? 'Save' : 'जतन करा'}
          </button>
        </div>
      </div>
    </div>
  );
}
