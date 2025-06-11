import React from 'react';

function MainContent({ className }: { className?: string }) {
  return (
    <main className={`p-4 ${className}`}>
      <h1 className="text-2xl font-bold mb-4">Topic Content</h1>
      <p>
        This is where our content for the selected topic will appear. For example:
      </p>
      <p className="mt-2">
        <strong>Topic 1:</strong> Introduction to Python. Python is a high-level, interpreted programming language known for its simplicity, readability, and versatility. It’s used in web development, data science, automation, AI, game development, and more.
      </p>
    </main>
  );
}

export default MainContent;
