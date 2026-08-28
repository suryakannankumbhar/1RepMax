import React, { useState, useMemo, useEffect } from 'react';
import exercisesData from '../../data/exercises.json';
import { useAuth } from '../../context/AuthContext';
import { performSmartSearch, initModel } from '../../services/ml';

export default function ExerciseSelector({ onSelect, onClose, addedExerciseIds = [] }) {
  const { userProfile } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('normal');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [smartResults, setSmartResults] = useState(null);
  const [hasSearched, setHasSearched] = useState(false); // NEW: Track if they hit 'Ask'

  const aiName = userProfile?.aiName || 'Coach';
  const aiEmoji = userProfile?.aiEmoji || '🤖';

  useEffect(() => { initModel().catch(console.error); }, []);

  const normalFilteredExercises = useMemo(() => {
    const term = (searchQuery || '').toLowerCase().trim();
    const available = exercisesData.filter(ex => !addedExerciseIds.includes(ex.id));
    if (!term) return available;
    return available.filter(ex => 
      (ex.name || '').toLowerCase().includes(term) || 
      (ex.muscleGroup || '').toLowerCase().includes(term)
    );
  }, [searchQuery, addedExerciseIds]);

  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiLoading(true);
    setHasSearched(true); // User performed action
    try {
      const available = exercisesData.filter(ex => !addedExerciseIds.includes(ex.id));
      const results = await performSmartSearch(searchQuery, available);
      setSmartResults(results);
    } catch (e) {
      console.error(e);
      setSmartResults([]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Reset state when changing modes
  const switchMode = (mode) => {
    setSearchMode(mode);
    setHasSearched(false);
    setSearchQuery('');
    setSmartResults(null);
  };

  const displayedExercises = searchMode === 'smart' 
    ? (hasSearched ? (smartResults || []) : []) 
    : normalFilteredExercises;

  return (
    <div className="absolute inset-0 bg-background z-50 flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-4 border-b border-surface sticky top-0 bg-background flex flex-col gap-4 shadow-sm z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Add Exercise</h2>
          <button onClick={onClose} className="text-muted hover:text-accent p-2">Cancel</button>
        </div>

        <div className="flex bg-surface rounded-lg p-1 border border-muted/10">
          <button onClick={() => switchMode('normal')} className={`flex-1 text-xs font-bold py-2 rounded-md ${searchMode === 'normal' ? 'bg-background text-accent' : 'text-muted'}`}>Standard Search</button>
          <button onClick={() => switchMode('smart')} className={`flex-1 text-xs font-bold py-2 rounded-md ${searchMode === 'smart' ? 'bg-highlight/20 text-highlight' : 'text-muted'}`}>Ask {aiName}</button>
        </div>

        <div className="flex gap-2">
          <input 
            type="text"
            placeholder={searchMode === 'smart' ? "e.g. 'I want wider shoulders'" : "Search exercises..."}
            className="w-full bg-surface text-accent p-3 rounded-lg outline-none border border-transparent focus:border-highlight"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setHasSearched(false); }}
          />
          {searchMode === 'smart' && (
            <button onClick={handleSmartSearch} className="bg-highlight text-white px-5 rounded-lg font-bold text-sm">Ask</button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 relative">
        
        {/* NEW: Empty State for Smart Search */}
        {searchMode === 'smart' && !hasSearched && !isAiLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted">
            <div className="text-6xl mb-4">{aiEmoji}</div>
            <h3 className="font-bold text-accent">Ask {aiName} for help</h3>
            <p className="text-sm mt-1">"I want to grow my upper chest" or "Best legs exercises"</p>
          </div>
        )}

        {isAiLoading && (
          <div className="flex flex-col items-center justify-center h-48">
            <div className="text-4xl animate-bounce mb-2">{aiEmoji}</div>
            <p className="text-sm font-bold text-highlight">{aiName} is thinking...</p>
          </div>
        )}

        {!isAiLoading && displayedExercises.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => onSelect(exercise)}
            className="w-full text-left p-4 bg-surface rounded-xl active:bg-highlight/20 flex flex-col border border-transparent"
          >
            <div className="flex justify-between items-center w-full">
              <span className="font-bold text-accent">{exercise.name}</span>
              <span className="text-[10px] font-bold uppercase text-muted bg-background px-2 py-1 rounded">
                {exercise.muscleGroup || 'Other'}
              </span>
            </div>
            {searchMode === 'smart' && hasSearched && (
              <p className="text-xs text-muted mt-2 pt-2 border-t border-muted/10">{exercise.description}</p>
            )}
          </button>
        ))}

        {hasSearched && !isAiLoading && displayedExercises.length === 0 && (
          <div className="text-center text-muted mt-8">No exercises found for that request.</div>
        )}
      </div>
    </div>
  );
}