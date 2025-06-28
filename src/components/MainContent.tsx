import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; // Prism import (syntax highlighting)
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism'; // COOL Okaidia style for code blocks
import rehypeKatex from 'rehype-katex'; // math rendering
import remarkMath from 'remark-math'; // parsing math expressions
import remarkGfm from 'remark-gfm'; // for tables
import 'katex/dist/katex.min.css'; // katex math styles

const customSyntaxHighlighterStyle: any = {
  ...okaidia,
  'pre[class*="language-"]': {
    ...okaidia['pre[class*="language-"]'],
    background: '#272822', // dark bg for code blocks
  },
  'code[class*="language-"]': {
    ...okaidia['code[class*="language-"]'],
    background: '#272822',
  },
};

function sanitizeMarkdown(content: string): string {
  // clean up the markdown content to remove empty lines, code blocks etc
  // good  for remark gfm
  let sanitized = content.replace(/^\s*\|?\s*\|\s*\n/gm, '');
  sanitized = sanitized.replace(/```[\w-]*\s*```/g, '');
  sanitized = sanitized.replace(/```[\w-]*\n[\s\n]*```/g, '');
  sanitized = sanitized.replace(/```[\w-]*\n?([\s]*)```/g, '');

  return sanitized;
}

function MainContent({ className, content, loading }: { className?: string; content: string; loading: boolean }) {
  let safeContent = typeof content === 'string' ? sanitizeMarkdown(content) : '';
  let markdownRender;
  try {
    markdownRender = (
      <ReactMarkdown
        className="markdown-content"
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]} 
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={customSyntaxHighlighterStyle} // custom style for code blocks
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {safeContent}
      </ReactMarkdown>
    );
  } catch (err) {
    markdownRender = (
      <div className="text-red-500">
        Error rendering markdown content.
      </div>
    );
  }

  return (
    <main className={`p-4 ${className}`}>
      {loading ? (
        <div className="flex flex-col justify-center items-center h-full">
          {safeContent.trim() === '' && <p className="text-gray-600 mb-2 italic">Generating...</p>}
          <span
            className="spinner"
            style={{
              width: '50px',
              height: '50px',
              borderWidth: '5px',
            }}
          ></span>
        </div>
      ) : safeContent.trim() === '' ? (
        <div className="flex flex-col justify-center items-center h-full">
          <p className="text-gray-500 text-lg italic">Select a topic to get started!</p>
        </div>
      ) : (
        markdownRender
      )}
    </main>
  );
}

export default MainContent;