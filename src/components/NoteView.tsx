import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Note } from '../types';
import { formatDate } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext'; // Import the hook

interface NoteViewProps {
  note: Note | null;
}
// ...
export function NoteView({ note }: NoteViewProps) {
  const { logoSrc } = useTheme(); // Get logoSrc from context
  // ...
  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full px-4">
          <img
            src={logoSrc} // Use dynamic logoSrc
            alt="AI Tutor Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 opacity-50"
          />
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Select a note to view
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Choose a note from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }
  // ... (rest of component is unchanged)
}
