import React from 'react';

function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={`bg-gray-100 p-4 border-r ${className}`}>
      <h2 className="text-lg font-bold mb-4">Learning Roadmap</h2>
      <ul>
        <li className="mb-2 cursor-pointer">Introduction to Python</li>
        <li className="mb-2 cursor-pointer">Python Basics</li>
        <li className="mb-2 cursor-pointer">Data Structures</li>
        <li className="mb-2 cursor-pointer">Functions and Modules</li>
        <li className="mb-2 cursor-pointer">File Handling</li>
        {/* example placeholder items for now*/}
      </ul>
    </aside>
  );
}

export default Sidebar;
