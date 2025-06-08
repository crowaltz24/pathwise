import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const [topic, setTopic] = useState('');
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (topic.trim()) {
      navigate('/main', { state: { topic } });
    }
  };

  return (
    <div className="landing-page">
      {/* header */}
      <header className="header">
        <h1 className="logo">Pathwise</h1>
        <button className="get-started-btn">Get Started</button>
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
    </div>
  );
}

export default LandingPage;
