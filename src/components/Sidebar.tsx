// src/components/Sidebar.tsx
import React, { useState, useMemo } from 'react';
import {
  Settings, Trash2, X, ChevronLeft, ChevronRight, Search, Plus,
  Book, Beaker, Palette, Building, Cpu, Check, AlertCircle, ChevronDown, User,
  Sun, Moon
} from 'lucide-react';
import { Conversation, Note, APISettings } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  notes: Note[];
  activeView: 'chat' | 'note';
  currentConversationId: string | null;
  currentNoteId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onSelectNote: (id: string | null) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onOpenSettings: () => void;
  settings: APISettings;
  onModelChange: (model: string) => void;
  onCloseSidebar: () => void;
  isSidebarOpen: boolean;
  isFolded?: boolean;
  onToggleFold?: () => void;
}

// SVG Icons
const GoogleIcon = () => (
  <img src="/gemini.svg" alt="Google AI" className="w-4 h-4 filter brightness-0 invert dark:filter dark:brightness-0 dark:invert" />
);

const MistralIcon = () => (
  <img src="/mistral.svg" alt="Mistral AI" className="w-4 h-4 filter brightness-0 invert dark:filter dark:brightness-0 dark:invert" />
);

const ZhipuIcon = () => (
  <img src="/zhipu.svg" alt="ZhipuAI" className="w-4 h-4 filter brightness-0 invert dark:filter dark:brightness-0 dark:invert" />
);

// Model configuration
const modelConfig = {
  google: {
    name: "Google AI",
    icon: GoogleIcon,
    models: [
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Fast, lightweight' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Enhanced lightweight' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Balanced speed' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Latest flash' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Previous generation' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most capable' },
    ]
  },
  mistral: {
    name: "Mistral AI",
    icon: MistralIcon,
    models: [
      { id: 'mistral-small', name: 'Mistral Small', description: 'Cost-effective' },
      { id: 'mistral-codestral', name: 'Codestral', description: 'Code specialist' },
    ]
  },
  zhipu: {
    name: "ZhipuAI",
    icon: ZhipuIcon,
    models: [
      { id: 'glm-4', name: 'GLM-4', description: 'Chinese AI model' },
    ]
  }
};

