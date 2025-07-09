import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

function SettingsPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [expandedSection, setExpandedSection] = useState<'username' | 'password' | 'delete' | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleSaveChanges = async () => {
    try {
      if (expandedSection === 'username' && username.trim()) {
        const { error: usernameError } = await supabase.auth.updateUser({
          data: { username },
        });
        if (usernameError) throw usernameError;
      }

      if (expandedSection === 'password') {
        if (newPassword !== confirmNewPassword) {
          setMessage('Passwords do not match.');
          setMessageType('error');
          return;
        }
        if (currentPassword.trim() && newPassword.trim()) {
          const { error: passwordError } = await supabase.auth.updateUser({
            password: newPassword,
          });
          if (passwordError) throw passwordError;
        }
      }

      setMessage('Changes saved successfully!');
      setMessageType('success');
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage('Failed to save changes. Please try again.');
      setMessageType('error');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: deleteEmail,
        password: deletePassword,
      });

      if (signInError || !data.user) {
        throw new Error('Invalid email or password.');
      }

      const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id);
      if (deleteError) throw deleteError;

      setMessage('Account deleted successfully.');
      setMessageType('success');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage('Failed to delete account. Please try again.');
      setMessageType('error');
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  };

  const toggleSection = (section: 'username' | 'password' | 'delete') => {
    setExpandedSection(expandedSection === section ? null : section);
    setUsername('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setDeleteEmail('');
    setDeletePassword('');
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-blue-200">
      <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Gloria Hallelujah, cursive' }}>Settings</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
        <p className="text-gray-600 mb-4">Manage your account settings below.</p>

        {/* change username */}
        <div className="mb-4">
          <button
            className="w-full text-left font-semibold text-gray-700 mb-2 bg-white p-2 rounded hover:bg-gray-100"
            onClick={() => toggleSection('username')}
          >
            Change Username {expandedSection === 'username' ? '▲' : '▼'}
          </button>
          {expandedSection === 'username' && (
            <div className="mt-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter new username"
                className="w-full p-2 border rounded mb-2"
              />
            </div>
          )}
        </div>

        {/* change password section */}
        <div className="mb-4">
          <button
            className="w-full text-left font-semibold text-gray-700 mb-2 bg-white p-2 rounded hover:bg-gray-100"
            onClick={() => toggleSection('password')}
          >
            Change Password {expandedSection === 'password' ? '▲' : '▼'}
          </button>
          {expandedSection === 'password' && (
            <div className="mt-2">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full p-2 border rounded"
              />
            </div>
          )}
        </div>

        {/* delete account */}
        <div className="mb-4">
          <button
            className="w-full text-left font-semibold text-gray-700 mb-2 bg-white p-2 rounded hover:bg-gray-100"
            onClick={() => toggleSection('delete')}
          >
            Delete Account {expandedSection === 'delete' ? '▲' : '▼'}
          </button>
          {expandedSection === 'delete' && (
            <div className="mt-2">
              <input
                type="email"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full p-2 border rounded mb-2"
              />
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="w-full p-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Delete Account
              </button>
            </div>
          )}
        </div>

        {message && (
          <p className={`text-sm mb-4 ${messageType === 'success' ? 'text-green-500' : 'text-red-500'}`}>
            {message}
          </p>
        )}

        <button
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 w-full"
          onClick={handleSaveChanges}
        >
          Save Changes
        </button>
        <button
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 w-full mt-2"
          onClick={() => navigate('/dashboard')}
        >
          Cancel
        </button>
      </div>

      {/* delete confirmation modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4 text-red-600">Are you sure?</h2>
            <p className="text-gray-700 mb-4">
              You are attempting to delete your Pathwise account. This action is permanent and cannot be undone. Do you want to proceed?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                No, Cancel
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={handleDeleteAccount}
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

export default SettingsPage;
