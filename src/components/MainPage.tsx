import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Notes from './Notes';
import Chatbot from './Chatbot';
import supabase from '../supabaseClient';

function MainPage() {
  const [roadmap, setRoadmap] = useState<string[] | null>(null);
  const [roadmapTopic, setRoadmapTopic] = useState<string>(''); // topic name so i can display it in the header
  const [roadmapLoading, setRoadmapLoading] = useState(true); // SEPARETE BOTH SPINNERS
  const [contentLoading, setContentLoading] = useState(false); // SEPARATE BOTH LOADING STATES
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState<boolean>(false);
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setLoggedInUsername(user.user_metadata?.username || null);
      } else {
        navigate('/');
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchRoadmapFromSupabase = async () => {
      const params = new URLSearchParams(location.search);
      const id = params.get('id');

      if (id) {
        try {
          setRoadmapLoading(true);
          const { data, error } = await supabase
            .from('roadmaps')
            .select('roadmap, topic')
            .eq('id', id)
            .single();

          if (error) {
            throw error;
          }

          if (data) {
            setRoadmap(data.roadmap);
            setRoadmapTopic(data.topic); // topic name in header
          } else {
            setError('No roadmap found for this ID.');
            setShowError(true);
          }
        } catch (error) {
          console.error('Error fetching roadmap from Supabase:', error);
          setError('Failed to load the roadmap. Please try again later.');
          setShowError(true);
        } finally {
          setRoadmapLoading(false);
        }
      } else {
        setError('No roadmap ID provided in the URL.');
        setShowError(true);
      }
    };

    fetchRoadmapFromSupabase();
  }, [location.search]);

  useEffect(() => {
    if (error) {
      setShowError(true);
      const fadeOutTimer = setTimeout(() => setShowError(false), 4500); // 4.5 seconds fadeout
      const clearErrorTimer = setTimeout(() => setError(null), 5000); // 5 seconds clear

      return () => {
        clearTimeout(fadeOutTimer); // clear fadeout timer
        clearTimeout(clearErrorTimer); // clear error reset timer
      };
    }
  }, [error]);

  const handleContentUpdate = (section: string, content: string) => {
    setSelectedContent(''); // clear content when user clicks on new topic/subtopic
    setContentLoading(true); // spinner

    let timeoutMessage: NodeJS.Timeout | null = null;

    // if content gen takes too long
    timeoutMessage = setTimeout(() => {
      setSelectedContent('Content generation is taking longer than expected. Please wait...');
    }, 15000); // 15 seconds timeout

    // simulate content loading because it feels better to have a fast load than no load (I read this online in an article)
    setTimeout(() => {
      if (content.trim() !== '') {
        setSelectedContent(content);
        setContentLoading(false); // hide spinner ONLY if content is not empty (IMPORTANT)
      } else {
        setSelectedContent(''); // keep spinner for empty content (so it spins when generating)
      }
      if (timeoutMessage) clearTimeout(timeoutMessage);
    }, 500); // half second simulated delay
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLoggedInUsername(null);
    navigate('/');
  };

  return (
    <div className="main-page-body h-screen flex flex-col bg-gradient-to-b from-blue-100 to-blue-300">
      {/* header */}
      <header className="main-page-header">
        <h1 className="logo">Pathwise</h1>
        <h2
          className="topic-name text-center"
          style={{
            fontFamily: 'Gloria Hallelujah, cursive',
            fontSize: '1.8rem',
            margin: '0 auto',
          }}
        >
          {roadmapTopic || 'Your Topic'}
        </h2>
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
                  onClick={() => navigate('/')}
                  className="dropdown-item block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Home
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="dropdown-item block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/settings')}
                  className="dropdown-item block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Settings
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
          <button className="get-started-btn" onClick={() => navigate('/')}>
            {loggedInUsername || 'Get Started'}
          </button>
        )}
      </header>

      {/* main content */}
      <div className="main-content-container">
        <Sidebar
          className="sidebar component"
          roadmap={roadmap}
          loading={roadmapLoading}
          onContentUpdate={handleContentUpdate}
          roadmapId={new URLSearchParams(location.search).get('id')}
          topic={roadmapTopic}
        />
        <MainContent className="component" content={selectedContent} loading={contentLoading} />
        <div className="grid grid-rows-2 gap-1">
          <Notes
            className="notes component"
            roadmapId={new URLSearchParams(location.search).get('id')!}
          />
          <Chatbot
            className="chatbot component"
            roadmapId={new URLSearchParams(location.search).get('id')!}
          />
        </div>
      </div>

      {/* error message popup */}
      {error && (
        <div
          className={`absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-md transition-opacity duration-500 ${
            showError ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ zIndex: 1000 }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default MainPage;
