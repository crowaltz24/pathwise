import React from 'react';

function Chatbot({ className }: { className?: string }) {
  return (
    <div className={`p-4 bg-white border rounded shadow ${className}`}>
      <h2 className="text-lg font-bold mb-2">Chatbot</h2>
      <p>Ask me anything about your learning topics!</p>
    </div>
  );
}

export default Chatbot;
