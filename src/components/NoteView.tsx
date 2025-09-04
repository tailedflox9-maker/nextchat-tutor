import React, { useMemo, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Note } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import { formatDate } from '../utils/helpers';

interface NoteViewProps {
  note: Note | null;
}

const CodeBlock = React.memo(({ language, children }: { language: string; children: string; }) => {
  const codeContent = String(children).replace(/\n$/, '');
  return (
    <SyntaxHighlighter style={vscDarkPlus} language={language} PreTag="div" className="!bg-[#121212] rounded-md !p-4">
      {codeContent}
    </SyntaxHighlighter>
  );
});

export function NoteView({ note }: NoteViewProps) {
  const { selectedLanguage } = useContext(LanguageContext);
  
  const markdownComponents = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <CodeBlock language={match[1]} children={String(children)} />
      ) : (
        <code className="bg-[var(--color-bg)] px-1.5 py-0.5 rounded text-sm" {...props}>
          {children}
        </code>
      );
    },
  }), []);

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Select a note to view</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--color-bg)] overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 w-full">
        <div className="mb-6 pb-4 border-b border-[var(--color-border)]">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">{note.title}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Saved on: {formatDate(note.createdAt)}</p>
        </div>
        <div className="prose prose-invert prose-lg max-w-none leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {note.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
