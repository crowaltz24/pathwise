import React from 'react';

function Doubts({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`chatbot ${className}`} style={style}>
      <h2 style={{ fontFamily: 'Gloria Hallelujah, cursive' }}>Doubts</h2>
      <div style={{ fontFamily: 'Inter, sans-serif' }}>
        <p>Ask me anything about your learning topics!</p>
      </div>
    </div>
  );
}

export default Doubts;
