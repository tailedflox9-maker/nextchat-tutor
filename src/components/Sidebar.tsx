import React, { useContext, useState } from 'react';
import {
  Plus, MessageSquare, Settings, Trash2, X, ChevronLeft, ChevronRight, 
  Sparkles, Brain, Cloud, Terminal, Search, Pin, Edit, Users, Wand2, Book, Menu
} from 'lucide-react';
import { Conversation, Note } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import { aiService } from '../services/aiService';

interface SidebarProps {
  conversations: Conversation[];
  notes: Note[];
  activeView: 'chat' | 'note';
  currentConversationId: string | null;
  currentNoteId: string | null;
  onNewConversation: () => void;
  onNewPersonaConversation: (systemPrompt: string) => void;
  onSelectConversation: (id: string) => void;
  onSelectNote: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onOpenSettings: () => void;
  settings: { selectedModel: string };
  onModelChange: (model: any) => void;
  onCloseSidebar: () => void;
  isSidebarOpen: boolean;
  isFolded?: boolean;
  onToggleFold?: () => void;
}

export function Sidebar({
  conversations, 
  notes, 
  activeView, 
  currentConversationId, 
  currentNoteId, 
  onNewConversation, 
  onNewPersonaConversation, 
  onSelectConversation, 
  onSelectNote, 
  onDeleteConversation, 
  onRenameConversation, 
  onTogglePinConversation, 
  onDeleteNote, 
  onOpenSettings, 
  settings, 
  onModelChange, 
  onCloseSidebar, 
  isFolded = false, 
  onToggleFold, 
  isSidebarOpen
}: SidebarProps) {
  const { selectedLanguage } = useContext(LanguageContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [view, setView] = useState<'chats' | 'personas' | 'notes'>('chats');
  const [personaPrompt, setPersonaPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const models = [
    { id: 'google', icon: Sparkles, name: 'Gemma', color: 'from-purple-500 to-pink-500' },
    { id: 'zhipu', icon: Brain, name: 'ZhipuAI', color: 'from-blue-500 to-cyan-500' },
    { id: 'mistral-small', icon: Cloud, name: 'Mistral', color: 'from-orange-500 to-red-500' },
    { id: 'mistral-codestral', icon: Terminal, name: 'Codestral', color: 'from-green-500 to-emerald-500' },
  ];
  
  const filteredConversations = conversations
    .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingTitle('');
    }
  };

  const handleCreatePersona = () => {
    if (personaPrompt.trim()) {
      onNewPersonaConversation(personaPrompt.trim());
      setPersonaPrompt('');
      setView('chats');
    }
  };

  const handleEnhancePrompt = async () => {
    if (!personaPrompt.trim()) return;
    setIsEnhancing(true);
    try {
      const enhanced = await aiService.enhancePrompt(personaPrompt);
      setPersonaPrompt(enhanced);
    } catch (error) {
      console.error("Failed to enhance prompt:", error);
      alert(selectedLanguage === 'en' ? 'Could not enhance prompt. Please check your API key.' : 'प्रॉम्प्ट वाढवता आला नाही. कृपया तुमची API की तपासा.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const sidebarClasses = `sidebar ${isSidebarOpen ? 'sidebar-open' : ''} ${isFolded ? 'sidebar-folded' : ''} bg-[var(--color-sidebar)] flex flex-col border-r border-[var(--color-border)] transition-all duration-300 ease-in-out`;

  return (
    <>
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div 
          className="sidebar-backdrop lg:hidden"
          onClick={onCloseSidebar}
          aria-hidden="true"
        />
      )}
      
      <aside className={sidebarClasses} role="navigation" aria-label="Main navigation">
        {/* Header */}
        <div className="p-3 border-b border-[var(--color-border)] flex flex-col gap-3">
          <div className={`flex items-center ${isFolded ? 'justify-center' : 'justify-between'}`}>
            {!isFolded && (
              <a 
                href="https://tanmay-kalbande.github.io/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 group px-2 py-1 rounded-lg hover:bg-[var(--color-card)]/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <img 
                    src="/white-logo.png" 
                    alt="Logo" 
                    className="w-5 h-5" 
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<span class="text-white font-bold text-xs">AI</span>';
                    }}
                  />
                </div>
                <h1 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-gray-200 transition-colors">
                  {selectedLanguage === 'en' ? 'AI Tutor' : 'एआय शिक्षक'}
                </h1>
              </a>
            )}
            
            <div className="flex items-center gap-1">
              <button 
                onClick={onOpenSettings} 
                className="interactive-button touch-target p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg transition-colors" 
                title={selectedLanguage === 'en' ? 'Settings' : 'सेटिंग्ज'}
                aria-label="Open settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {onToggleFold && (
                <button 
                  onClick={onToggleFold} 
                  className="interactive-button touch-target p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg transition-colors hidden lg:flex" 
                  title={isFolded ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-label={isFolded ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isFolded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
              )}
              
              <button 
                onClick={onCloseSidebar} 
                className="interactive-button touch-target p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)] rounded-lg transition-colors lg:hidden" 
                title={selectedLanguage === 'en' ? 'Close sidebar' : 'साइडबार बंद करा'}
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <button 
            onClick={onNewConversation} 
            className={`interactive-button chat-ui-button w-full flex items-center ${isFolded ? 'justify-center px-3' : 'justify-center px-4'} gap-2 py-2.5 rounded-lg font-semibold transition-all duration-200`}
            aria-label={selectedLanguage === 'en' ? 'Start new chat' : 'नवीन चॅट सुरू करा'}
          >
            <Plus className="w-4 h-4" />
            {!isFolded && (
              <span className={selectedLanguage === 'mr' ? 'font-bold' : ''}>
                {selectedLanguage === 'en' ? 'New Chat' : 'नवीन चॅट'}
              </span>
            )}
          </button>
        </div>

        {/* Model Selection */}
        <div className="p-3 border-b border-[var(--color-border)]">
          {isFolded ? (
            <div className="space-y-2">
              {models.map(model => (
                <button 
                  key={model.id} 
                  onClick={() => onModelChange(model.id as any)} 
                  className={`interactive-button touch-target w-full flex justify-center items-center p-2.5 rounded-lg transition-all duration-200 ${
                    settings.selectedModel === model.id 
                      ? `bg-gradient-to-r ${model.color} text-white shadow-lg` 
                      : 'bg-[var(--color-card)] hover:bg-[var(--color-card)]/80 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent hover:border-[var(--color-border)]'
                  }`} 
                  title={model.name}
                  aria-label={`Select ${model.name} model`}
                >
                  <model.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider px-1">
                {selectedLanguage === 'en' ? 'AI Model' : 'एआय मॉडेल'}
              </p>
              <div className="model-grid">
                {models.map(model => (
                  <button 
                    key={model.id} 
                    onClick={() => onModelChange(model.id as any)} 
                    className={`interactive-button touch-target flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${
                      settings.selectedModel === model.id 
                        ? `bg-gradient-to-r ${model.color} text-white shadow-lg transform scale-105` 
                        : 'bg-[var(--color-card)] hover:bg-[var(--color-card)]/80 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent hover:border-[var(--color-border)] hover:scale-105'
                    }`} 
                    title={`Select ${model.name}`}
                    aria-label={`Select ${model.name} model`}
                  >
                    <model.icon className="w-5 h-5" />
                    <span className="text-xs font-semibold truncate-text">{model.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search Bar */}
          {(view === 'chats' || view === 'notes') && !isFolded && (
            <div className="p-3 border-b border-[var(--color-border)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder={selectedLanguage === 'en' ? `Search ${view}...` : `${view === 'chats' ? 'चॅट' : 'नोट्स'} शोधा...`} 
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border)] focus:border-blue-500/50 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-[var(--color-text-placeholder)] focus:outline-none transition-all duration-200 focus:bg-[var(--color-card)]/80"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto scroll-container p-2">
            {view === 'chats' && (
              <div className="space-y-1" role="list" aria-label="Conversations">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto text-[var(--color-text-secondary)] opacity-50 mb-3" />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {searchQuery ? 
                        (selectedLanguage === 'en' ? 'No chats found' : 'कोणतीही चॅट आढळली नाही') :
                        (selectedLanguage === 'en' ? 'No chats yet' : 'अद्याप कोणतीही चॅट नाही')
                      }
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div 
                      key={conversation.id} 
                      role="listitem"
                      onClick={() => onSelectConversation(conversation.id)} 
                      className={`group flex items-center gap-2 ${isFolded ? 'justify-center p-2' : 'p-2.5'} rounded-lg cursor-pointer transition-all duration-200 relative ${
                        activeView === 'chat' && currentConversationId === conversation.id 
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-[var(--color-text-primary)]' 
                          : 'hover:bg-[var(--color-card)] text-[var(--color-text-primary)] border border-transparent hover:border-[var(--color-border)]/50'
                      }`} 
                      title={isFolded ? conversation.title : undefined}
                    >
                      {conversation.isPinned && !isFolded && (
                        <Pin className="w-3 h-3 absolute top-2 left-2 text-yellow-400 drop-shadow-sm" />
                      )}
                      
                      <div className={`flex items-center gap-2 ${conversation.isPinned && !isFolded ? 'ml-3' : ''} flex-1 min-w-0`}>
                        {conversation.isPersona ? 
                          <Sparkles className="w-4 h-4 flex-shrink-0 text-purple-400" /> : 
                          <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        }
                        
                        {!isFolded && (
                          <>
                            {editingId === conversation.id ? (
                              <input 
                                type="text" 
                                value={editingTitle} 
                                onChange={(e) => setEditingTitle(e.target.value)} 
                                onBlur={handleSaveEdit} 
                                onKeyDown={handleKeyDown} 
                                className="flex-1 text-sm font-semibold bg-transparent border-b border-[var(--color-border)] focus:outline-none focus:border-blue-500" 
                                autoFocus 
                                onClick={(e) => e.stopPropagation()} 
                              />
                            ) : (
                              <span className="flex-1 text-sm font-semibold truncate-text pr-2">
                                {conversation.title}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      
                      {!isFolded && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onTogglePinConversation(conversation.id); }} 
                            className={`interactive-button touch-target p-1.5 rounded transition-colors ${
                              currentConversationId === conversation.id 
                                ? 'hover:bg-black/10 text-yellow-400' 
                                : 'hover:bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-yellow-400'
                            }`} 
                            title={conversation.isPinned ? 'Unpin conversation' : 'Pin conversation'}
                            aria-label={conversation.isPinned ? 'Unpin conversation' : 'Pin conversation'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStartEditing(conversation); }} 
                            className={`interactive-button touch-target p-1.5 rounded transition-colors ${
                              currentConversationId === conversation.id 
                                ? 'hover:bg-black/10' 
                                : 'hover:bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                            }`} 
                            title="Rename conversation"
                            aria-label="Rename conversation"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (window.confirm(selectedLanguage === 'en' ? 'Delete this conversation?' : 'हे संभाषण हटवायचे?')) {
                                onDeleteConversation(conversation.id); 
                              }
                            }} 
                            className={`interactive-button touch-target p-1.5 rounded transition-colors ${
                              currentConversationId === conversation.id 
                                ? 'hover:bg-red-500/10 text-red-400' 
                                : 'hover:bg-red-500/10 text-[var(--color-text-secondary)] hover:text-red-400'
                            }`} 
                            title="Delete conversation"
                            aria-label="Delete conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {view === 'notes' && !isFolded && (
              <div className="space-y-1" role="list" aria-label="Notes">
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-8">
                    <Book className="w-12 h-12 mx-auto text-[var(--color-text-secondary)] opacity-50 mb-3" />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {searchQuery ? 
                        (selectedLanguage === 'en' ? 'No notes found' : 'कोणत्याही नोट्स आढळल्या नाहीत') :
                        (selectedLanguage === 'en' ? 'No notes yet' : 'अद्याप कोणत्याही नोट्स नाहीत')
                      }
                    </p>
                  </div>
                ) : (
                  filteredNotes.map((note) => (
                    <div 
                      key={note.id} 
                      role="listitem"
                      onClick={() => onSelectNote(note.id)} 
                      className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                        activeView === 'note' && currentNoteId === note.id 
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 text-[var(--color-text-primary)]' 
                          : 'hover:bg-[var(--color-card)] text-[var(--color-text-primary)] border-transparent hover:border-[var(--color-border)]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold truncate-text block mb-1">
                            {note.title}
                          </span>
                          <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                            {note.content}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (window.confirm(selectedLanguage === 'en' ? 'Delete this note?' : 'ही नोट हटवायची?')) {
                              onDeleteNote(note.id); 
                            }
                          }} 
                          className="interactive-button touch-target p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-[var(--color-text-secondary)] hover:text-red-400 transition-all duration-200 flex-shrink-0 ml-2"
                          title="Delete note"
                          aria-label="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {view === 'personas' && !isFolded && (
              <div className="p-2 flex flex-col h-full">
                <div className="mb-4">
                  <h3 className="text-base font-semibold mb-2 text-[var(--color-text-primary)]">
                    {selectedLanguage === 'en' ? 'Create AI Persona' : 'AI Persona तयार करा'}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {selectedLanguage === 'en' ? 'Define custom behavior and personality for the AI assistant.' : 'AI असिस्टंटसाठी सानुकूल वर्तणूक आणि व्यक्तिमत्त्व परिभाषित करा.'}
                  </p>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <textarea 
                    value={personaPrompt} 
                    onChange={(e) => setPersonaPrompt(e.target.value)} 
                    placeholder={selectedLanguage === 'en' ? 'e.g., You are a master chef who loves to teach cooking techniques and share recipes. You speak with passion about ingredients and always encourage creativity in the kitchen...' : 'उदा., तुम्ही एक मास्टर शेफ आहात जो स्वयंपाकाचे तंत्र शिकवण्यास आणि पाककृती सामायिक करण्यास आवडते. तुम्ही घटकांबद्दल उत्कटतेने बोलता आणि स्वयंपाकघरात नेहमी सर्जनशीलतेला प्रोत्साहन देता...'} 
                    className="w-full flex-1 bg-[var(--color-card)] border border-[var(--color-border)] focus:border-blue-500/50 rounded-lg p-3 text-sm resize-none mb-4 placeholder:text-[var(--color-text-placeholder)] focus:outline-none transition-all duration-200 min-h-32"
                  />
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={handleEnhancePrompt} 
                      disabled={!personaPrompt.trim() || isEnhancing} 
                      className="interactive-button flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-card)]/80 hover:border-blue-500/50 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      aria-label={selectedLanguage === 'en' ? 'Enhance prompt with AI' : 'AI सह प्रॉम्प्ट वाढवा'}
                    >
                      <Wand2 className={`w-4 h-4 ${isEnhancing ? 'animate-spin' : ''}`} />
                      <span>{isEnhancing ? (selectedLanguage === 'en' ? 'Enhancing...' : 'वाढवत आहे...') : (selectedLanguage === 'en' ? 'Enhance' : 'वाढवा')}</span>
                    </button>
                    
                    <button 
                      onClick={handleCreatePersona} 
                      disabled={!personaPrompt.trim() || isEnhancing} 
                      className="interactive-button chat-ui-button flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={selectedLanguage === 'en' ? 'Start chat with persona' : 'व्यक्तिमत्त्वासह चॅट सुरू करा'}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{selectedLanguage === 'en' ? 'Start Chat' : 'चॅट सुरू करा'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="p-2 border-t border-[var(--color-border)] bg-[var(--color-bg)]/50 backdrop-blur-sm">
          <div className={`${isFolded ? 'flex flex-col gap-1' : 'grid grid-cols-3 gap-1'}`}>
            <button 
              onClick={() => setView('chats')} 
              className={`interactive-button touch-target flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                view === 'chats' 
                  ? 'text-[var(--color-text-primary)] bg-[var(--color-card)] shadow-sm' 
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)]/50'
              }`}
              title={selectedLanguage === 'en' ? 'Chat conversations' : 'चॅट संभाषणे'}
              aria-label={selectedLanguage === 'en' ? 'View chat conversations' : 'चॅट संभाषणे पहा'}
            >
              <MessageSquare className="w-5 h-5" />
              {!isFolded && (
                <span className="text-xs font-semibold">
                  {selectedLanguage === 'en' ? 'Chats' : 'चॅट्स'}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => setView('personas')} 
              className={`interactive-button touch-target flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                view === 'personas' 
                  ? 'text-[var(--color-text-primary)] bg-[var(--color-card)] shadow-sm' 
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)]/50'
              }`}
              title={selectedLanguage === 'en' ? 'AI personas' : 'AI व्यक्तिमत्त्वे'}
              aria-label={selectedLanguage === 'en' ? 'Create AI personas' : 'AI व्यक्तिमत्त्वे तयार करा'}
            >
              <Users className="w-5 h-5" />
              {!isFolded && (
                <span className="text-xs font-semibold">
                  {selectedLanguage === 'en' ? 'Personas' : 'Personas'}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => setView('notes')} 
              className={`interactive-button touch-target flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                view === 'notes' 
                  ? 'text-[var(--color-text-primary)] bg-[var(--color-card)] shadow-sm' 
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card)]/50'
              }`}
              title={selectedLanguage === 'en' ? 'Notes' : 'नोट्स'}
              aria-label={selectedLanguage === 'en' ? 'View notes' : 'नोट्स पहा'}
            >
              <Book className="w-5 h-5" />
              {!isFolded && (
                <span className="text-xs font-semibold">
                  {selectedLanguage === 'en' ? 'Notes' : 'नोट्स'}
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
