import React, { useEffect, useRef, useState, useContext, useCallback, useMemo } from 'react';
import { Sparkles, Info, ArrowDown } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Conversation, Message } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';

interface ChatAreaProps {
  conversation: Conversation | undefined;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  streamingMessage?: Message | null;
  hasApiKey: boolean;
  model?: 'google' | 'zhipu' | 'mistral-small' | 'mistral-codestral';
  onEditMessage?: (messageId: string, newContent: string) => void;
  onRegenerateResponse?: (messageId: string) => void;
  onStopGenerating: () => void;
}

const SkeletonMessageBubble = React.memo(() => (
  <div className="flex gap-4 mb-6 justify-start animate-pulse">
    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-card)]">
      <Sparkles className="w-4 h-4 text-[var(--color-text-secondary)]" />
    </div>
    <div className="relative max-w-[85%] bg-[var(--color-card)] p-4 rounded-xl w-full">
      <div className="space-y-2">
        <div className="h-4 bg-[var(--color-border)] rounded w-3/4 animate-shimmer"></div>
        <div className="h-4 bg-[var(--color-border)] rounded w-1/2 animate-shimmer"></div>
      </div>
    </div>
  </div>
));

const PersonaInfo = React.memo(({ conversation, selectedLanguage }: { 
  conversation: Conversation; 
  selectedLanguage: 'en' | 'mr'; 
}) => (
  <div className="p-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl mb-6 animate-fade-in-up will-change-transform">
    <div className="flex items-center gap-2 mb-2">
      <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
      <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">
        {selectedLanguage === 'en' ? 'Active Persona' : 'सक्रिय Persona'}
      </h4>
    </div>
    <p className="text-sm text-[var(--color-text-secondary)] italic leading-relaxed max-h-20 overflow-y-auto">
      "{conversation.systemPrompt}"
    </p>
  </div>
));

const ScrollToBottomButton = React.memo(({ 
  show, 
  onClick, 
  selectedLanguage 
}: { 
  show: boolean; 
  onClick: () => void; 
  selectedLanguage: 'en' | 'mr'; 
}) => (
  <button
    onClick={onClick}
    className={`fixed bottom-24 right-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 z-10 hover:scale-105 will-change-transform ${
      show
        ? 'opacity-100 translate-y-0 pointer-events-auto'
        : 'opacity-0 translate-y-4 pointer-events-none'
    }`}
    aria-label={selectedLanguage === 'en' ? 'Scroll to bottom' : 'खाली स्क्रोल करा'}
  >
    <ArrowDown className="w-5 h-5 text-[var(--color-text-secondary)]" />
  </button>
));

export function ChatArea({
  conversation,
  onSendMessage,
  isLoading,
  streamingMessage,
  hasApiKey,
  model,
  onEditMessage,
  onRegenerateResponse,
  onStopGenerating,
}: ChatAreaProps) {
  const { selectedLanguage } = useContext(LanguageContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const lastScrollTop = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const isScrollingRef = useRef(false);

  // Memoize messages to prevent unnecessary re-renders
  const messages = useMemo(() => conversation?.messages || [], [conversation?.messages]);
  
  // Memoize all messages including streaming
  const allMessages = useMemo(() => 
    streamingMessage ? [...messages, streamingMessage] : messages, 
    [messages, streamingMessage]
  );

  // Optimized scroll to bottom with requestAnimationFrame
  const scrollToBottom = useCallback((smooth = true) => {
    if (isScrollingRef.current) return;
    
    isScrollingRef.current = true;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
      
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    });
  }, []);

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || isScrollingRef.current) return;

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Throttle scroll handling
    scrollTimeoutRef.current = setTimeout(() => {
      if (!messagesContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100; // Increased threshold
      const scrollingUp = scrollTop < lastScrollTop.current && scrollTop > 0;

      if (scrollingUp && !isAtBottom) {
        setUserScrolled(true);
        setShowScrollToBottom(true);
      }

      if (isAtBottom) {
        setUserScrolled(false);
        setShowScrollToBottom(false);
      }

      lastScrollTop.current = scrollTop;
    }, 50); // Throttle to 50ms
  }, []);

  // Auto-scroll when new messages arrive or content changes
  useEffect(() => {
    if (!userScrolled && !isScrollingRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      const scrollTimeout = setTimeout(() => {
        scrollToBottom(false); // Don't animate for streaming content
      }, 50);
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [allMessages.length, streamingMessage?.content, userScrolled, scrollToBottom]);

  // Reset scroll state when conversation changes
  useEffect(() => {
    if (messages.length === 0) {
      setUserScrolled(false);
      setShowScrollToBottom(false);
    }
  }, [messages.length]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Handle scroll to bottom button click
  const handleScrollToBottomClick = useCallback(() => {
    setUserScrolled(false);
    scrollToBottom(true);
  }, [scrollToBottom]);

  const showSkeleton = isLoading && allMessages.length > 0 && !streamingMessage;

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-bg)] relative will-change-transform">
      {allMessages.length === 0 && !isLoading && !conversation ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md w-full">
            <div className="w-24 h-24 bg-[var(--color-card)] rounded-full flex items-center justify-center mx-auto mb-6 p-4">
              <img src="/white-logo.png" alt="AI Tutor Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-5xl font-bold text-[var(--color-text-primary)] mb-4">
              {selectedLanguage === 'en' ? 'AI Tutor' : 'एआय शिक्षक'}
            </h2>
            {!hasApiKey && (
              <div className="bg-yellow-900/50 border border-yellow-700/50 rounded-lg p-4 text-left mt-6">
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
          className="flex-1 overflow-y-auto scroll-smooth" 
          onScroll={handleScroll}
          style={{ 
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch' // Better iOS scrolling
          }}
        >
          <div className="max-w-3xl mx-auto px-4 py-6 pt-8">
            {conversation?.isPersona && conversation.systemPrompt && (
              <PersonaInfo 
                conversation={conversation} 
                selectedLanguage={selectedLanguage} 
              />
            )}
            
            {/* Messages container with stable layout */}
            <div className="space-y-6">
              {allMessages.map((message) => (
                <div key={message.id} className="will-change-transform">
                  <MessageBubble
                    message={message}
                    isStreaming={streamingMessage?.id === message.id}
                    model={model}
                    onEditMessage={onEditMessage}
                    onRegenerateResponse={onRegenerateResponse}
                  />
                </div>
              ))}
              
              {showSkeleton && (
                <div className="will-change-transform">
                  <SkeletonMessageBubble />
                </div>
              )}
            </div>
          </div>
          
          {/* Stable scroll anchor */}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      )}

      <ScrollToBottomButton
        show={showScrollToBottom}
        onClick={handleScrollToBottomClick}
        selectedLanguage={selectedLanguage}
      />

      <div className="p-4 bg-[var(--color-bg)] border-t border-[var(--color-border)]">
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
