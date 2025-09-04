import React, { useEffect, useRef, useState, useContext, useCallback, useMemo } from 'react';
import { Sparkles, ArrowDown, ClipboardCheck, Loader2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Conversation, Message } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';

interface ChatAreaProps {
  conversation: Conversation | undefined;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isQuizLoading: boolean;
  streamingMessage?: Message | null;
  hasApiKey: boolean;
  onStopGenerating: () => void;
  onSaveAsNote: (content: string) => void;
  onGenerateQuiz: () => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onRegenerateResponse?: (messageId: string) => void;
}

export function ChatArea({
  conversation,
  onSendMessage,
  isLoading,
  isQuizLoading,
  streamingMessage,
  hasApiKey,
  onStopGenerating,
  onSaveAsNote,
  onGenerateQuiz,
  onEditMessage,
  onRegenerateResponse,
}: ChatAreaProps) {
  const { selectedLanguage } = useContext(LanguageContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const allMessages = useMemo(() => 
    streamingMessage ? [...(conversation?.messages || []), streamingMessage] : conversation?.messages || [], 
    [conversation?.messages, streamingMessage]
  );
  
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [allMessages.length, streamingMessage?.content, scrollToBottom]);

  const canGenerateQuiz = conversation && conversation.messages.length > 2;

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-bg)] relative">
      {allMessages.length === 0 && !isLoading && !conversation ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md w-full">
            <img src="/white-logo.png" alt="AI Tutor Logo" className="w-24 h-24 mx-auto mb-6" />
            <h2 className="text-5xl font-bold text-[var(--color-text-primary)] mb-4">
              {selectedLanguage === 'en' ? 'AI Tutor' : 'एआय शिक्षक'}
            </h2>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 pt-8 relative">
            {canGenerateQuiz && (
              <div className="absolute top-2 right-4 z-10">
                <button 
                  onClick={onGenerateQuiz}
                  disabled={isQuizLoading || isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title={selectedLanguage === 'en' ? 'Generate Quiz' : 'प्रश्नोत्तरी तयार करा'}
                >
                  {isQuizLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ClipboardCheck className="w-4 h-4" />
                  )}
                  {selectedLanguage === 'en' ? 'Generate Quiz' : 'प्रश्नोत्तरी'}
                </button>
              </div>
            )}
            
            <div className="space-y-6 pt-12">
              {allMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isStreaming={streamingMessage?.id === message.id}
                  onSaveAsNote={onSaveAsNote}
                  onEditMessage={onEditMessage}
                  onRegenerateResponse={onRegenerateResponse}
                />
              ))}
            </div>
          </div>
          <div ref={messagesEndRef} className="h-1" />
        </div>
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
