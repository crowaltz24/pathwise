import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import supabase from '../supabaseClient';

function Chatbot({ className, style, context, roadmapId }: { className?: string; style?: React.CSSProperties; context: string; roadmapId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chats, setChats] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;

    const newChats = [...chats, { role: 'user', content: query }];
    setChats(newChats);
    setQuery('');
    setLoading(true);

    try {
      const { data } = await fetch('/generate-chat-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context }),
      }).then((res) => res.json());

      if (data.response) {
        const updatedChats = [...newChats, { role: 'assistant', content: data.response }];
        setChats(updatedChats);

        // Save chats to Supabase
        await supabase
          .from('roadmaps')
          .update({ chats: updatedChats })
          .eq('id', roadmapId);
      }
    } catch (error) {
      console.error('Error sending chat:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`chatbot ${className}`} style={style}>
      <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Gloria Hallelujah, cursive' }}>Doubts</h2>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask a doubt..."
        className="w-full p-2 border rounded mb-2 h-48 overflow-y-auto resize-none"
      />
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={!query.trim()}
        className={`w-full p-2 rounded ${query.trim() ? 'bg-black text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        style={{ fontFamily: 'Gloria Hallelujah, cursive' }}
      >
        Send
      </button>
      {isModalOpen && (
        <div className="chat-modal">
          <div className="chat-header">
            <h2 style={{ fontFamily: 'Gloria Hallelujah, cursive' }}>Doubts</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-black text-xl font-bold"
              style={{ fontFamily: 'Gloria Hallelujah, cursive' }}
            >
              ✕
            </button>
          </div>
          <div className="chat-body">
            {chats.map((chat, index) => (
              <div key={index} className={`chat-message ${chat.role}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter style={okaidia} language={match[1]} PreTag="div" {...props}>
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
                  {chat.content}
                </ReactMarkdown>
              </div>
            ))}
            {loading && <div className="loading-spinner">Loading...</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;