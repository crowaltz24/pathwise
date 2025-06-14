import React, { useState, useEffect } from 'react';
import { MoreVertical } from 'lucide-react'; // FOR vertical ellipsis icon
import supabase from '../supabaseClient';

interface NotesProps {
  className?: string;
  style?: React.CSSProperties;
  roadmapId: string;
}

function Notes({ className, style, roadmapId }: NotesProps) {
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [dropdownOpenIndex, setDropdownOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('roadmaps')
        .select('notes')
        .eq('id', roadmapId)
        .single();

      if (error) {
        console.error('Error fetching notes:', error);
      } else if (data?.notes) {
        setNotes(data.notes);
      }
    };

    fetchNotes();
  }, [roadmapId]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    const updatedNotes = [...notes, noteText];
    const { error } = await supabase
      .from('roadmaps')
      .update({ notes: updatedNotes })
      .eq('id', roadmapId);

    if (error) {
      console.error('Error adding note:', error);
    } else {
      setNotes(updatedNotes);
      setNoteText('');
    }
  };

  const handleDeleteNote = async (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    const { error } = await supabase
      .from('roadmaps')
      .update({ notes: updatedNotes })
      .eq('id', roadmapId);

    if (error) {
      console.error('Error deleting note:', error);
    } else {
      setNotes(updatedNotes);
    }
  };

  return (
    <aside className={`p-4 bg-gray-50 border rounded shadow ${className}`} style={style}>
      <h2 className="text-lg font-bold mb-4">Notes</h2>
      <textarea
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="Write a note..."
        className="w-full p-2 border rounded mb-2"
      />
      <button
        onClick={handleAddNote}
        disabled={!noteText.trim()}
        className={`w-full p-2 rounded ${noteText.trim() ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
      >
        Add Note
      </button>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full p-2 mt-2 rounded bg-black text-white hover:bg-gray-800"
      >
        See Notes
      </button>

      {isModalOpen && (
        <div className="modal-overlay sleek-overlay">
          <div className="modal-content wider-modal sleek-modal scrollable-modal">
            <h2 className="modal-title">Your Notes</h2>
            <div className="modal-body">
              {notes.map((note, index) => (
                <div key={index} className="note-item relative">
                  {editingIndex === index ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="note-edit-input full-size-note"
                      />
                      <button
                        onClick={async () => {
                          if (!editingText.trim()) return;
                          const updatedNotes = [...notes];
                          updatedNotes[index] = editingText;
                          const { error } = await supabase
                            .from('roadmaps')
                            .update({ notes: updatedNotes })
                            .eq('id', roadmapId);

                          if (error) {
                            console.error('Error saving note:', error);
                          } else {
                            setNotes(updatedNotes);
                            setEditingIndex(null);
                            setEditingText('');
                          }
                        }}
                        className="note-action-button save"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="note-text">{note}</p>
                      <button
                        onClick={() => setDropdownOpenIndex(dropdownOpenIndex === index ? null : index)}
                        className="ellipsis-button"
                      >
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  )}
                  {dropdownOpenIndex === index && (
                    <div className="note-dropdown">
                      <button
                        onClick={() => {
                          setEditingIndex(index);
                          setEditingText(note);
                          setDropdownOpenIndex(null);
                        }}
                        className="note-dropdown-item"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteNote(index);
                          setDropdownOpenIndex(null);
                        }}
                        className="note-dropdown-item delete"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setIsModalOpen(false)} className="modal-close-button">
              Close
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Notes;
