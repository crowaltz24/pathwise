import React from 'react';

function Doubts({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`chatbot ${className}`} style={style}>
      <h2 style={{ fontFamily: 'Gloria Hallelujah, cursive' }}>Doubts</h2>
      <div style={{ fontFamily: 'Inter, sans-serif' }}>
        <p>COMING SOON!</p>
        <p>Ask me your doubts, questions, or any clarification you need!</p>
      </div>
    </div>
  );
}

export default Doubts;