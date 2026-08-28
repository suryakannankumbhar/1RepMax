import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { saveUserProfile } from '../../services/db';

// --- LIVE TIMER COMPONENT ---
function LiveTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60000).toString().padStart(2, '0');
  const secs = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');

  return <span className="font-mono text-highlight bg-highlight/10 px-2 py-1 rounded-md text-sm">{mins}:{secs}</span>;
}


// --- MAIN WORKOUT LOGGER COMPONENT ---
export default function WorkoutLogger({ activeWorkout, updateWorkout, cancelWorkout }) {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const { showAlert, showConfirm } = useUI(); 
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);

  const handleNameChange = (e) => {
    updateWorkout({ ...activeWorkout, name: e.target.value });
  };

  const addSet = (exerciseIndex) => {
    const updatedWorkout = { ...activeWorkout };
    const currentSets = updatedWorkout.exercises[exerciseIndex].sets;
    
    let lastWeight = '';
    let lastReps = '';

    if (currentSets.length > 0) {
      const lastSet = currentSets[currentSets.length - 1];
      lastWeight = lastSet.weight;
      lastReps = lastSet.reps;
    }

    currentSets.push({ weight: lastWeight, reps: lastReps, completed: false });
    updateWorkout(updatedWorkout);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.exercises[exerciseIndex].sets[setIndex][field] = value;
    updateWorkout(updatedWorkout);
  };

  const toggleSetComplete = (exerciseIndex, setIndex) => {
    const updatedWorkout = { ...activeWorkout };
    const set = updatedWorkout.exercises[exerciseIndex].sets[setIndex];

    if (!set.completed) {
      const weightNum = parseFloat(set.weight);
      const repsNum = parseInt(set.reps, 10);
      
      if (isNaN(weightNum) || weightNum <= 0 || isNaN(repsNum) || repsNum <= 0) {
        showAlert("Please enter a valid weight and rep count to complete this set.");
        return; 
      }
    }

    set.completed = !set.completed;
    updateWorkout(updatedWorkout);
  };

  // --- NEW: Remove a specific set ---
  const removeSet = (exerciseIndex, setIndex) => {
    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.exercises[exerciseIndex].sets.splice(setIndex, 1);
    updateWorkout(updatedWorkout);
  };

  const removeExercise = async (exerciseIndex) => {
    const confirmed = await showConfirm("Are you sure you want to remove this exercise?");
    if (confirmed) {
      const updatedWorkout = { ...activeWorkout };
      updatedWorkout.exercises.splice(exerciseIndex, 1);
      updateWorkout(updatedWorkout);
    }
  };

  const handleSaveAsRoutine = async () => {
    if (activeWorkout.exercises.length === 0) return showAlert("Add some exercises first!");
    
    let routineName = activeWorkout.name;
    if (!routineName?.trim()) {
      routineName = window.prompt("Enter a name for this routine:", "My Custom Routine");
      if (!routineName) return; 
    }

    setIsSavingRoutine(true);
    try {
      const newRoutine = {
        id: Date.now().toString(),
        name: routineName,
        exercises: activeWorkout.exercises.map(exItem => exItem.exercise)
      };
      const updatedRoutines = [...(userProfile?.routines || []), newRoutine];
      await saveUserProfile(currentUser.uid, { routines: updatedRoutines });
      await refreshProfile(currentUser.uid);
      showAlert("Saved to your routines!", "success");
    } catch (err) {
      showAlert("Failed to save routine.", "error");
    } finally {
      setIsSavingRoutine(false);
    }
  };

  // --- BUG FIX: Check if startTime exists, NOT if exercises are empty ---
  if (!activeWorkout?.startTime) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
        <div className="text-7xl mb-6 drop-shadow-lg">💪🏾</div>
        <h2 className="text-2xl font-bold text-accent mb-2 tracking-tight">No active session</h2>
        <p className="text-sm text-muted max-w-[220px]">
          Head over to the Workout tab to start a new session or routine.
        </p>
      </div>
    );
  }

  // --- ACTIVE WORKOUT UI ---
  return (
    <div className="space-y-6 pb-24">
      
      {/* Session Header Card */}
      <div className="bg-surface rounded-xl p-4 border border-muted/10 flex flex-col gap-3 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-muted tracking-wider uppercase">Current Session</span>
          <LiveTimer startTime={activeWorkout.startTime} />
        </div>
        <input 
          type="text"
          placeholder="Workout Name (e.g., Pull Day)"
          value={activeWorkout.name || ''}
          onChange={handleNameChange}
          className="w-full bg-transparent text-xl font-bold text-accent outline-none placeholder-muted/40 border-b border-transparent focus:border-highlight/50 transition-colors pb-1"
        />
        
        {/* Save as Routine Button */}
        <button 
          onClick={handleSaveAsRoutine}
          disabled={isSavingRoutine}
          className="w-full mt-2 py-2 bg-surface border border-highlight/30 text-highlight rounded-lg text-sm font-medium hover:bg-highlight/10 transition-colors"
        >
          {isSavingRoutine ? 'Saving...' : '★ Save as Routine'}
        </button>
      </div>

      {/* Empty Exercises Helper State */}
      {activeWorkout.exercises.length === 0 ? (
        <div className="text-center p-8 bg-surface/50 rounded-xl border border-dashed border-muted/20 animate-pulse">
          <p className="text-muted text-sm font-medium">Timer is running! Tap the <span className="text-highlight font-bold">+</span> button to add your first exercise.</p>
        </div>
      ) : (
        /* Exercise List */
        activeWorkout.exercises.map((exItem, exerciseIndex) => (
          <div key={exerciseIndex} className="bg-surface rounded-xl p-4 border border-muted/10 shadow-sm relative">
            
            <div className="flex justify-between items-start mb-4 pr-8">
              <h3 className="font-bold text-lg text-accent leading-tight">{exItem.exercise.name}</h3>
              
              <button 
                onClick={() => removeExercise(exerciseIndex)}
                className="absolute top-3 right-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 p-2 rounded-lg active:scale-90 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px] font-bold tracking-wider text-muted text-center mb-2 px-2">
              <div>SET</div>
              <div>KG</div>
              <div>REPS</div>
              <div>DONE</div>
            </div>

            <div className="space-y-2">
              {exItem.sets.map((set, setIndex) => (
                <div 
                  key={setIndex} 
                  className={`grid grid-cols-4 gap-2 items-center text-center p-2 rounded-lg transition-colors ${set.completed ? 'bg-highlight/10' : 'bg-background'}`}
                >
                  {/* --- NEW: Delete Button + Set Number --- */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => removeSet(exerciseIndex, setIndex)}
                      className="text-muted hover:text-red-400 text-xs font-bold p-1 transition-colors"
                      title="Remove Set"
                    >
                      ✕
                    </button>
                    <span className="text-sm font-medium text-muted">{setIndex + 1}</span>
                  </div>

                  <div>
                    <input type="number" inputMode="decimal" placeholder="-" value={set.weight} onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)} disabled={set.completed} className="w-full bg-transparent text-center text-accent outline-none font-medium placeholder-muted/30 disabled:opacity-50" />
                  </div>
                  <div>
                    <input type="number" inputMode="numeric" placeholder="-" value={set.reps} onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)} disabled={set.completed} className="w-full bg-transparent text-center text-accent outline-none font-medium placeholder-muted/30 disabled:opacity-50" />
                  </div>
                  <div className="flex justify-center">
                    <button onClick={() => toggleSetComplete(exerciseIndex, setIndex)} className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${set.completed ? 'bg-highlight text-white shadow-md shadow-highlight/20' : 'bg-surface border border-muted/30 text-transparent hover:border-highlight'}`}>✓</button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => addSet(exerciseIndex)} className="mt-4 w-full py-2.5 text-sm font-medium text-highlight bg-highlight/10 rounded-lg hover:bg-highlight/20 transition-colors">
              + Add Set
            </button>
          </div>
        ))
      )}

      {/* Cancel Workout Button */}
      <div className="pt-8">
        <button 
          onClick={cancelWorkout}
          className="w-full py-4 text-sm font-bold text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 active:scale-95 transition-all border border-transparent hover:border-red-500/30"
        >
          Cancel Workout
        </button>
      </div>

    </div>
  );
}