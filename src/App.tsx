import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import MainPage from './components/MainPage';
import Dashboard from './components/Dashboard';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* landing Page */}
        <Route path="/" element={<LandingPage />} />
        {/* main page */}
        <Route path="/main" element={<MainPage />} />
        {/* dashboard page */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
