import React from 'react';
import { useNavigate } from 'react-router-dom';

function SettingsPage() {
  const navigate = useNavigate();

  const handleSaveChanges = () => {
    // LOGIC FOR SAVING WILL GO HERE
    navigate('/dashboard'); // back to the dashboard!!
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-blue-300">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">User Preferences</h2>
        <p className="text-gray-600 mb-4">This is where you can manage your account settings and preferences.</p>
        <button
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          onClick={handleSaveChanges}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;
