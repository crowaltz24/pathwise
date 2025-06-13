import React from 'react';

function Notes({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <aside className={`p-4 bg-gray-50 border rounded shadow ${className}`} style={style}>
      <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Gloria Hallelujah, cursive' }}>Notes</h2>
      <div className="mb-2 p-2 bg-white border rounded shadow" style={{ fontFamily: 'Inter, sans-serif' }}>
        <p>Note 1: Python is high level...</p>
      </div>
      <div className="mb-2 p-2 bg-white border rounded shadow" style={{ fontFamily: 'Inter, sans-serif' }}>
        <p>Note 2: Interpreter vs Compiler difference...</p>
      </div>
    </aside>
  );
}

export default Notes;
