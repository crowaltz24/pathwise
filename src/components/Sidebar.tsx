import React from 'react';
import { Circle, ArrowRight } from 'lucide-react';

function Sidebar({ className, roadmap, loading }: { className?: string; roadmap: string[] | null; loading: boolean }) {
  const handleSectionClick = (section: string) => {
    alert(`You clicked on: ${section.trim()}`);
    // I'LL ADD THE LOGIC TO GENERATE THE CONTENT IN THE MAIN CONTENT AREA LATER
  };

  return (
    <aside className={`bg-gray-100 p-4 border-r h-full ${className}`}>
      <h2
        className="text-lg font-bold mb-4 text-center"
        style={{ fontFamily: 'Gloria Hallelujah, cursive' }}
      >
        Your Path
      </h2>
      {loading ? (
        <div className="flex justify-center items-center">
          <span className="spinner"></span>
        </div>
      ) : (
        <div className="flowchart-container space-y-2 overflow-y-auto">
          {roadmap && roadmap.length > 0 ? (
            roadmap.map((item, index) => {
              const isSubtopic = item.startsWith('  '); // check if subtopic
              const indentLevel = (item.match(/^ +/)?.[0].length || 0) / 2; // calculate indentation level
              return (
                <div
                  key={index}
                  className={`flowchart-item flex items-center cursor-pointer`}
                  style={{
                    marginLeft: `${indentLevel * 1.5}rem`, // indent based on level
                  }}
                  onClick={() => handleSectionClick(item)}
                >
                  <div className="icon-container flex items-center justify-center mr-2">
                    {isSubtopic ? (
                      <Circle className="text-gray-400" size={16} /> // subtopic icon
                    ):(
                      <ArrowRight className="text-blue-500" size={16} /> // main topic icon
                    )}
                  </div>
                  <div
                    className={`flowchart-content ${
                      isSubtopic
                        ? 'text-sm text-gray-600 bg-gray-200 hover:bg-gray-300'
                        : 'text-base font-medium bg-blue-100 hover:bg-blue-200'
                    } p-3 rounded-lg shadow-md transition-all w-full`}
                  >
                    {item.trim()}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">No roadmap generated yet.</p>
          )}
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
