import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// supabase init
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

function LandingPage() {
  const [topic, setTopic] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // dropdown state RMB THIS
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const navigate = useNavigate();

  useEffect(() => {
    // already logged in??
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setLoggedInUsername(user.user_metadata?.username || null);
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = () => {
    if (!loggedInUsername) {
      setIsModalOpen(true); // if not logged in
    } else if (topic.trim()) {
      navigate('/main', { state: { topic } });
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setMessage(''); // clear previous messages
    setMessageType('');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });
        if (error) throw error;
        setMessage('Signup successful! Please check your email for confirmation.');
        setMessageType('success');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setLoggedInUsername(data.user?.user_metadata?.username || null);
        setMessage('Login successful!');
        setMessageType('success');
        setIsModalOpen(false);
      }
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
        setMessageType('error');
      } else {
        setMessage('An unexpected error occurred.');
        setMessageType('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLoggedInUsername(null);
    setIsDropdownOpen(false);
    alert('You have been signed out.');
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter') {
      action();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEmail('');
    setPassword('');
    setUsername('');
    setMessage('');
    setMessageType('');
  };

  return (
    <div className="landing-page">
      {/* header */}
      <header className="header">
        <h1 className="logo">Pathwise</h1>
        {loggedInUsername ? (
          <div className="user-menu">
            <button
              className="username-display"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {loggedInUsername} ▼
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button onClick={() => navigate('/dashboard')} className="dropdown-item">
                  Dashboard
                </button>
                <button onClick={handleSignOut} className="dropdown-item">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="get-started-btn" onClick={() => setIsModalOpen(true)}>
            Get Started
          </button>
        )}
      </header>

      {/* main */}
      <main className="main-content">
        <div className="description">
          <h2>Your Personalized Learning Roadmap</h2>
          <p>
            Pathwise helps you create a customized learning roadmap for any topic.
            Enter your topic below, and let our AI generate a step-by-step guide to
            help you master it.
          </p>
        </div>
        <div className="input-container">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
            placeholder="Enter your topic..."
            className="topic-input"
          />
          <button onClick={handleSubmit} className="generate-btn">
            Generate Roadmap
          </button>
        </div>
      </main>

      {/* footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Pathwise. All rights reserved.</p>
        <p>
          <a href="#" className="footer-link">
            Privacy Policy
          </a>{' '}
          |{' '}
          <a href="#" className="footer-link">
            Terms of Service
          </a>
        </p>
      </footer>

      {/* login/signup */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button onClick={handleCloseModal} className="close-modal">
              &times;
            </button>
            <h2>{isSignUp ? 'Sign Up' : 'Log In'}</h2>
            {isSignUp && (
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="auth-input"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleAuth)}
              className="auth-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, handleAuth)}
              className="auth-input"
            />
            <button onClick={handleAuth} className="auth-btn" disabled={loading}>
              {loading ? <span className="spinner"></span> : isSignUp ? 'Sign Up' : 'Log In'}
            </button>
            {message && (
              <p className={`auth-message ${messageType}`}>
                {messageType === 'success' ? '✓' : '✗'} {message}
              </p>
            )}
            <p onClick={() => setIsSignUp(!isSignUp)} className="toggle-auth">
              {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
