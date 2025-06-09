import React from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient'; // USE SHARED CLIENT to avoid Multiple GoTrueClient instance error

function Dashboard() {
  const [username, setUsername] = React.useState('User');
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUsername(data.user.user_metadata?.username || 'User');
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="dashboard">
      <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '1rem' }}>
        {username}'s dashboard
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#555' }}>
        This is a placeholder for the dashboard page.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '2rem',
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          color: '#fff',
          backgroundColor: '#333',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background 0.3s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#555')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#333')}
      >
        Back to Homepage
      </button>
    </div>
  );
}

export default Dashboard;
