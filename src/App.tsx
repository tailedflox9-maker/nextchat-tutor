import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { NoteView } from './components/NoteView';
import { InstallPrompt } from './components/InstallPrompt';
import { SettingsModal } from './components/SettingsModal';
import { QuizModal } from './components/QuizModal';
import { Conversation, Message, APISettings, Note, StudySession } from './types';
import { aiService } from './services/aiService';
import { storageUtils } from './utils/storage';
import { generateId, generateConversationTitle } from './utils/helpers';
import { usePWA } from './hooks/usePWA';
import { Menu } from 'lucide-react';
import { LanguageContext } from './contexts/LanguageContext';

type ActiveView = 'chat' | 'note';

function App() {
  const { selectedLanguage } = useContext(LanguageContext);

  // --- START: Synchronous state initialization ---
  const [conversations, setConversations] = useState<Conversation[]>(() => storageUtils.getConversations());
  const [notes, setNotes] = useState<Note[]>(() => storageUtils.getNotes());
  const [settings, setSettings] = useState<APISettings>(() => storageUtils.getSettings());

  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    const initialConversations = storageUtils.getConversations();
    if (initialConversations.length > 0) {
      const sorted = [...initialConversations].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      return sorted[0].id;
    }
    return null;
  });
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);

  const [sidebarFolded, setSidebarFolded] = useState(() => JSON.parse(localStorage.getItem('ai-tutor-sidebar-folded') || 'false'));
  // --- END: Synchronous state initialization ---

  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const stopStreamingRef = useRef(false);

  const { isInstallable, isInstalled, installApp, dismissInstallPrompt } = usePWA();

  // --- START: Refactored useEffect hooks ---
  useEffect(() => {
    aiService.updateSettings(settings, selectedLanguage);
  }, [settings, selectedLanguage]);

  useEffect(() => {
    storageUtils.saveConversations(conversations);
  }, [conversations]);
  
  useEffect(() => {
    storageUtils.saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-tutor-sidebar-folded', JSON.stringify(sidebarFolded));
  }, [sidebarFolded]);
  // --- END: Refactored useEffect hooks ---

  const handleModelChange = (model: 'google' | 'zhipu' | 'mistral-small' | 'mistral-codestral') => {
    const newSettings = { ...settings, selectedModel: model };
    setSettings(newSettings);
    storageUtils.saveSettings(newSettings);
  };

  const currentConversation = useMemo(() => conversations.find(c => c.id === currentConversationId), [conversations, currentConversationId]);
  const currentNote = useMemo(() => notes.find(n => n.id === currentNoteId), [notes, currentNoteId]);
  const hasApiKey = !!(settings.googleApiKey || settings.zhipuApiKey || settings.mistralApiKey);

  const handleSelectConversation = (id: string) => {
    setActiveView('chat');
    setCurrentConversationId(id);
    setCurrentNoteId(null);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSelectNote = (id: string) => {
    setActiveView('note');
    setCurrentNoteId(id);
    setCurrentConversationId(null);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: generateId(), title: selectedLanguage === 'en' ? 'New Chat' : 'नवीन चॅट', messages: [], createdAt: new Date(), updatedAt: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    handleSelectConversation(newConversation.id);
  };
  
  const handleNewPersonaConversation = (systemPrompt: string) => {
    const newConversation: Conversation = {
      id: generateId(),
      title: generateConversationTitle(systemPrompt),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPersona: true,
      systemPrompt: systemPrompt,
    };
    setConversations(prev => [newConversation, ...prev]);
    handleSelectConversation(newConversation.id);
  };

  const handleSaveAsNote = (content: string) => {
    if (!currentConversationId) return;
    const newNote: Note = {
      id: generateId(), title: generateConversationTitle(content), content, createdAt: new Date(), updatedAt: new Date(), sourceConversationId: currentConversationId,
    };
    setNotes(prev => [newNote, ...prev]);
    alert("Note saved!");
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if(currentNoteId === id) {
      setCurrentNoteId(null);
      setActiveView('chat'); // Revert to chat view if the active note is deleted
    }
  };
  
  const handleGenerateQuiz = async () => {
    if (!currentConversation) return;
    setIsQuizLoading(true);
    try {
      const session = await aiService.generateQuiz(currentConversation);
      setStudySession(session);
      setIsQuizModalOpen(true);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Failed to generate quiz.');
    } finally {
      setIsQuizLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!hasApiKey) {
      alert(selectedLanguage === 'en' ? 'Please set your API key in the settings first.' : 'कृपया प्रथम सेटिंग्जमध्ये तुमची API की सेट करा.');
      return;
    }
    
    let targetConversationId = currentConversationId;

    if (activeView === 'note' || !targetConversationId) {
      const newConv: Conversation = { id: generateId(), title: generateConversationTitle(content), messages: [], createdAt: new Date(), updatedAt: new Date() };
      setConversations(prev => [newConv, ...prev]);
      targetConversationId = newConv.id;
      handleSelectConversation(newConv.id);
    }

    const userMessage: Message = { id: generateId(), content, role: 'user', timestamp: new Date() };
    
    setConversations(prev => prev.map(conv => {
      if (conv.id === targetConversationId) {
        return { ...conv, title: conv.messages.length === 0 && !conv.isPersona ? generateConversationTitle(content) : conv.title, messages: [...conv.messages, userMessage], updatedAt: new Date() };
      }
      return conv;
    }));

    const convForApi = conversations.find(c => c.id === targetConversationId);
    if (!convForApi) return; // Should not happen

    setIsChatLoading(true);
    stopStreamingRef.current = false;
    try {
      const assistantMessage: Message = { id: generateId(), content: '', role: 'assistant', timestamp: new Date(), model: settings.selectedModel };
      setStreamingMessage(assistantMessage);

      let fullResponse = '';
      const messagesForApi = [...convForApi.messages, userMessage].map(m => ({ role: m.role, content: m.content }));
      
      for await (const chunk of aiService.generateStreamingResponse(messagesForApi, selectedLanguage, convForApi.systemPrompt)) {
        if (stopStreamingRef.current) break;
        fullResponse += chunk;
        setStreamingMessage(prev => prev ? { ...prev, content: fullResponse } : null);
      }

      const finalAssistantMessage: Message = { ...assistantMessage, content: fullResponse };
      setConversations(prev => prev.map(conv => conv.id === targetConversationId ? { ...conv, messages: [...conv.messages.filter(m => m.id !== userMessage.id), userMessage, finalAssistantMessage], updatedAt: new Date() } : conv));
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { id: generateId(), content: `Sorry, an error occurred. Error: ${error instanceof Error ? error.message : 'Unknown error'}`, role: 'assistant', timestamp: new Date() };
      setConversations(prev => prev.map(conv => conv.id === targetConversationId ? { ...conv, messages: [...conv.messages.filter(m => m.id !== userMessage.id), userMessage, errorMessage] } : conv));
    } finally {
      setStreamingMessage(null);
      setIsChatLoading(false);
      stopStreamingRef.current = false;
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        return {
          ...conv,
          messages: conv.messages.map(msg =>
            msg.id === messageId ? { ...msg, content: newContent } : msg
          ),
          updatedAt: new Date(),
        };
      }
      return conv;
    }));
  };

  const handleRegenerateResponse = async (messageId: string) => {
    const conversation = conversations.find(c => c.id === currentConversationId);
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || conversation.messages[messageIndex].role !== 'assistant') return;

    // Correct: History includes the user message that prompted this assistant response
    const history = conversation.messages.slice(0, messageIndex);
    const messagesForApi = history.map(m => ({ role: m.role, content: m.content }));

    setConversations(prev => prev.map(conv => {
        if (conv.id === currentConversationId) {
            return { ...conv, messages: history, updatedAt: new Date() };
        }
        return conv;
    }));

    setIsChatLoading(true);
    stopStreamingRef.current = false;

    try {
        const assistantMessage: Message = { id: generateId(), content: '', role: 'assistant', timestamp: new Date(), model: settings.selectedModel };
        setStreamingMessage(assistantMessage);

        let fullResponse = '';
        for await (const chunk of aiService.generateStreamingResponse(messagesForApi, selectedLanguage, conversation.systemPrompt)) {
            if (stopStreamingRef.current) break;
            fullResponse += chunk;
            setStreamingMessage(prev => prev ? { ...prev, content: fullResponse } : null);
        }

        const finalAssistantMessage: Message = { ...assistantMessage, content: fullResponse };
        setConversations(prev => prev.map(conv => conv.id === currentConversationId ? { ...conv, messages: [...history, finalAssistantMessage], updatedAt: new Date() } : conv));
    } catch (error) {
        console.error('Error regenerating response:', error);
        const errorMessage: Message = { id: generateId(), content: `Sorry, an error occurred while regenerating. Error: ${error instanceof Error ? error.message : 'Unknown error'}`, role: 'assistant', timestamp: new Date() };
        setConversations(prev => prev.map(conv => conv.id === currentConversationId ? { ...conv, messages: [...history, errorMessage] } : conv));
    } finally {
        setStreamingMessage(null);
        setIsChatLoading(false);
        stopStreamingRef.current = false;
    }
  };
  
  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      const remaining = sortedConversations.filter(c => c.id !== id);
      const newId = remaining.length > 0 ? remaining[0].id : null;
      if (newId) {
        handleSelectConversation(newId)
      } else {
        setCurrentConversationId(null);
      }
    }
  };
  const handleRenameConversation = (id: string, newTitle: string) => setConversations(prev => prev.map(c => (c.id === id ? { ...c, title: newTitle, updatedAt: new Date() } : c)));
  const handleTogglePinConversation = (id: string) => setConversations(prev => prev.map(c => (c.id === id ? { ...c, isPinned: !c.isPinned, updatedAt: new Date() } : c)));
  const handleSaveSettings = (newSettings: APISettings) => { setSettings(newSettings); storageUtils.saveSettings(newSettings); setSettingsOpen(false); };
  const handleInstallApp = async () => { if (await installApp()) console.log('App installed'); };
  const handleStopGenerating = () => stopStreamingRef.current = true;

  const sortedConversations = useMemo(() => [...conversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }), [conversations]);
  const sortedNotes = useMemo(() => [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [notes]);

  return (
    <div className="h-[100dvh] flex bg-[var(--color-bg)] text-[var(--color-text-primary)] relative">
      <Sidebar
        conversations={sortedConversations}
        notes={sortedNotes}
        activeView={activeView}
        currentConversationId={currentConversationId}
        currentNoteId={currentNoteId}
        onNewConversation={handleNewConversation}
        onNewPersonaConversation={handleNewPersonaConversation}
        onSelectConversation={handleSelectConversation}
        onSelectNote={handleSelectNote}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        onDeleteNote={handleDeleteNote}
        onOpenSettings={() => setSettingsOpen(true)}
        settings={settings}
        onModelChange={handleModelChange}
        onCloseSidebar={() => setSidebarOpen(false)}
        isFolded={sidebarFolded}
        onToggleFold={() => setSidebarFolded(!sidebarFolded)}
        isSidebarOpen={sidebarOpen}
      />

      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} className="fixed top-4 left-4 p-2.5 bg-[var(--color-card)] rounded-lg z-50 shadow-md hover:bg-[var(--color-border)] transition-colors" title="Open sidebar">
          <Menu className="w-6 h-6 text-[var(--color-text-secondary)]" />
        </button>
      )}

      {activeView === 'chat' ? (
        <ChatArea
          conversation={currentConversation}
          onSendMessage={handleSendMessage}
          isLoading={isChatLoading}
          isQuizLoading={isQuizLoading}
          streamingMessage={streamingMessage}
          hasApiKey={hasApiKey}
          onStopGenerating={handleStopGenerating}
          onSaveAsNote={handleSaveAsNote}
          onGenerateQuiz={handleGenerateQuiz}
          onEditMessage={handleEditMessage}
          onRegenerateResponse={handleRegenerateResponse}
        />
      ) : (
        <NoteView note={currentNote} />
      )}

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onSaveSettings={handleSaveSettings} isSidebarFolded={sidebarFolded} isSidebarOpen={sidebarOpen} />
      <QuizModal isOpen={isQuizModalOpen} onClose={() => setIsQuizModalOpen(false)} session={studySession} />
      {isInstallable && !isInstalled && <InstallPrompt onInstall={handleInstallApp} onDismiss={dismissInstallPrompt} />}
    </div>
  );
}

export default App;
