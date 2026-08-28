import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { saveUserProfile } from '../services/db';
import CreateRoutineModal from '../components/features/CreateRoutineModal';

export default function Workout({ startEmptyWorkout, startRoutineWorkout }) {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const { showConfirm, showAlert } = useUI(); 
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);

  // --- NEW: Local state for Optimistic UI Updates ---
  const [localRoutines, setLocalRoutines] = useState([]);

  // Sync local state whenever the actual database profile loads/updates
  useEffect(() => {
    if (userProfile?.routines) {
      setLocalRoutines(userProfile.routines);
    }
  }, [userProfile]);

  const handleDeleteRoutine = async (e, routineId) => {
    e.stopPropagation(); 
    
    const confirmed = await showConfirm("Are you sure you want to delete this routine?");
    if (!confirmed) return;
    
    // 1. OPTIMISTIC UPDATE: Instantly remove it from the screen (0ms delay)
    const previousRoutines = [...localRoutines];
    const updatedRoutines = localRoutines.filter(r => r.id !== routineId);
    setLocalRoutines(updatedRoutines);
    
    // 2. BACKGROUND UPDATE: Tell Firestore to save the new array
    try {
      await saveUserProfile(currentUser.uid, { routines: updatedRoutines });
      await refreshProfile(currentUser.uid); // This updates the global context silently
    } catch (err) {
      // 3. ERROR REVERT: If Firestore fails, put the routine back and alert the user
      setLocalRoutines(previousRoutines);
      showAlert("Network error. Failed to delete routine.", "error");
    }
  };

  return (
    <div className="flex-1 w-full overflow-y-auto p-4 pb-24 bg-background">
      <h1 className="text-2xl font-bold text-accent mb-6">Start Workout</h1>

      <div className="mb-8">
        <h2 className="text-xs font-bold tracking-wider text-muted uppercase mb-3">Quick Start</h2>
        <button 
          onClick={startEmptyWorkout}
          className="w-full bg-surface p-4 rounded-xl border border-muted/10 flex flex-col items-center justify-center gap-2 hover:border-highlight/50 active:scale-[0.98] transition-all py-8"
        >
          <div className="w-12 h-12 rounded-full bg-highlight/20 text-highlight flex items-center justify-center text-2xl">
            +
          </div>
          <span className="font-bold text-accent">Empty Workout</span>
          <span className="text-xs text-muted">Build as you go</span>
        </button>
      </div>

      <div>
        <div className="flex justify-between items-end mb-3">
          <h2 className="text-xs font-bold tracking-wider text-muted uppercase">My Routines</h2>
          <button onClick={() => setIsCreatingRoutine(true)} className="text-xs font-medium text-highlight hover:text-highlight/80">
            + New Routine
          </button>
        </div>

        <div className="space-y-3">
          {localRoutines.length === 0 ? (
            <div className="text-center p-8 bg-surface rounded-xl border border-muted/10 border-dashed">
              <p className="text-muted text-sm">No routines created yet.</p>
            </div>
          ) : (
            // Use the localRoutines array here instead of userProfile.routines
            localRoutines.map((routine) => (
              <div 
                key={routine.id}
                onClick={() => startRoutineWorkout(routine)}
                className="w-full bg-surface p-4 rounded-xl border border-muted/10 hover:border-highlight/50 active:scale-[0.98] transition-all group cursor-pointer flex justify-between items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-accent text-lg mb-1 truncate">{routine.name}</h3>
                  <p className="text-xs text-muted truncate">
                    {routine.exercises.map(ex => ex.name).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-medium text-highlight bg-highlight/10 px-3 py-1.5 rounded-lg group-hover:bg-highlight group-hover:text-white transition-colors">
                    Start →
                  </span>
                  <button 
                    onClick={(e) => handleDeleteRoutine(e, routine.id)}
                    className="bg-red-500/10 text-red-500 hover:bg-red-500/20 p-2 rounded-lg transition-colors active:scale-90"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CreateRoutineModal isOpen={isCreatingRoutine} onClose={() => setIsCreatingRoutine(false)} />
    </div>
  );
}