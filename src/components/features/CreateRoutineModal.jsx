import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveUserProfile } from '../../services/db';
import ExerciseSelector from './ExerciseSelector';

export default function CreateRoutineModal({ isOpen, onClose }) {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddExercise = (exercise) => {
    setExercises([...exercises, exercise]);
    setIsSelecting(false);
  };

  const removeExercise = (indexToRemove) => {
    setExercises(exercises.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveRoutine = async () => {
    if (!name.trim()) return alert("Please give your routine a name.");
    if (exercises.length === 0) return alert("Add at least one exercise.");

    setIsSaving(true);
    try {
      const newRoutine = { id: Date.now().toString(), name, exercises };
      const updatedRoutines = [...(userProfile?.routines || []), newRoutine];
      
      await saveUserProfile(currentUser.uid, { routines: updatedRoutines });
      await refreshProfile(currentUser.uid);
      
      setName('');
      setExercises([]);
      onClose();
    } catch (error) {
      alert("Failed to save routine.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-surface w-full max-w-md mx-auto rounded-t-3xl border-t border-muted/20 p-6 pb-12 max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up flex flex-col">
        
        <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-6 flex-shrink-0"></div>
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-accent">New Routine</h2>
          <button onClick={onClose} className="text-sm text-muted hover:text-accent font-medium">Cancel</button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Routine Name</label>
            <input 
              type="text" 
              placeholder="e.g., Heavy Push Day" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full bg-background text-accent p-3 rounded-lg outline-none border border-muted/10 focus:border-highlight transition-colors" 
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-xs font-medium text-muted">Exercises</label>
              <span className="text-[10px] text-highlight">{exercises.length} added</span>
            </div>
            
            <div className="space-y-2 mb-4">
              {exercises.map((ex, idx) => (
                <div key={idx} className="bg-background p-3 rounded-xl border border-muted/10 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-sm text-accent block">{ex.name}</span>
                    <span className="text-[10px] text-muted uppercase tracking-wider">{ex.muscleGroup || ex.muscle || 'Other'}</span>
                  </div>
                  
                  {/* Highly Visible Remove Button */}
                  <button 
                    onClick={() => removeExercise(idx)} 
                    className="bg-red-500/10 text-red-500 hover:bg-red-500/20 p-2 rounded-lg active:scale-90 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setIsSelecting(true)}
              className="w-full py-3 bg-highlight/10 text-highlight font-medium rounded-xl border border-dashed border-highlight/30 hover:bg-highlight/20 transition-colors"
            >
              + Add Exercise
            </button>
          </div>

          <button 
            onClick={handleSaveRoutine}
            disabled={isSaving}
            className="w-full bg-highlight text-white font-semibold py-4 rounded-xl active:scale-95 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-highlight/20"
          >
            {isSaving ? 'Saving...' : 'Save Routine'}
          </button>
        </div>
      </div>

      {isSelecting && (
        <ExerciseSelector 
          onClose={() => setIsSelecting(false)} 
          onSelect={handleAddExercise} 
          addedExerciseIds={exercises.map(ex => ex.id)}
        />
      )}
    </div>
  );
}