import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Smile, Sparkles, Copy, Check, Edit2, RefreshCcw, Save, X } from 'lucide-react';
import { Message } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  model?: 'google' | 'zhipu' | 'mistral-small' | 'mistral-codestral';
  onEditMessage?: (messageId: string, newContent: string) => void;
  onRegenerateResponse?: (messageId: string) => void;
}

const modelNames = {
  google: { en: "Gemma", mr: "जेम्मा" },
  zhipu: { en: "Zhipu", mr: "झिपू" },
  'mistral-small': { en: "Misty", mr: "मिस्टी" },
  'mistral-codestral': { en: "Cody", mr: "कोडी" },
};

export function MessageBubble({
  message,
  isStreaming = false,
  model,
  onEditMessage,
  onRegenerateResponse
}: MessageBubbleProps) {
  const { selectedLanguage } = useContext(LanguageContext);
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isEditing, setIsEditing] = useState(message.isEditing || false);
  const [showActions, setShowActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();
  const displayModel = isUser ? undefined : (
    modelNames[message.model || model || 'google'][selectedLanguage]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [message.content]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditContent(message.content);
  }, [message.content]);

  const handleSaveEdit = useCallback(() => {
    if (editContent.trim() !== message.content && onEditMessage) {
      onEditMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  }, [editContent, message.content, message.id, onEditMessage]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content);
  }, [message.content]);

  const handleRegenerate = useCallback(() => {
    if (onRegenerateResponse) {
      onRegenerateResponse(message.id);
    }
  }, [message.id, onRegenerateResponse]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, editContent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={bubbleRef}
      className={`flex gap-4 mb-6 ${isUser ? 'justify-end' : 'justify-start'} group transition-all duration-300 ease-out`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-card)]">
          <Sparkles className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </div>
      )}
      <div
        className="relative max-w-[85%] bg-[var(--color-card)] p-4 rounded-xl"
      >
        {!isUser && displayModel && (
          <div className="text-sm text-[var(--color-text-primary)] mb-2 font-semibold">
            {displayModel}
          </div>
        )}
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full min-h-[120px] p-3 border border-[var(--color-border)] rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--color-bg)] text-[var(--color-text-primary)] font-normal"
              placeholder={selectedLanguage === 'en' ? 'Edit your message...' : 'आपला संदेश संपादित करा...'}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 px-3 py-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm"
              >
                <X className="w-3 h-3" />
                {selectedLanguage === 'en' ? 'Cancel' : 'रद्द करा'}
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                disabled={editContent.trim() === message.content || !editContent.trim()}
              >
                <Save className="w-3 h-3" />
                {selectedLanguage === 'en' ? 'Save' : 'जतन करा'}
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-placeholder)]">
              {selectedLanguage === 'en'
                ? 'Press Ctrl+Enter to save, Escape to cancel'
                : 'जतन करण्यासाठी Ctrl+Enter दाबा, रद्द करण्यासाठी Escape दाबा'}
            </p>
          </div>
        ) : (
          <div className={`prose prose-invert prose-base max-w-none leading-relaxed font-normal`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  if (!inline && match) {
                    const [copied, setCopied] = useState(false);
                    const codeContent = String(children).replace(/\n$/, '');
                    const handleCopy = () => {
                      navigator.clipboard.writeText(codeContent);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    };
                    return (
                      <div className="relative my-2 text-sm">
                        <div className="absolute right-2 top-2 flex items-center gap-2">
                           <span className="text-xs text-gray-400">{match[1]}</span>
                           <button
                              onClick={handleCopy}
                              className="p-1.5 bg-gray-800 rounded hover:bg-gray-700 text-gray-300"
                              title={selectedLanguage === 'en' ? 'Copy code' : 'कोड कॉपी करा'}
                           >
                              {copied ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                           </button>
                        </div>
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="!bg-[#121212] rounded-md !p-4"
                          {...props}
                        >
                          {codeContent}
                        </SyntaxHighlighter>
                      </div>
                    );
                  } else {
                    return (
                      <code className="bg-[var(--color-bg)] px-1.5 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    );
                  }
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-4">
                      <table className="border-collapse border border-[var(--color-border)] w-full">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="border border-[var(--color-border)] p-2 bg-[var(--color-sidebar)] font-semibold">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return <td className="border border-[var(--color-border)] p-2">{children}</td>;
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-2 bg-[var(--color-text-placeholder)] rounded-full animate-pulse ml-1"></span>
            )}
          </div>
        )}
        {!isEditing && !isStreaming && message.content.length > 0 && (
          <div className={`absolute -bottom-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
             <div className="flex gap-1 p-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg">
               {!isUser && onRegenerateResponse && (
                 <button
                   onClick={handleRegenerate}
                   className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1 rounded"
                   title={selectedLanguage === 'en' ? 'Regenerate response' : 'प्रतिसाद पुन्हा तयार करा'}
                 >
                   <RefreshCcw className="w-4 h-4" />
                 </button>
               )}
               {onEditMessage && (
                 <button
                   onClick={handleEdit}
                   className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1 rounded"
                   title={selectedLanguage === 'en' ? 'Edit message' : 'संदेश संपादित करा'}
                 >
                   <Edit2 className="w-4 h-4" />
                 </button>
               )}
               <button
                 onClick={handleCopy}
                 className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1 rounded"
                 title={selectedLanguage === 'en' ? 'Copy message' : 'संदेश कॉपी करा'}
               >
                 {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
               </button>
             </div>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-card)]">
          <Smile className="w-4 h-4 text-[var(--color-text-secondary)]" />
        </div>
      )}
    </div>
  );
}
