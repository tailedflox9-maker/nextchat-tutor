import React from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { InstallPrompt } from './components/InstallPrompt';
import { Conversation, Message, APISettings } from './types';
import { aiService } from './services/aiService';
import { storageUtils } from './utils/storage';
import { generateId, generateConversationTitle } from './utils/helpers';
import { usePWA } from './hooks/usePWA';
import { Menu } from 'lucide-react';
import { LanguageContext } from './contexts/LanguageContext';

const defaultSettings: APISettings = {
  googleApiKey: '',
  zhipuApiKey: '',
  mistralApiKey: '',
  selectedModel: 'google',
};

function App() {
  const { selectedLanguage } = React.useContext(LanguageContext);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [settings, setSettings] = React.useState<APISettings>(defaultSettings);
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamingMessage, setStreamingMessage] = React.useState<Message | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(window.innerWidth >= 768);
  const [sidebarFolded, setSidebarFolded] = React.useState(false);
  const stopStreamingRef = React.useRef(false);

  const { isInstallable, isInstalled, installApp, dismissInstallPrompt } = usePWA();

  React.useEffect(() => {
    const savedConversations = storageUtils.getConversations();
    const savedSettings = storageUtils.getSettings();
    setConversations(savedConversations);
    setSettings(savedSettings);
    if (savedConversations.length > 0) {
        // Initial sort to set the correct first conversation
      const sorted = [...savedConversations].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setCurrentConversationId(sorted[0].id);
    }
    aiService.updateSettings(savedSettings, selectedLanguage);

    const savedSidebarFolded = localStorage.getItem('ai-tutor-sidebar-folded');
    if (savedSidebarFolded) {
      setSidebarFolded(JSON.parse(savedSidebarFolded));
    }
  }, [selectedLanguage]);

  React.useEffect(() => {
    storageUtils.saveConversations(conversations);
  }, [conversations]);

  React.useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    localStorage.setItem('ai-tutor-sidebar-folded', JSON.stringify(sidebarFolded));
  }, [sidebarFolded]);

  const handleModelChange = (model: 'google' | 'zhipu' | 'mistral-small' | 'mistral-codestral') => {
    const newSettings = { ...settings, selectedModel: model };
    setSettings(newSettings);
    storageUtils.saveSettings(newSettings);
    aiService.updateSettings(newSettings, selectedLanguage);
  };

  const handleToggleSidebarFold = () => {
    setSidebarFolded(!sidebarFolded);
  };

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const hasApiKey = settings.googleApiKey || settings.zhipuApiKey || settings.mistralApiKey;

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: selectedLanguage === 'en' ? 'New Chat' : 'नवीन चॅट',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteConversation = (id: string) => {
    const remaining = conversations.filter(c => c.id !== id);
    setConversations(remaining);
    if (currentConversationId === id) {
      const sortedRemaining = [...remaining].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setCurrentConversationId(sortedRemaining.length > 0 ? sortedRemaining[0].id : null);
    }
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, title: newTitle, updatedAt: new Date() } : c))
    );
  };

  const handleTogglePinConversation = (id: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  const sortedConversations = React.useMemo(() => {
    return [...conversations].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [conversations]);

  const handleSaveSettings = (newSettings: APISettings) => {
    setSettings(newSettings);
    storageUtils.saveSettings(newSettings);
    aiService.updateSettings(newSettings, selectedLanguage);
    setIsSettingsOpen(false);
  };

  const handleInstallApp = async () => {
    const success = await installApp();
    if (success) {
      console.log('App installed successfully');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!hasApiKey) {
      setIsSettingsOpen(true);
      return;
    }

    let conversationToUpdate: Conversation | undefined;
    let targetId = currentConversationId;

    if (!targetId) {
      const newConversation: Conversation = {
        id: generateId(),
        title: generateConversationTitle(content),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations(prev => [newConversation, ...prev]);
      targetId = newConversation.id;
      setCurrentConversationId(targetId);
      conversationToUpdate = newConversation;
    } else {
      conversationToUpdate = conversations.find(c => c.id === targetId);
    }
    
    if (!conversationToUpdate) return;

    const userMessage: Message = { id: generateId(), content, role: 'user', timestamp: new Date() };
    
    const updatedConversation = {
      ...conversationToUpdate,
      messages: [...conversationToUpdate.messages, userMessage],
      title: conversationToUpdate.messages.length === 0 ? generateConversationTitle(content) : conversationToUpdate.title,
      updatedAt: new Date(),
    };

    setConversations(prev => prev.map(c => (c.id === targetId ? updatedConversation : c)));

    setIsLoading(true);
    stopStreamingRef.current = false;
    
    try {
      const assistantMessage: Message = { id: generateId(), content: '', role: 'assistant', timestamp: new Date(), model: settings.selectedModel };
      setStreamingMessage(assistantMessage);

      const historyForAPI = updatedConversation.messages.map(msg => ({ role: msg.role, content: msg.content }));

      let fullResponse = '';
      for await (const chunk of aiService.generateStreamingResponse(historyForAPI, selectedLanguage)) {
        if (stopStreamingRef.current) break;
        fullResponse += chunk;
        setStreamingMessage(prev => prev ? { ...prev, content: fullResponse } : null);
      }

      const finalAssistantMessage: Message = { ...assistantMessage, content: fullResponse };
      
      setConversations(prev => prev.map(c => {
        if (c.id === targetId) {
          return { ...c, messages: [...c.messages, finalAssistantMessage], updatedAt: new Date() };
        }
        return c;
      }));
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
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
    if (!currentConversation) return;

    const messageIndex = currentConversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const historyToRegenerate = currentConversation.messages.slice(0, messageIndex);
    
    setConversations(prev => prev.map(c => (c.id === currentConversationId ? { ...c, messages: historyToRegenerate } : c)));

    setIsLoading(true);
    stopStreamingRef.current = false;
    
    try {
      const assistantMessage: Message = { id: generateId(), content: '', role: 'assistant', timestamp: new Date(), model: settings.selectedModel };
      setStreamingMessage(assistantMessage);

      const historyForAPI = historyToRegenerate.map(msg => ({ role: msg.role, content: msg.content }));

      let fullResponse = '';
      for await (const chunk of aiService.generateStreamingResponse(historyForAPI, selectedLanguage)) {
        if (stopStreamingRef.current) break;
        fullResponse += chunk;
        setStreamingMessage(prev => prev ? { ...prev, content: fullResponse } : null);
      }

      const finalAssistantMessage: Message = { ...assistantMessage, content: fullResponse };
      
      setConversations(prev => prev.map(c => {
        if (c.id === currentConversationId) {
          return { ...c, messages: [...historyToRegenerate, finalAssistantMessage], updatedAt: new Date() };
        }
        return c;
      }));
    } catch (error) {
      console.error('Error regenerating response:', error);
    } finally {
      setIsLoading(false);
      setStreamingMessage(null);
      stopStreamingRef.current = false;
    }
  };

  const handleStopGenerating = () => {
    stopStreamingRef.current = true;
  };

  return (
    <div className="h-screen flex bg-[var(--color-bg)] text-[var(--color-text-primary)] relative">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        isSidebarFolded={sidebarFolded}
        isSidebarOpen={sidebarOpen}
      />
      
      {sidebarOpen && (
        <Sidebar
          conversations={sortedConversations}
          currentConversationId={currentConversationId}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onTogglePinConversation={handleTogglePinConversation}
          onOpenSettings={() => setIsSettingsOpen(true)}
          settings={settings}
          onModelChange={handleModelChange}
          onCloseSidebar={() => setSidebarOpen(false)}
          isFolded={sidebarFolded}
          onToggleFold={handleToggleSidebarFold}
        />
      )}

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 p-2 bg-[var(--color-card)] rounded-lg z-50 shadow-md hover:bg-[var(--color-border)] transition-colors"
          title={selectedLanguage === 'en' ? 'Open sidebar' : 'साइडबार उघडा'}
        >
          <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </button>
      )}

      <ChatArea
        messages={currentConversation?.messages || []}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        streamingMessage={streamingMessage}
        hasApiKey={hasApiKey}
        model={settings.selectedModel}
        onEditMessage={handleEditMessage}
        onRegenerateResponse={handleRegenerateResponse}
        onStopGenerating={handleStopGenerating}
      />

      {isInstallable && !isInstalled && (
        <InstallPrompt
          onInstall={handleInstallApp}
          onDismiss={dismissInstallPrompt}
        />
      )}
    </div>
  );
}

export default App;
