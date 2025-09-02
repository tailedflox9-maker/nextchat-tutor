import React, { useEffect, useRef, useState, useContext } from 'react';
import { Bot } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Message } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  streamingMessage?: Message | null;
  hasApiKey: boolean;
  model?: 'google' | 'zhipu' | 'mistral-small' | 'mistral-codestral';
  onEditMessage?: (messageId: string, newContent: string) => void;
  onRegenerateResponse?: (messageId: string) => void;
  onStopGenerating: () => void;
}

export function ChatArea({ 
  messages, 
  onSendMessage, 
  isLoading, 
  streamingMessage, 
  hasApiKey,
  model,
  onEditMessage,
  onRegenerateResponse,
  onStopGenerating
}: ChatAreaProps) {
  const { selectedLanguage } = useContext(LanguageContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const lastScrollTop = useRef(0);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    const scrollingUp = scrollTop < lastScrollTop.current;
    
    if (scrollingUp && !isAtBottom) {
      setUserScrolled(true);
      setShowScrollToBottom(true);
    }
    
    if (isAtBottom) {
      setUserScrolled(false);
      setShowScrollToBottom(false);
    }
    
    lastScrollTop.current = scrollTop;
  };

  useEffect(() => {
    if (!userScrolled && (messages.length > 0 || streamingMessage)) {
      scrollToBottom();
    }
  }, [messages.length, streamingMessage?.content, userScrolled]);

  useEffect(() => {
    if (messages.length === 0) {
      setUserScrolled(false);
      setShowScrollToBottom(false);
    }
  }, [messages.length]);

  const allMessages = streamingMessage ? [...messages, streamingMessage] : messages;

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-bg)] relative">
      {allMessages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-[var(--color-card)] rounded-full flex items-center justify-center mx-auto mb-6">
              <Bot className="w-12 h-12 text-[var(--color-text-primary)]" />
            </div>
            <h2 className="text-5xl font-bold text-[var(--color-text-primary)] mb-4">
              {selectedLanguage === 'en' ? 'AI Tutor' : 'एआय शिक्षक'}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {selectedLanguage === 'en'
                ? "How can I help you today?"
                : 'मी तुम्हाला आज कशी मदत करू शकतो?'}
            </p>
            {!hasApiKey && (
              <div className="bg-yellow-900/50 border border-yellow-700/50 rounded-lg p-4 text-left">
                <p className="text-sm text-yellow-300">
                  <strong>{selectedLanguage === 'en' ? 'Setup Required:' : 'सेटअप आवश्यक:'}</strong>{' '}
                  {selectedLanguage === 'en'
                    ? 'Please configure your API keys in Settings to start chatting.'
                    : 'कृपया चॅटिंग सुरू करण्यासाठी सेटिंग्जमध्ये आपली API की कॉन्फिगर करा.'}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
          style={{
            scrollBehavior: userScrolled ? 'auto' : 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="max-w-3xl mx-auto px-4 py-6 pt-20">
            {allMessages.map((message, index) => (
              <div
                key={message.id}
                className={`transition-all duration-300 ease-out ${
                  index === allMessages.length - 1 && streamingMessage?.id === message.id
                    ? 'animate-in slide-in-from-bottom-2'
                    : ''
                }`}
              >
                <MessageBubble
                  message={message}
                  isStreaming={streamingMessage?.id === message.id}
                  model={model}
                  onEditMessage={onEditMessage}
                  onRegenerateResponse={onRegenerateResponse}
                />
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </div>
      )}

      {showScrollToBottom && (
        <button
          onClick={() => {
            setUserScrolled(false);
            setShowScrollToBottom(false);
            scrollToBottom();
          }}
          className="absolute bottom-24 right-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 z-10 hover:scale-105"
          aria-label={selectedLanguage === 'en' ? 'Scroll to bottom' : 'खाली स्क्रोल करा'}
        >
          <svg
            className="w-4 h-4 text-[var(--color-text-secondary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      )}
      
      <div className="p-4 bg-[var(--color-bg)]">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            disabled={!hasApiKey}
            onStopGenerating={onStopGenerating}
          />
        </div>
      </div>
    </div>
  );
}
