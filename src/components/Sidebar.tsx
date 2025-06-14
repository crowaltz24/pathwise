import React, { useState } from 'react';
import { Circle, ArrowRight } from 'lucide-react';
import supabase from '../supabaseClient';

function Sidebar({
  className,
  roadmap,
  loading,
  onContentUpdate,
  roadmapId,
  topic, // topic as prop
}: {
  className?: string;
  roadmap: string[] | null;
  loading: boolean;
  onContentUpdate: (section: string, content: string) => void;
  roadmapId: string | null;
  topic: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState<boolean>(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null); // tracking the selected section

  const handleSectionClick = async (section: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (!userId) {
        throw new Error('User is not authenticated.');
      }

      const roadmapId = new URLSearchParams(location.search).get('id');
      if (!roadmapId) {
        throw new Error('Roadmap ID is missing.');
      }

      onContentUpdate(section, '');
      setSelectedSection(section); // highlight selected section

      // fetch roadmap content from Supabase
      const { data: roadmapData, error: fetchError } = await supabase
        .from('roadmaps')
        .select('content')
        .eq('id', roadmapId)
        .single();

      if (fetchError) {
        console.error('Error fetching content:', fetchError);
        setError('Failed to fetch content. Please try again.');
        setShowError(true);
        return;
      }

      const existingContent = roadmapData?.content || {};
      if (existingContent[section]) {
        // update cause content exists
        onContentUpdate(section, existingContent[section]);
        return;
      }

      // otherwise we generate new
      const response = await fetch('https://pathwise-eg6a.onrender.com/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(`openrouter_api_key_${userId}`)}`, // Include API key
        },
        body: JSON.stringify({
          section,
          main_topic: roadmap?.[0] || 'Unknown Topic', 
          roadmap, // pass the entire roadmap
        }),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error('Backend error details:', errorDetails);
        throw new Error('Failed to generate content.');
      }

      const { content } = await response.json();

      // save generated content to Supabase
      const updatedContent = { ...existingContent, [section]: content };
      const { error: updateError } = await supabase
        .from('roadmaps')
        .update({ content: updatedContent })
        .eq('id', roadmapId);

      if (updateError) {
        console.error('Error saving content:', updateError);
        setError('Failed to save content. Please try again.');
        setShowError(true);
        return;
      }

      // UPDATE CONTENT AREA
      onContentUpdate(section, content);
    } catch (error) {
      console.error('Error handling section click:', error);
      setError('An unexpected error occurred. Please try again.');
      setShowError(true);
    }
  };

  return (
    <aside className={`bg-gray-100 p-4 border-r h-full ${className}`}>
      <h2
        className="text-lg font-bold mb-4 text-center"
        style={{
          fontFamily: 'Gloria Hallelujah, cursive',
          fontSize: '1.5rem',
        }}
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
              const isSelected = selectedSection === item; // check if the section is selected
              return (
                <div
                  key={index}
                  className={`flowchart-item flex items-center cursor-pointer ${
                    isSelected ? 'selected-section' : ''  // because it needs special styling
                  }`}
                  style={{
                    marginLeft: `${indentLevel * 1.5}rem`, // indent based on level
                  }}
                  onClick={() => handleSectionClick(item)}
                >
                  <div className="icon-container flex items-center justify-center mr-2">
                    {isSubtopic ? (
                      <Circle className={`text-gray-400 ${isSelected ? 'text-blue-500' : ''}`} size={16} /> // subtopic icon
                    ) : (
                      <ArrowRight className={`text-blue-500 ${isSelected ? 'text-blue-700' : ''}`} size={16} /> // main topic icon
                    )}
                  </div>
                  <div
                    className={`flowchart-content ${
                      isSubtopic
                        ? 'text-sm text-gray-600 bg-gray-200 hover:bg-gray-300'
                        : 'text-base font-medium bg-blue-100 hover:bg-blue-200'
                    } p-3 rounded-lg shadow-md transition-all w-full ${
                      isSelected ? 'selected-content' : ''
                    }`}
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

      {/* error popup */}
      {error && (
        <div
          className={`absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-md transition-opacity duration-500 ${
            showError ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ zIndex: 1000 }}
        >
          {error}
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
