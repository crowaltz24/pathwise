import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import MainPage from './components/MainPage';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* landing Page */}
        <Route path="/" element={<LandingPage />} />
        {/* main Page */}
        <Route path="/main" element={<MainPage />} />
      </Routes>
    </Router>
  );
}

export default App;
