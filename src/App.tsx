import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import { Conversation, Message, APISettings } from './types';
import AIService from './services/aiService';
import { saveConversations, loadConversations, saveSettings, loadSettings } from './utils/storage';
import { generateId, generateConversationTitle } from './utils/helpers';

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<APISettings>(loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarFolded, setSidebarFolded] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'mr'>('en');

  const aiService = new AIService(settings);

  useEffect(() => {
    try {
      const savedSidebarFolded = localStorage.getItem('ai-tutor-sidebar-folded');
      if (savedSidebarFolded) {
        setSidebarFolded(JSON.parse(savedSidebarFolded));
      }
    } catch (error) {
      console.error('Error loading sidebar folded state:', error);
      setSidebarFolded(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-tutor-sidebar-folded', JSON.stringify(sidebarFolded));
  }, [sidebarFolded]);

  useEffect(() => {
    saveConversations(conversations);
    if (currentConversationId) {
      const currentConversation = conversations.find(conv => conv.id === currentConversationId);
      setMessages(currentConversation ? currentConversation.messages : []);
    } else {
      setMessages([]);
    }
  }, [conversations, currentConversationId]);

  useEffect(() => {
    saveSettings(settings);
    aiService.updateSettings(settings);
  }, [settings]);

  const handleSendMessage = useCallback(async (content: string, file?: File) => {
    let targetConversationId = currentConversationId;
    if (!targetConversationId) {
      const newConversation: Conversation = {
        id: generateId(),
        title: generateConversationTitle(content),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
      };
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(newConversation.id);
      targetConversationId = newConversation.id;
    }

    const userMessage: Message = {
      id: generateId(),
      content,
      role: 'user',
      createdAt: new Date(),
      model: settings.model,
      file: file ? await file.text() : undefined,
    };

    setConversations(prev =>
      prev.map(conv =>
        conv.id === targetConversationId
          ? { ...conv, messages: [...conv.messages, userMessage], updatedAt: new Date() }
          : conv
      )
    );
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const stream = await aiService.generateResponse(userMessage.content, settings.model);
      let assistantMessage: Message = {
        id: generateId(),
        content: '',
        role: 'assistant',
        createdAt: new Date(),
        model: settings.model,
      };

      setStreamingMessage(assistantMessage);

      for await (const chunk of stream) {
        assistantMessage = {
          ...assistantMessage,
          content: assistantMessage.content + chunk,
        };
        setStreamingMessage({ ...assistantMessage });
      }

      setConversations(prev =>
        prev.map(conv =>
          conv.id === targetConversationId
            ? { ...conv, messages: [...conv.messages, assistantMessage], updatedAt: new Date() }
            : conv
        )
      );
      setMessages(prev => [...prev, assistantMessage]);
      setStreamingMessage(null);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: generateId(),
        content: selectedLanguage === 'en' ? 'Error generating response' : 'प्रतिसाद तयार करताना त्रुटी',
        role: 'assistant',
        createdAt: new Date(),
        model: settings.model,
      };
      setConversations(prev =>
        prev.map(conv =>
          conv.id === targetConversationId
            ? { ...conv, messages: [...conv.messages, errorMessage], updatedAt: new Date() }
            : conv
        )
      );
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId, settings, selectedLanguage]);

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setStreamingMessage(null);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setMessages([]);
      setStreamingMessage(null);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === id ? { ...conv, title: newTitle, updatedAt: new Date() } : conv
      )
    );
  };

  const handleTogglePinConversation = (id: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === id ? { ...conv, isPinned: !conv.isPinned } : conv
      )
    );
  };

  const handleModelChange = (model: string) => {
    setSettings(prev => ({ ...prev, model }));
  };

  const handleImportConversations = (importedConversations: Conversation[]) => {
    setConversations(prev => [...importedConversations, ...prev]);
  };

  const handleExportConversations = () => {
    const dataStr = JSON.stringify(conversations);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'ai-tutor-conversations.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleSettingsUpdate = (newSettings: Partial<APISettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleSidebar = () => {
    setSidebarFolded(prev => !prev);
  };

  const sidebarWidth = sidebarFolded ? 'w-16' : 'w-64';

  return (
    <div className="flex h-screen bg-[var(--color-background)]">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePinConversation}
        onModelChange={handleModelChange}
        onImportConversations={handleImportConversations}
        onExportConversations={handleExportConversations}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        folded={sidebarFolded}
        toggleSidebar={toggleSidebar}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarFolded ? 'ml-16' : 'ml-64'}`}>
        <ChatArea
          messages={messages}
          streamingMessage={streamingMessage}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          selectedLanguage={selectedLanguage}
        />
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="fixed bottom-4 right-4 p-3 bg-[var(--color-primary)] text-[var(--color-button-text)] rounded-full shadow-lg hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          {selectedLanguage === 'en' ? 'Settings' : 'सेटिंग्ज'}
        </button>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onUpdateSettings={handleSettingsUpdate}
          selectedLanguage={selectedLanguage}
          sidebarWidth={sidebarWidth}
        />
      </div>
    </div>
  );
};

export default App;
