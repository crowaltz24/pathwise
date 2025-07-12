import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import supabase from '../supabaseClient';
import { Send } from 'lucide-react';
import { Trash2 } from 'lucide-react';

let API_BASE_URL = '';

async function fetchConfig() {
  try {
    const response = await fetch('/config');
    const config = await response.json();
    API_BASE_URL = config.API_BASE_URL;

    if (!API_BASE_URL) {
      console.error("API Base URL is missing.");
    }
  } catch (error) {
    if (window.location.hostname === 'localhost') {
      console.warn("Localhost environment detected. Not using Flask config. Falling back to local environment variables.");
      API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
    } else {
      console.error("Failed to fetch configuration from Flask:", error);
    }
  }
}

await (async () => {
  await fetchConfig();
})();

function Chatbot({ className, style, context, roadmapId }: { className?: string; style?: React.CSSProperties; context?: string; roadmapId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chats, setChats] = useState<{ role: string; content: string; username?: string; section?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalWidth, setModalWidth] = useState(33); // starter width of chat modal
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [username, setUsername] = useState<string>('You');
  const resizing = useRef(false);
  const chatBodyRef = useRef<HTMLDivElement>(null); // Ref for chat body

  const handleMouseDown = () => {
    resizing.current = true;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (resizing.current) {
      const newWidth = Math.max(15, Math.min(50, (window.innerWidth - e.clientX) / window.innerWidth * 100));
      setModalWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    resizing.current = false;
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUsername(data?.user?.user_metadata?.username || 'You'); // Default to "You" if no username is available
    };

    const fetchChats = async () => {
      if (!roadmapId) return;

      try {
        const { data, error } = await supabase
          .from('roadmaps')
          .select('chats')
          .eq('id', roadmapId)
          .single();

        if (error) {
          console.error('Error fetching chats:', error);
        } else if (data?.chats) {
          setChats(data.chats);
        }
      } catch (error) {
        console.error('Unexpected error fetching chats:', error);
      }
    };

    fetchUser();
    fetchChats();
  }, [roadmapId]);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight; // scroll to bottom
    }
  }, [chats, isModalOpen]); // scroll to bottom whenever modal is opened or there is a new text

  const handleSend = async () => {
    setIsModalOpen(true);
    if (!query.trim()) {
      console.error('Query is required.');
      return;
    }

    if (!context?.trim()) {
      setLoading(true); // fake load
      setTimeout(() => {
        const noContextResponse = "Open a section before asking a doubt!";
        setChats([...chats, { role: 'user', content: query, username }, { role: 'assistant', content: noContextResponse }]);
        setQuery('');
        setLoading(false);
      }, 250); // simulated delay
      return;
    }

    const lastMessages = chats.slice(-5).map((chat) => `${chat.role}: ${chat.content}`).join('\n'); // last 5 messages as context
    const extendedContext = `${context}\n\nChat History:\n${lastMessages}`;

    const newChats = [...chats, { role: 'user', content: query, username, section: context }];
    setChats(newChats);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-chat-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context: extendedContext }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.response) {
        const updatedChats = [...newChats, { role: 'assistant', content: data.response }];
        setChats(updatedChats);

        // save chats to supabase
        await supabase
          .from('roadmaps')
          .update({ chats: updatedChats })
          .eq('id', roadmapId);
      } else {
        console.error('Unexpected response format:', data);
      }
    } catch (error) {
      console.error('Error sending chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear the chat? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('roadmaps')
        .update({ chats: [] }) // clear chat history
        .eq('id', roadmapId);

      if (error) {
        console.error('Error clearing chat history:', error);
      } else {
        setChats([]); // clear local chat state
      }
    } catch (error) {
      console.error('Unexpected error while clearing chat history:', error);
    }
  };

  const handleDeleteMessage = async (index: number) => {
    const updatedChats = [...chats];
    updatedChats.splice(index, 1); // Remove the user message
    if (index < updatedChats.length && updatedChats[index].role === 'assistant') {
      updatedChats.splice(index, 1); // Remove the associated assistant response
    }

    try {
      const { error } = await supabase
        .from('roadmaps')
        .update({ chats: updatedChats })
        .eq('id', roadmapId);

      if (error) {
        console.error('Error deleting message:', error);
      } else {
        setChats(updatedChats);
      }
    } catch (error) {
      console.error('Unexpected error while deleting message:', error);
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
      <div className="flex gap-2">
        <button
          onClick={handleSend}
          disabled={!query.trim()}
          className={`flex items-center justify-center w-full p-2 rounded ${query.trim() ? 'bg-black text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          style={{ fontFamily: 'Gloria Hallelujah, cursive' }}
        >
          <Send size={24} className="mr-2" /> Ask
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full p-2 rounded bg-black text-white hover:bg-gray-800"
          style={{ fontFamily: 'Gloria Hallelujah, cursive' }}
        >
          Open Chat
        </button>
      </div>
      {isModalOpen && (
        <div className="chat-modal" style={{ width: `${modalWidth}%` }}>
          <div className="chat-header flex justify-between items-center p-4 bg-gray-100 border-b relative">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-lg font-bold text-gray-700 hover:text-gray-900"
                style={{
                  fontFamily: 'Gloria Hallelujah, cursive',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'none', 
                }}
              >
                Chat ▼
              </button>
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 bg-white border border-gray-300 rounded-md shadow-md z-10">
                  <button
                    onClick={handleClearChat}
                    className="block w-full text-left px-4 py-1 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    style={{
                      fontFamily: 'Gloria Hallelujah, cursive',
                      fontSize: '1rem',
                    }}
                  >
                    Clear Chat
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-500 hover:text-black text-xl font-bold"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                margin: 0,
                boxShadow: 'none',
                transition: 'color 0.3s ease',
              }}
            >
              ✕
            </button>
          </div>
          <div ref={chatBodyRef} className="chat-body flex flex-col gap-2 p-4 overflow-y-auto">
            {chats.map((chat, index) => (
              <div
                key={index}
                className={`relative chat-message p-3 rounded-lg shadow-md ${
                  chat.role === 'user'
                    ? 'bg-blue-100 text-blue-800 self-end'
                    : 'bg-gray-200 text-gray-800 self-start'
                }`}
              >
                {chat.role === 'user' && (
                  <button
                    onClick={() => handleDeleteMessage(index)}
                    className="absolute -left-10 top-1/2 transform -translate-y-1/2 focus:outline-none bg-transparent border-none p-0 m-0 shadow-none"
                    title="Delete Message"
                    style={{background: 'none', border: 'none', padding: 0, margin: 0}}
                  >
                    <Trash2
                      size={16}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                    />
                  </button>
                )}
                {chat.role === 'user' && chat.username && (
                  <p className="text-sm font-bold text-gray-600 mb-1">{chat.username}</p>
                )}
                <ReactMarkdown
                  className="markdown-content"
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
                {chat.role === 'user' && chat.section && (
                  <p className="text-xs text-gray-500 mt-1">
                    <i>Asked in</i>: <strong>{chat.section.split('\n')[0].replace(/^#+\s*/, '')}</strong>
                  </p>
                )}
              </div>
            ))}
            {loading && <div className="loading-spinner self-center">Generating...</div>}
          </div>
          <div className="chat-input flex items-center p-4 border-t">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault(); // prevent newline
                  handleSend();
                }
              }}
              placeholder="Ask a doubt..."
              className="flex-grow p-2 border rounded mr-2 resize-none h-10"
            />
            <button
              onClick={handleSend}
              disabled={!query.trim()}
              className={`p-2 rounded ${query.trim() ? 'bg-black text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              <Send size={20} />
            </button>
          </div>
          <div
            className="resize-handle"
            onMouseDown={handleMouseDown}
            style={{
              cursor: 'e-resize',
              width: '6px',
              background: '#ddd',
              position: 'absolute',
              left: '-3px',
              top: 0,
              bottom: 0,
              borderRadius: '3px',
            }}
          ></div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;