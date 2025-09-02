import React, { useContext } from 'react';
import {
  Plus,
  MessageSquare,
  Settings,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Brain,
  Cloud,
  Terminal,
} from 'lucide-react';
import { Conversation } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  settings: { selectedModel: 'google' | 'zhipu' | 'mistral-small' | 'mistral-codestral' };
  onModelChange: (model: 'google' | 'zhipu' | 'mistral-small' | 'mistral-codestral') => void;
  onCloseSidebar: () => void;
  isFolded?: boolean;
  onToggleFold?: () => void;
}

export function Sidebar({
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onOpenSettings,
  settings,
  onModelChange,
  onCloseSidebar,
  isFolded = false,
  onToggleFold,
}: SidebarProps) {
  const { selectedLanguage } = useContext(LanguageContext);
  const models = [
    { id: 'google', icon: Sparkles, name: 'Gemma' },
    { id: 'zhipu', icon: Brain, name: 'ZhipuAI' },
    { id: 'mistral-small', icon: Cloud, name: 'Mistral' },
    { id: 'mistral-codestral', icon: Terminal, name: 'Codestral' },
  ];

  return (
    <div
      className={`${
        isFolded ? 'w-16' : 'w-64'
      } bg-[var(--color-sidebar)] flex flex-col h-full border-r border-[var(--color-border)] sidebar transition-all duration-300 ease-in-out fixed lg:static z-20`}
    >
      <div className="p-2 border-b border-[var(--color-border)] flex flex-col gap-2">
        <div className={`flex items-center ${isFolded ? 'justify-center' : 'justify-between'}`}>
          {!isFolded && (
            <h1 className="text-lg font-bold text-[var(--color-text-primary)] px-2">
              {selectedLanguage === 'en' ? 'AI Tutor' : 'एआय शिक्षक'}
            </h1>
          )}
          <div className="flex items-center">
            <button
              onClick={onOpenSettings}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg transition-colors"
              title={selectedLanguage === 'en' ? 'Settings' : 'सेटिंग्ज'}
            >
              <Settings className="w-4 h-4" />
            </button>
            {onToggleFold && (
              <button
                onClick={onToggleFold}
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg transition-colors hidden lg:block"
                title={isFolded ? 'Expand' : 'Collapse'}
              >
                {isFolded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={onCloseSidebar}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg transition-colors lg:hidden"
              title={selectedLanguage === 'en' ? 'Close sidebar' : 'साइडबार बंद करा'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button
          onClick={onNewConversation}
          className={`w-full flex items-center ${isFolded ? 'justify-center' : ''} gap-2 px-3 py-2 bg-[var(--color-accent-bg)] hover:bg-[var(--color-accent-bg-hover)] rounded-lg transition-colors text-[var(--color-accent-text)] shadow-sm font-semibold`}
        >
          <Plus className="w-4 h-4" />
          {!isFolded && (
            <span className={selectedLanguage === 'mr' ? 'font-bold' : ''}>
              {selectedLanguage === 'en' ? 'New chat' : 'नवीन चॅट'}
            </span>
          )}
        </button>
      </div>

      <div className="p-2">
        {isFolded ? (
          <div className="space-y-2">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => onModelChange(model.id as any)}
                className={`w-full flex justify-center items-center p-2.5 rounded-lg transition-all duration-200 border ${
                  settings.selectedModel === model.id
                    ? 'bg-[var(--color-card)] border-[var(--color-border)] text-white'
                    : 'bg-transparent border-transparent hover:bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-white'
                }`}
                title={model.name}
              >
                <model.icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider px-1">
              {selectedLanguage === 'en' ? 'AI Model' : 'एआय मॉडेल'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {models.map(model => (
                <button
                  key={model.id}
                  onClick={() => onModelChange(model.id as any)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 border transform hover:scale-105 active:scale-100 ${
                    settings.selectedModel === model.id
                      ? 'bg-[var(--color-card)] border-[var(--color-border)] text-white scale-105'
                      : 'bg-transparent border-transparent hover:bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-white'
                  }`}
                  title={model.name}
                >
                  <model.icon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{model.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 border-t border-[var(--color-border)] mt-2">
        {conversations.length > 0 ? (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center gap-2 ${isFolded ? 'justify-center p-2' : 'p-3'} rounded-lg cursor-pointer transition-colors ${
                  currentConversationId === conversation.id ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)]' : 'hover:bg-[var(--color-card)] text-[var(--color-text-primary)]'
                }`}
                onClick={() => onSelectConversation(conversation.id)}
                title={isFolded ? conversation.title : undefined}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                {!isFolded && (
                  <>
                    <span className={`flex-1 text-sm font-semibold truncate ${selectedLanguage === 'mr' ? 'font-bold' : ''}`}>
                      {conversation.title}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteConversation(conversation.id); }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${currentConversationId === conversation.id ? 'hover:bg-black/10' : 'hover:bg-red-900/30 text-red-400'}`}
                      title={selectedLanguage === 'en' ? 'Delete conversation' : 'संभाषण हटवा'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-[var(--color-text-secondary)] mt-8 px-4">
            <MessageSquare className={`${isFolded ? 'w-5 h-5' : 'w-8 h-8'} mx-auto mb-2 text-[var(--color-text-secondary)]`} />
            {!isFolded && (
              <p className={`text-sm font-medium ${selectedLanguage === 'mr' ? 'font-semibold' : ''}`}>
                {selectedLanguage === 'en' ? 'No chats yet' : 'अद्याप चॅट नाही'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
