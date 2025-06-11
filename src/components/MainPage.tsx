import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Notes from './Notes';
import Chatbot from './Chatbot';
import supabase from '../supabaseClient';

function MainPage() {
  const [roadmap, setRoadmap] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true); // loading state for roadmap
  const [error, setError] = useState<string | null>(null); // error state for spinner timeout
  const [showError, setShowError] = useState<boolean>(false); // fadeout effect
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // dropdowb state
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setLoggedInUsername(user.user_metadata?.username || null);
      } else {
        navigate('/'); // landing page if not signed in
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchRoadmapFromSupabase = async () => {
      const params = new URLSearchParams(location.search);
      const id = params.get('id'); // fetch by ID

      if (id) {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('roadmaps')
            .select('roadmap')
            .eq('id', id)
            .single();

          if (error) {
            throw error;
          }

          if (data) {
            setRoadmap(data.roadmap);
          } else {
            setError('No roadmap found for this ID.');
            setShowError(true);
          }
        } catch (error) {
          console.error('Error fetching roadmap from Supabase:', error);
          setError('Failed to load the roadmap. Please try again later.');
          setShowError(true);
        } finally {
          setLoading(false);
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
      const timer = setTimeout(() => setShowError(false), 4500); // 4.5 seconds fadeout
      const clearError = setTimeout(() => setError(null), 5000); // 5 seconds clear
      return () => {
        clearTimeout(timer);
        clearTimeout(clearError);
      };
    }
  }, [error]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setLoggedInUsername(null);
    navigate('/'); // redirect to landing page on sign out
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-blue-100 to-blue-300">
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
          <button className="get-started-btn" onClick={() => navigate('/')}>
            {loggedInUsername || 'Get Started'}
          </button>
        )}
      </header>

      {/* main content */}
      <div className="main-content-container">
        <Sidebar className="sidebar component" roadmap={roadmap} loading={loading} />
        <MainContent className="component" />
        <div className="grid grid-rows-2 gap-1">
          <Notes className="notes component" />
          <Chatbot className="chatbot component" />
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
