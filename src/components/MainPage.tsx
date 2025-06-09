import React from 'react';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Notes from './Notes';
import Chatbot from './Chatbot';

function MainPage() {
  return (
    <div className="p-4 h-screen">
      <div className="grid grid-cols-3 h-full"> {/* grid layout with 3 columns */}
        {/* sidebar */}
        <Sidebar className="col-span-1" />
        {/* MAIN content windo */}
        <MainContent className="col-span-1" />
        {/* notes/chatbot */}
        <div className="col-span-1 grid grid-rows-2">
          <Notes className="row-span-1" />
          <Chatbot className="row-span-1" />
        </div>
      </div>
    </div>
  );
}

export default MainPage;
