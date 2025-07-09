import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import supabase from '../supabaseClient';

interface Roadmap {
  id: string;
  topic: string;
  description: string | null;
  created_at: string;
  last_opened: string | null; // last_opened property
}

function Dashboard() {
  const [username, setUsername] = useState('User');
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ id: string; topic: string; description: string }>(
    { id: '', topic: '', description: '' }
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // "+" modal
  const [newTopic, setNewTopic] = useState(''); // Topic for new roadmap
  const [isGenerating, setIsGenerating] = useState(false); // Spinner state for "Generate Roadmap"
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUsername(data.user.user_metadata?.username || 'User');
        fetchRoadmaps(data.user.id);
      }
    };
    fetchUser();
  }, []);

  const fetchRoadmaps = async (userId: string) => {
    const { data, error } = await supabase
      .from('roadmaps')
      .select('id, topic, description, created_at, last_opened')
      .eq('user_id', userId)
      .order('last_opened', { ascending: false, nullsFirst: false }); // sorting by latest opened first, nulls last

    if (error) {
      console.error('Error fetching roadmaps:', error);
    } else {
      setRoadmaps(data || []);
    }
  };

  const handleEdit = (id: string, topic: string, description: string) => {
    setModalData({ id, topic, description });
    setIsModalOpen(true);
    setSettingsMenuOpen(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      // console.log('Attempting to delete roadmap with ID:', deleteId); // debugging
      try {
        const { error } = await supabase.from('roadmaps').delete().eq('id', deleteId);
        if (error) {
          console.error('Error deleting roadmap:', error); // Supabase error
        } else {
          // console.log('Roadmap deleted successfully:', deleteId);
          setRoadmaps(roadmaps.filter((roadmap) => roadmap.id !== deleteId));
        }
      } catch (error) {
        console.error('Unexpected error while deleting roadmap:', error); // debugging
      } finally {
        setIsDeleteModalOpen(false);
        setDeleteId(null);
      }
    } else {
      console.error('No deleteId set. Cannot delete roadmap.');
    }
  };

  const handleSave = async () => {
    const { id, topic, description } = modalData;
    const { error } = await supabase
      .from('roadmaps')
      .update({ topic, description })
      .eq('id', id);

    if (error) {
      console.error('Error updating roadmap:', error);
    } else {
      setRoadmaps(
        roadmaps.map((roadmap) =>
          roadmap.id === id ? { ...roadmap, topic, description } : roadmap
        )
      );
      setIsModalOpen(false);
    }
  };

  const handleGo = async (roadmapId: string) => {
    try {
      const { error } = await supabase
        .from('roadmaps')
        .update({ last_opened: new Date().toISOString() }) // setting last_opened to now
        .eq('id', roadmapId);

      if (error) {
        console.error('Error updating last_opened:', error);
      } else {
        navigate(`/main?id=${roadmapId}`); // navigate to relevant roadmap
      }
    } catch (error) {
      console.error('Unexpected error while updating last_opened:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals: { [key: string]: number } = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1,
    };

    for (const [unit, value] of Object.entries(intervals)) {
      const count = Math.floor(seconds / value);
      if (count >= 1) {
        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        return rtf.format(-count, unit as Intl.RelativeTimeFormatUnit);
      }
    }

    return 'just now';
  };

  const handleGenerateRoadmap = async () => {
    if (!newTopic.trim()) {
      alert('Topic cannot be empty.');
      return;
    }
    setIsGenerating(true); // spinner
    try {
      // REUSING THE HANDLESUBMIT FUNCTION
      const response = await fetch('https://pathwise-eg6a.onrender.com/generate-roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: newTopic }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate roadmap');
      }

      const data = await response.json();
      if (data.roadmap && typeof data.roadmap === 'object' && data.roadmap.error) {
        alert(data.roadmap.error);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User not authenticated.');
      }

      const { data: savedRoadmap, error: insertError } = await supabase
        .from('roadmaps')
        .insert([
          {
            user_id: userData.user.id,
            topic: newTopic,
            roadmap: data.roadmap,
            progress: 0,
          },
        ])
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      navigate(`/main?id=${savedRoadmap.id}`);
    } catch (error) {
      console.error('Error generating roadmap:', error);
      alert('An unexpected error occurred while generating the roadmap. Please try again later.');
    } finally {
      setIsGenerating(false); // spinner byebye
      setIsAddModalOpen(false);
      setNewTopic('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleGenerateRoadmap();
    }
  };

  return (
    <div className="dashboard-body h-screen flex flex-col">
      {/* header */}
      <header className="dashboard-header fixed top-0 left-0 w-full flex justify-between items-center px-6 py-4 bg-white shadow-md z-50">
        <h1 className="logo text-2xl font-bold">Pathwise</h1>
        <h2
          className="text-center"
          style={{
            fontFamily: 'Gloria Hallelujah, cursive',
            fontSize: '1.8rem',
          }}
        >
          Your Dashboard
        </h2>
        <div className="user-menu relative">
          <button
            className="username-display bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md focus:outline-none"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {username} ▼
          </button>
          {isDropdownOpen && (
            <div className="dropdown-menu absolute right-0 mt-2 bg-white border border-gray-300 rounded-md shadow-md z-10">
              <button
                onClick={() => navigate('/')}
                className="dropdown-item block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="dropdown-item block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Settings
              </button>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/');
                }}
                className="dropdown-item block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* path cards */}
      <div className="roadmap-cards grid grid-cols-4 gap-6 p-6 mt-20">
        {roadmaps.map((roadmap) => (
          <div key={roadmap.id} className="card bg-white p-4 rounded-lg shadow-lg relative">
            <h2
              className="text-lg font-bold mb-2"
              style={{
                fontFamily: 'Gloria Hallelujah, cursive',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '350px', // prevent card stretching
              }}
              title={roadmap.topic} // full title on hover
            >
              {roadmap.topic}
            </h2>
            <div className="text-xs text-gray-500 mt-2">
              {roadmap.last_opened && <p>Last Opened: {formatDate(roadmap.last_opened)}</p>}
              <p>Created: {formatDate(roadmap.created_at)}</p>
            </div>
            <div className="card-description">
              {roadmap.description || 'No description available.'}
            </div>
            <div className="actions flex justify-between mt-4 relative">
              <button
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                onClick={() => handleGo(roadmap.id)}
              >
                Go
              </button>
              <button
                className="settings-icon bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-100 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsMenuOpen(settingsMenuOpen === roadmap.id ? null : roadmap.id);
                }}
              >
                <Settings size={20} className="text-gray-500 hover:text-gray-700" />
              </button>
              {settingsMenuOpen === roadmap.id && (
                <div className="settings-menu absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-md shadow-md z-10">
                  <button
                    onClick={() => handleEdit(roadmap.id, roadmap.topic, roadmap.description || '')}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeleteId(roadmap.id);
                      setIsDeleteModalOpen(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {/* + button for adding a new roadmap */}
        <div
          className="card bg-gray-100 p-4 rounded-lg shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-200"
          onClick={() => setIsAddModalOpen(true)}
        >
          <span className="text-4xl font-bold text-gray-500">+</span>
        </div>
      </div>

      {/* add radmap modal */}
      {isAddModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center">
          <div className="modal-content bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Add New Roadmap</h2>
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter topic"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isGenerating} // disable cancel button while generating
              >
                Cancel
              </button>
              <button
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 flex items-center justify-center"
                onClick={handleGenerateRoadmap}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <span
                    className="spinner"
                    style={{
                      width: '20px',
                      height: '20px',
                      borderWidth: '3px',
                      marginRight: '8px',
                    }}
                  ></span>
                ) : null}
                {isGenerating ? 'Generating...' : 'Generate Roadmap'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* edit modal */}
      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center">
          <div className="modal-content bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Edit Roadmap</h2>
            <input
              type="text"
              value={modalData.topic}
              onChange={(e) => setModalData({ ...modalData, topic: e.target.value })}
              placeholder="Topic"
              className="w-full p-2 border rounded mb-4"
            />
            <textarea
              value={modalData.description}
              onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
              placeholder="Description"
              className="w-full p-2 border rounded mb-4"
              rows={4}
            ></textarea>
            <div className="flex justify-end gap-2">
              <button
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                onClick={handleSave} // save changes
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center">
          <div className="modal-content bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4 text-red-600">Are you sure?</h2>
            <p className="text-gray-700 mb-4">
              This action is permanent and cannot be undone. Do you want to proceed?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={handleDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
