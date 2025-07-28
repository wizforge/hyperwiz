import React from 'react';

interface CodeSnippetProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

export default function CodeSnippet({ code, language = 'typescript', title, className = '' }: CodeSnippetProps) {
  return (
    <div className={`code-snippet ${className}`}>
      <div className="code-header">
        <div className="code-dots">
          <div className="code-dot red"></div>
          <div className="code-dot yellow"></div>
          <div className="code-dot green"></div>
        </div>
        <span className="code-label">{title || language}</span>
      </div>
      <div className="code-content">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
} 