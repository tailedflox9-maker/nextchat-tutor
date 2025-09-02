import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { Send, PlusCircle, Square } from 'lucide-react';
import { LanguageContext } from '../contexts/LanguageContext';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  onStopGenerating: () => void;
}

export function ChatInput({ onSendMessage, isLoading, disabled = false, onStopGenerating }: ChatInputProps) {
  const { selectedLanguage } = useContext(LanguageContext);
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [input, isLoading, disabled, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const resizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  const canSend = input.trim() && !disabled;

  return (
    <div className="relative">
      {isLoading && (
        <div className="flex justify-center mb-2">
          <button
            onClick={onStopGenerating}
            className="flex items-center gap-2 px-4 py-1.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-gray-600 transition-all"
          >
            <Square className="w-3 h-3" /> Stop generating
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end w-full p-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl">
          <button type="button" className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <PlusCircle className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? selectedLanguage === 'en' ? 'Configure API keys first...' : 'प्रथम API की कॉन्फिगर करा...'
                : selectedLanguage === 'en' ? 'Ask anything...' : 'काहीही विचारा...'
            }
            disabled={disabled || isLoading}
            className="flex-1 min-h-[24px] max-h-[120px] p-2 bg-transparent resize-none focus:outline-none disabled:bg-transparent disabled:text-[var(--color-text-placeholder)] text-[var(--color-text-primary)] placeholder-[var(--color-text-placeholder)] font-normal"
            rows={1}
            style={{ scrollbarWidth: 'none' }}
          />
          <div className="self-stretch flex items-end pb-0.5">
            <button
              type="submit"
              disabled={!canSend || isLoading}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 transform ${
                !canSend || isLoading
                  ? 'bg-transparent text-[var(--color-text-placeholder)] cursor-not-allowed scale-95'
                  : 'bg-[var(--color-text-primary)] text-[var(--color-bg)] hover:bg-[var(--color-accent-bg-hover)] scale-100 hover:scale-105 active:scale-95'
              }`}
              title={selectedLanguage === 'en' ? 'Send message' : 'संदेश पाठवा'}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
