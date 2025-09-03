import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InstallPrompt } from './components/InstallPrompt';
import { SettingsModal } from './components/SettingsModal';
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
  const { selectedLanguage } = useContext(LanguageContext);
  // --- START: Synchronous state initialization from localStorage to prevent UI flash ---
  const [initialConversations] = useState(() => storageUtils.getConversations());
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [settings, setSettings] = useState<APISettings>(() => storageUtils.getSettings());
  
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    if (initialConversations.length > 0) {
      // Sort to find the most recent/pinned conversation to display first, same logic as in useMemo
      const sorted = [...initialConversations].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      return sorted[0].id;
    }
    return null;
  });
  const [sidebarFolded, setSidebarFolded] = useState(() => {
      const saved = localStorage.getItem('ai-tutor-sidebar-folded');
      return saved ? JSON.parse(saved) : false;
  });
  // --- END: Synchronous state initialization ---
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const stopStreamingRef = useRef(false);
  const { isInstallable, isInstalled, installApp, dismissInstallPrompt } = usePWA();

  // --- START: Refactored useEffect hooks ---
  useEffect(() => {
    // Update the AI service when settings or language change.
    aiService.updateSettings(settings, selectedLanguage);
  }, [settings, selectedLanguage]);

  useEffect(() => {
    // Save conversations to localStorage whenever they are modified.
    storageUtils.saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    // Handle window resize for sidebar visibility.
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Save the sidebar folded state to localStorage.
    localStorage.setItem('ai-tutor-sidebar-folded', JSON.stringify(sidebarFolded));
  }, [sidebarFolded]);
  // --- END: Refactored useEffect hooks ---

  const handleModelChange = (model: 'google' | 'zhipu' | 'mistral-small' | 'mistral-codestral') => {
    const newSettings = { ...settings, selectedModel: model };
    setSettings(newSettings);
    storageUtils.saveSettings(newSettings);
    aiService.updateSettings(newSettings, selectedLanguage);
  };

  const handleToggleSidebarFold = () => {
    setSidebarFolded(!sidebarFolded);
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
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
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
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
      prev.map(c => (c.id === id ? { ...c, isPinned: !c.isPinned, updatedAt: new Date() } : c))
    );
  };

  const handleSaveSettings = (newSettings: APISettings) => {
    setSettings(newSettings);
    storageUtils.saveSettings(newSettings);
    aiService.updateSettings(newSettings, selectedLanguage);
    setSettingsOpen(false);
  };

  const handleInstallApp = async () => {
    const success = await installApp();
    if (success) {
      console.log('App installed successfully');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!hasApiKey) {
      alert(selectedLanguage === 'en' ? 'Please set your API key in the settings first.' : 'कृपया प्रथम सेटिंग्जमध्ये तुमची API की सेट करा.');
      return;
    }

    let conversationToUpdate = currentConversation;
    let targetConversationId = currentConversationId;

    if (!conversationToUpdate) {
      const newConversation: Conversation = {
        id: generateId(),
        title: generateConversationTitle(content),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations(prev => [newConversation, ...prev]);
      conversationToUpdate = newConversation;
      targetConversationId = newConversation.id;
      setCurrentConversationId(newConversation.id);
    }

    const userMessage: Message = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    // Optimistic UI update
    setConversations(prev => prev.map(conv => {
      if (conv.id === targetConversationId) {
        const updatedTitle = conv.messages.length === 0 && !conv.isPersona ? generateConversationTitle(content) : conv.title;
        return {
          ...conv,
          title: updatedTitle,
          messages: [...conv.messages, userMessage],
          updatedAt: new Date(),
        };
      }
      return conv;
    }));

    setIsLoading(true);
    stopStreamingRef.current = false;

    try {
      const messagesForApi = [...conversationToUpdate.messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const assistantMessage: Message = {
        id: generateId(),
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        model: settings.selectedModel,
      };

      setStreamingMessage(assistantMessage);
      let fullResponse = '';
      for await (const chunk of aiService.generateStreamingResponse(messagesForApi, selectedLanguage, conversationToUpdate.systemPrompt)) {
        if (stopStreamingRef.current) {
          break;
        }
        fullResponse += chunk;
        setStreamingMessage(prev => prev ? { ...prev, content: fullResponse } : null);
      }

      const finalAssistantMessage: Message = {
        ...assistantMessage,
        content: fullResponse,
      };

      // **FIXED**: Update state based on the previous state, not a stale copy.
      setConversations(prev => prev.map(conv => {
        if (conv.id === targetConversationId) {
          // The optimistic update already added the user message. We only add the assistant's final message.
          const finalMessages = conv.messages.filter(m => m.id !== userMessage.id); // Ensure user message isn't duplicated in case of race conditions
          return {
            ...conv,
            messages: [...finalMessages, userMessage, finalAssistantMessage],
            updatedAt: new Date(),
          };
        }
        return conv;
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: generateId(),
        content: selectedLanguage === 'en'
          ? `Sorry, an error occurred. Please check your API key and network connection. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          : `क्षमस्व, एक त्रुटी आली. कृपया तुमची API की आणि नेटवर्क कनेक्शन तपासा. त्रुटी: ${error instanceof Error ? error.message : 'अज्ञात त्रुटी'}`,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      // **FIXED**: Same logic for the error message.
      setConversations(prev => prev.map(conv => {
        if (conv.id === targetConversationId) {
          return { ...conv, messages: [...conv.messages, errorMessage] };
        }
        return conv;
      }));

    } finally {
      setStreamingMessage(null);
      setIsLoading(false);
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
    if (messageIndex <= 0) return;

    const messagesToResend = currentConversation.messages.slice(0, messageIndex);
    const targetConversationId = currentConversation.id;

    // First, update the conversation to remove the old response.
    setConversations(prev => prev.map(conv => {
      if (conv.id === targetConversationId) {
        return {
          ...conv,
          messages: messagesToResend,
          updatedAt: new Date(),
        };
      }
      return conv;
    }));

    setIsLoading(true);
    stopStreamingRef.current = false;

    try {
      const assistantMessage: Message = {
        id: generateId(),
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        model: settings.selectedModel,
      };
      setStreamingMessage(assistantMessage);

      const messagesForApi = messagesToResend.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      let fullResponse = '';
      for await (const chunk of aiService.generateStreamingResponse(messagesForApi, selectedLanguage, currentConversation.systemPrompt)) {
        if (stopStreamingRef.current) {
          break;
        }
        fullResponse += chunk;
        setStreamingMessage(prev => prev ? { ...prev, content: fullResponse } : null);
      }

      const finalAssistantMessage: Message = {
        ...assistantMessage,
        content: fullResponse,
      };

      // **FIXED**: Base the final update on the most recent state (`conv.messages`)
      setConversations(prev => prev.map(conv => {
        if (conv.id === targetConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, finalAssistantMessage],
            updatedAt: new Date(),
          };
        }
        return conv;
      }));

    } catch (error) {
      console.error('Error regenerating response:', error);
      const errorMessage: Message = {
        id: generateId(),
        content: selectedLanguage === 'en'
          ? `Sorry, an error occurred while regenerating. Please check your API key. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          : `क्षमस्व, प्रतिसाद पुन्हा तयार करताना त्रुटी आली. कृपया तुमची API की तपासा. त्रुटी: ${error instanceof Error ? error.message : 'अज्ञात त्रुटी'}`,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      // **FIXED**: Same correction for the catch block.
      setConversations(prev => prev.map(conv => {
        if (conv.id === targetConversationId) {
          return { ...conv, messages: [...conv.messages, errorMessage] };
        }
        return conv;
      }));

    } finally {
      setStreamingMessage(null);
      setIsLoading(false);
      stopStreamingRef.current = false;
    }
  };

  const handleStopGenerating = () => {
    stopStreamingRef.current = true;
  };

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [conversations]);

  return (
    <div className="h-screen flex bg-[var(--color-bg)] text-[var(--color-text-primary)] relative">
      {sidebarOpen && (
        <Sidebar
          conversations={sortedConversations}
          currentConversationId={currentConversationId}
          onNewConversation={handleNewConversation}
          onNewPersonaConversation={handleNewPersonaConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onTogglePinConversation={handleTogglePinConversation}
          onOpenSettings={handleOpenSettings}
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
          className="fixed top-4 left-4 p-2.5 bg-[var(--color-card)] rounded-lg z-50 shadow-md hover:bg-[var(--color-border)] transition-colors"
          title={selectedLanguage === 'en' ? 'Open sidebar' : 'साइडबार उघडा'}
        >
          <Menu className="w-6 h-6 text-[var(--color-text-secondary)]" />
        </button>
      )}
      <ChatArea
        conversation={currentConversation}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        streamingMessage={streamingMessage}
        hasApiKey={hasApiKey}
        model={settings.selectedModel}
        onEditMessage={handleEditMessage}
        onRegenerateResponse={handleRegenerateResponse}
        onStopGenerating={handleStopGenerating}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={handleCloseSettings}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        isSidebarFolded={sidebarFolded}
        isSidebarOpen={sidebarOpen}
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