export function Sidebar({
  conversations,
  notes,
  activeView,
  currentConversationId,
  currentNoteId,
  onNewConversation,
  onSelectConversation,
  onSelectNote,
  onDeleteConversation,
  onDeleteNote,
  onOpenSettings,
  onCloseSidebar,
  isFolded = false,
  onToggleFold,
  isSidebarOpen,
  settings,
  onModelChange,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as 'light' | 'dark') || 'dark';
  });
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Initialize theme on mount
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const sortedConversations = useMemo(() => {
    const filtered = conversations.filter(conv =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered;
  }, [conversations, searchQuery]);

  const sortedNotes = useMemo(() => {
    return notes.filter(note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  const hasApiKeyForProvider = (provider: keyof typeof modelConfig): boolean => {
    switch (provider) {
      case 'google': return !!settings.googleApiKey;
      case 'mistral': return !!settings.mistralApiKey;
      case 'zhipu': return !!settings.zhipuApiKey;
      default: return false;
    }
  };

  const getCurrentModelInfo = () => {
    // Determine provider from selected model
    let provider: keyof typeof modelConfig | null = null;
    let model = null;

    for (const [key, config] of Object.entries(modelConfig)) {
      const found = config.models.find(m => m.id === settings.selectedModel);
      if (found) {
        provider = key as keyof typeof modelConfig;
        model = found;
        break;
      }
    }

    return { provider: provider ? modelConfig[provider] : null, model };
  };

  const { provider: currentProvider, model: currentModel } = getCurrentModelInfo();

  const sidebarClasses = `sidebar transition-all duration-300 ease-in-out ${
    isSidebarOpen ? 'sidebar-open translate-x-0' : 'hidden lg:flex -translate-x-full lg:translate-x-0'
  } ${isFolded ? 'sidebar-folded w-14' : 'w-64'}`;

  return (
    <div className="relative">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ease-in-out"
          onClick={onCloseSidebar}
        />
      )}

      <aside className={sidebarClasses} style={{ zIndex: 50 }}>
        {/* Header */}
        <div className={`border-b border-[var(--color-border)] flex flex-col gap-2 transition-all duration-300 ease-in-out ${
          isFolded ? 'p-1' : 'p-2'
        }`}>
          <div className={`flex items-center transition-all duration-300 ease-in-out ${
            isFolded ? 'justify-center flex-col gap-2' : 'justify-between'
          }`}>
            <a href="/" className={`flex items-center group transition-all duration-300 ease-in-out ${
              isFolded ? 'flex-col gap-1 px-2 py-1' : 'gap-2 px-1'
            }`}>
              <img 
                src="/white-logo.png" 
                alt="Logo" 
                className="w-8 h-8 shrink-0 transition-all duration-300 ease-in-out" 
              />
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isFolded ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'
              }`}>
                {!isFolded && (
                  <div>
                    <h1 className="text-lg font-bold">AI Tutor</h1>
                    <p className="text-xs text-[var(--color-text-secondary)] -mt-1">Learn Smarter</p>
                  </div>
                )}
              </div>
              {isFolded && (
                <div className="text-center">
                  <h1 className="text-xs font-bold leading-tight">AI</h1>
                </div>
              )}
            </a>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isFolded ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'
            }`}>
              {!isFolded && (
                <button 
                  onClick={onCloseSidebar} 
                  className="p-2 hover:bg-[var(--color-hover-bg)] rounded-lg transition-colors duration-200 lg:hidden" 
                  title="Close sidebar"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          
          <button 
            onClick={onNewConversation} 
            className={`bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] hover:bg-[var(--color-accent-bg-hover)] w-full flex items-center justify-center gap-2 font-bold text-sm transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 rounded-lg ${
              isFolded ? 'p-3' : 'py-2.5 px-4'
            }`}
          >
            <Plus className="w-5 h-5 shrink-0" strokeWidth={2.5} />
            <span className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
              isFolded ? 'max-w-0 opacity-0 w-0' : 'max-w-xs opacity-100'
            }`}>
              {!isFolded && 'New Chat'}
            </span>
          </button>
        </div>

        {/* Model Selection */}
        <div className={`border-b border-[var(--color-border)] transition-all duration-300 ease-in-out ${
          isFolded ? 'p-2' : 'p-2'
        }`}>
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className={`w-full flex items-center rounded-lg border transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 ${
                modelDropdownOpen 
                  ? 'border-blue-500/50 bg-blue-500/10 shadow-lg' 
                  : 'border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-hover-bg)]'
              } ${
                isFolded ? 'justify-center p-3' : 'justify-between p-2'
              }`}
              title={isFolded ? `${currentProvider?.name || 'Select Model'} - ${currentModel?.name || 'No model'}` : undefined}
            >
              {isFolded ? (
                <>
                  {currentProvider ? <currentProvider.icon /> : <Cpu className="w-4 h-4" />}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    {currentProvider ? <currentProvider.icon /> : <Cpu className="w-4 h-4" />}
                    <div className="text-left">
                      <div className="text-sm font-medium text-[var(--color-text-primary)] transition-colors duration-200">
                        {currentProvider?.name || 'Select Model'}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)] truncate max-w-[140px]">
                        {currentModel?.name || 'No model'}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[var(--color-text-secondary)] transition-all duration-300 ease-in-out ${
                    modelDropdownOpen ? 'rotate-180 text-blue-400' : ''
                  }`} />
                </>
              )}
            </button>
            
            {isFolded && currentProvider && (
              <div className="text-xs text-[var(--color-text-secondary)] text-center mt-1 leading-tight">
                {currentProvider.name.split(' ')[0]}
              </div>
            )}

            {modelDropdownOpen && (
              <div className={`absolute z-[100] ${
                isFolded ? 'left-full ml-2 top-0 w-64' : 'top-full left-0 right-0 mt-1'
              } bg-[var(--color-sidebar)] border border-[var(--color-border)] rounded-lg shadow-xl max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-200 ease-out`}>
                {(Object.entries(modelConfig) as [keyof typeof modelConfig, typeof modelConfig.google][]).map(([provider, config]) => {
                  const hasApiKey = hasApiKeyForProvider(provider);
                  const IconComponent = config.icon;
                  
                  return (
                    <div key={provider} className="p-1">
                      <div className="px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider border-b border-[var(--color-border)]">
                        <div className="flex items-center gap-2">
                          <IconComponent />
                          {config.name}
                          {!hasApiKey && (
                            <div className="flex items-center gap-1 ml-auto animate-pulse">
                              <AlertCircle className="w-3 h-3 text-red-400" />
                              <span className="text-xs text-red-400">No Key</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="py-1">
                        {config.models.map((model) => {
                          const isSelected = settings.selectedModel === model.id;
                          
                          return (
                            <button
                              key={model.id}
                              onClick={() => {
                                if (!hasApiKey) {
                                  alert(`Please configure your ${config.name} API key in Settings first.`);
                                  onOpenSettings();
                                  setModelDropdownOpen(false);
                                  return;
                                }
                                onModelChange(model.id);
                                setModelDropdownOpen(false);
                              }}
                              disabled={!hasApiKey}
                              className={`w-full flex items-center justify-between px-3 py-2.5 text-left rounded-md transition-all duration-200 ease-in-out group transform hover:scale-[1.02] active:scale-[0.98] ${
                                isSelected
                                  ? 'bg-blue-500/20 text-blue-300 shadow-md'
                                  : hasApiKey 
                                    ? 'hover:bg-[var(--color-hover-bg)] text-[var(--color-text-primary)]' 
                                    : 'text-[var(--color-text-placeholder)] cursor-not-allowed opacity-50'
                              }`}
                              title={!hasApiKey ? `Configure ${config.name} API key` : model.description}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                {isSelected && <IconComponent />}
                                <div>
                                  <div className="text-sm font-medium">{model.name}</div>
                                  <div className="text-xs opacity-70">{model.description}</div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                <div className="border-t border-[var(--color-border)] p-1">
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setModelDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover-bg)] rounded-md transition-all duration-200"
                  >
                    <Settings className="w-4 h-4" />
                    Configure API Keys
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content List */}
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${
          isFolded ? 'p-1' : 'p-2'
        }`}>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isFolded ? 'max-h-0 opacity-0' : 'max-h-full opacity-100'
          }`}>
            {!isFolded && (
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            {activeView === 'chat' ? (
              sortedConversations.map(conv => {
                const isSelected = currentConversationId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`group flex items-center w-full rounded-lg cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] ${
                      isFolded ? 'justify-center p-2' : 'gap-3 p-2'
                    } ${
                      isSelected
                        ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] font-semibold shadow-md'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-hover-bg)]'
                    }`}
                    title={isFolded ? conv.title : undefined}
                  >
                    <Book className={`w-4 h-4 shrink-0 ${isSelected ? '' : 'text-[var(--color-text-secondary)]'}`} />
                    <div className={`flex flex-1 items-center min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${
                      isFolded ? 'max-w-0 opacity-0' : 'max-w-full opacity-100'
                    }`}>
                      {!isFolded && (
                        <>
                          <span className="flex-1 text-sm font-medium truncate">{conv.title}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }}
                            className={`p-1.5 opacity-0 group-hover:opacity-100 rounded-md transition-all duration-200 ${
                              isSelected 
                                ? 'hover:bg-[var(--color-accent-bg-hover)]' 
                                : 'hover:bg-[var(--color-active-bg)]'
                            }`}
                            title="Delete conversation"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              sortedNotes.map(note => {
                const isSelected = currentNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => onSelectNote(note.id)}
                    className={`group flex items-center w-full rounded-lg cursor-pointer transition-all duration-200 ${
                      isFolded ? 'justify-center p-2' : 'gap-3 p-2'
                    } ${
                      isSelected
                        ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] font-semibold'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-hover-bg)]'
                    }`}
                    title={isFolded ? note.title : undefined}
                  >
                    <Book className="w-4 h-4 shrink-0" />
                    <div className={`flex flex-1 items-center min-w-0 transition-all ${
                      isFolded ? 'max-w-0 opacity-0' : 'max-w-full opacity-100'
                    }`}>
                      {!isFolded && (
                        <>
                          <span className="flex-1 text-sm font-medium truncate">{note.title}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                            className="p-1.5 opacity-0 group-hover:opacity-100 rounded-md transition-all"
                            title="Delete note"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {((activeView === 'chat' && sortedConversations.length === 0) || 
            (activeView === 'note' && sortedNotes.length === 0)) && !isFolded && (
            <div className="text-center p-6 text-sm text-[var(--color-text-secondary)]">
              <p>No {activeView === 'chat' ? 'conversations' : 'notes'} found.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t border-[var(--color-border)] transition-all duration-300 ${
          isFolded ? 'p-2' : 'p-0'
        }`}>
          {!isFolded ? (
            <div>
              <div className="p-3 flex items-center gap-2">
                {/* Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover-bg)] rounded-lg transition-all duration-200 theme-toggle"
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                
                <button 
                  onClick={onOpenSettings}
                  className="flex-1 flex items-center gap-3 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover-bg)] rounded-lg transition-all duration-200"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                
                {onToggleFold && (
                  <button 
                    onClick={onToggleFold} 
                    className="hidden lg:block p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover-bg)] rounded-lg transition-all duration-200"
                    title="Collapse sidebar"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
              </div>
              
              <div className="px-3 pb-2">
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <User className="w-3 h-3" />
                  <span>Made by</span>
                  <a
                    href="https://linkedin.com/in/tanmay-kalbande"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-[var(--color-text-primary)] transition-colors duration-200"
                  >
                    Tanmay Kalbande
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button 
                onClick={toggleTheme}
                className="w-full p-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover-bg)] rounded-lg transition-all theme-toggle"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 mx-auto" /> : <Moon className="w-5 h-5 mx-auto" />}
              </button>
              
              <button 
                onClick={onOpenSettings}
                className="w-full p-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover-bg)] rounded-lg transition-all"
                title="Settings"
              >
                <Settings className="w-5 h-5 mx-auto" />
              </button>
              
              {onToggleFold && (
                <button 
                  onClick={onToggleFold} 
                  className="hidden lg:block w-full p-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover-bg)] rounded-lg transition-all"
                  title="Expand sidebar"
                >
                  <ChevronRight size={18} className="mx-auto" />
                </button>
              )}
            </div>
          )}
        </div>

        {modelDropdownOpen && (
          <div 
            className="fixed inset-0 z-[99]" 
            onClick={() => setModelDropdownOpen(false)}
          />
        )}
      </aside>
    </div>
  );
}
