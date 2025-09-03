import React, { useContext, useState } from 'react';
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
  Search,
  Pin,
  PinOff,
  Edit,
} from 'lucide-react';
import { Conversation } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
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
  onRenameConversation,
  onTogglePinConversation,
  onOpenSettings,
  settings,
  onModelChange,
  onCloseSidebar,
  isFolded = false,
  onToggleFold,
}: SidebarProps) {
  const { selectedLanguage } = useContext(LanguageContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const models = [
    { id: 'google', icon: Sparkles, name: 'Gemma' },
    { id: 'zhipu', icon: Brain, name: 'ZhipuAI' },
    { id: 'mistral-small', icon: Cloud, name: 'Mistral' },
    { id: 'mistral-codestral', icon: Terminal, name: 'Codestral' },
  ];
  
  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editingTitle.trim()) {
      onRenameConversation(editingId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  return (
    <div
      className={`${
        isFolded ? 'w-16' : 'w-64'
      } bg-[var(--color-sidebar)] flex flex-col h-full border-r border-[var(--color-border)] sidebar transition-all duration-300 ease-in-out fixed lg:static z-20`}
    >
      <div className="p-2 border-b border-[var(--color-border)] flex flex-col gap-2">
        <div className={`flex items-center ${isFolded ? 'justify-center' : 'justify-between'}`}>
          {!isFolded && (
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] px-2">
              {selectedLanguage === 'en' ? 'AI Tutor' : 'एआय शिक्षक'}
            </h1>
          )}
          <div className="flex items-center">
            <button
              onClick={onOpenSettings}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg transition-colors"
              title={selectedLanguage === 'en' ? 'Settings' : 'सेटिंग्ज'}
            >
              <Settings className="w-5 h-5" />
            </button>
            {onToggleFold && (
              <button
                onClick={onToggleFold}
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg transition-colors hidden lg:block"
                title={isFolded ? 'Expand' : 'Collapse'}
              >
                {isFolded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={onCloseSidebar}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg transition-colors lg:hidden"
              title={selectedLanguage === 'en' ? 'Close sidebar' : 'साइडबार बंद करा'}
            >
              <X className="w-5 h-5" />
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

      <div className="flex-1 overflow-y-auto p-2 border-t border-[var(--color-border)] mt-2 flex flex-col">
        {!isFolded && (
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={selectedLanguage === 'en' ? 'Search chats...' : 'चॅट शोधा...'}
              className="w-full bg-[var(--color-card)] border border-transparent focus:border-[var(--color-border)] rounded-lg pl-9 pr-3 py-1.5 text-sm placeholder:text-[var(--color-text-placeholder)] focus:outline-none transition-colors"
            />
          </div>
        )}

        {filteredConversations.length > 0 ? (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center gap-2 ${isFolded ? 'justify-center p-2' : 'p-2.5'} rounded-lg cursor-pointer transition-colors relative ${
                  currentConversationId === conversation.id ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)]' : 'hover:bg-[var(--color-card)] text-[var(--color-text-primary)]'
                }`}
                onClick={() => onSelectConversation(conversation.id)}
                title={isFolded ? conversation.title : undefined}
              >
                {conversation.isPinned && <Pin className="w-3 h-3 absolute top-1.5 left-1.5 text-yellow-400" />}
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                {!isFolded && (
                  <>
                    {editingId === conversation.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        className="flex-1 text-sm font-semibold bg-transparent border-b border-[var(--color-border)] focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="flex-1 text-sm font-semibold truncate">
                        {conversation.title}
                      </span>
                    )}
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); onTogglePinConversation(conversation.id); }} className={`p-1 rounded ${currentConversationId === conversation.id ? 'hover:bg-black/10' : 'hover:bg-gray-700'}`} title={conversation.isPinned ? 'Unpin' : 'Pin'}>
                        {conversation.isPinned ? <PinOff className="w-3.5 h-3.5 text-yellow-400" /> : <Pin className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleStartEditing(conversation); }} className={`p-1 rounded ${currentConversationId === conversation.id ? 'hover:bg-black/10' : 'hover:bg-gray-700'}`} title={selectedLanguage === 'en' ? 'Rename' : 'पुनर्नामित करा'}>
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteConversation(conversation.id); }} className={`p-1 rounded ${currentConversationId === conversation.id ? 'hover:bg-black/10' : 'hover:bg-red-900/30 text-red-400'}`} title={selectedLanguage === 'en' ? 'Delete' : 'हटवा'}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                {searchQuery ? (selectedLanguage === 'en' ? 'No results found' : 'परिणाम आढळले नाहीत') : (selectedLanguage === 'en' ? 'No chats yet' : 'अद्याप चॅट नाही')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
