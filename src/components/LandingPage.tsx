import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

function LandingPage() {
  const [topic, setTopic] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState<boolean>(false); // fadeout effect
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

  useEffect(() => {
    if (error) {
      setShowError(true); // Show the error message
      const timer = setTimeout(() => setShowError(false), 4500); // 4.5 seconds fadeout
      const clearError = setTimeout(() => setError(null), 5000); // 5 seconds  clear
      return () => {
        clearTimeout(timer);
        clearTimeout(clearError);
      };
    }
  }, [error]);

  const handleSubmit = async () => {
    if (!loggedInUsername) {
      setIsModalOpen(true); // if not logged in
    } else if (topic.trim()) {
      try {
        setLoading(true);

        // roadmap gen
        const response = await fetch('http://127.0.0.1:5000/generate-roadmap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic }), // the topic as JSON
        });

        if (!response.ok) {
          throw new Error('Failed to generate roadmap');
        }

        const data = await response.json();
        console.log('Backend Response:', data);

        // error handling
        if (data.roadmap && typeof data.roadmap === 'object' && data.roadmap.error) {
          setError(data.roadmap.error); // popup
          return;
        }

        // Save the generated roadmap to Supabase
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          throw new Error('User not authenticated.');
        }

        const { data: savedRoadmap, error: insertError } = await supabase
          .from('roadmaps')
          .insert([
            {
              user_id: userData.user.id,
              topic,
              roadmap: data.roadmap, // save generated roadmap
              progress: 0,
            },
          ])
          .select('id') // id of selected roadmap
          .single();

        if (insertError) {
          throw insertError;
        }

        const roadmapId = savedRoadmap.id;

        // Navigation uses roadmap ID now NOT TOPIC (to prevent confuision and fetching multiple roadmaps with same topic)
        navigate(`/main?id=${roadmapId}`);
      } catch (error) {
        console.error('Error generating roadmap:', error);
        setError('An unexpected error occurred while generating the roadmap. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setMessage(''); // clear previous messages
    setMessageType('');
    try {
      if (isSignUp) {
        if (password !== retypePassword) {
          setMessage('Passwords do not match.');
          setMessageType('error');
          return;
        }
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
    setRetypePassword('');
    setUsername('');
    setMessage('');
    setMessageType('');
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setMessage('');
    setMessageType('');
  };

  return (
    <div className="landing-page">
      {/* header */}
      <header className="header">
        <h1 className="logo">Pathwise</h1>
        {loggedInUsername ? (
          <div className="user-menu relative">
            <button
              className="username-display bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md focus:outline-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {loggedInUsername} ▼
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu absolute right-0 mt-2 bg-white border border-gray-300 rounded-md z-10">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="dropdown-item block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="dropdown-item block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
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
          <button onClick={handleSubmit} className="generate-btn" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Generate Roadmap'}
          </button>
        </div>
      </main>

      {/* footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Pathwise. All rights reserved.</p>
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
            {isSignUp && (
              <input
                type="password"
                placeholder="Retype Password"
                value={retypePassword}
                onChange={(e) => setRetypePassword(e.target.value)}
                className="auth-input"
              />
            )}
            <button onClick={handleAuth} className="auth-btn" disabled={loading}>
              {loading ? <span className="spinner"></span> : isSignUp ? 'Sign Up' : 'Log In'}
            </button>
            {message && (
              <p className={`auth-message ${messageType}`}>
                {messageType === 'success' ? '✓' : '✗'} {message}
              </p>
            )}
            <p onClick={toggleAuthMode} className="toggle-auth">
              {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </p>
          </div>
        </div>
      )}

      {/* ERROR POPUPPPP (i really like this one i think its kinda neat) */}
      {error && (
        <div
          className={`absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-md transition-opacity duration-500 ${
            showError ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ zIndex: 1000 }}
        >
          {error} Please try again.
        </div>
      )}
    </div>
  );
}

export default LandingPage;
