import React from 'react';

function Notes({ className }: { className?: string }) {
  return (
    <aside className={`p-4 bg-gray-50 border rounded shadow ${className}`}>
      <h2 className="text-lg font-bold mb-4">Notes</h2>
      <div className="mb-2 p-2 bg-white border rounded shadow">
        <p>Note 1: Python is high level...</p>
      </div>
      <div className="mb-2 p-2 bg-white border rounded shadow">
        <p>Note 2: Interpreter vs Compiler difference...</p>
      </div>
    </aside>
  );
}

export default Notes;
