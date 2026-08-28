import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext'; // <-- Added for custom alerts
import { getUserWorkouts, deleteWorkout } from '../services/db'; // <-- Added deleteWorkout
import WorkoutDetailModal from '../components/features/WorkoutDetailModal';

// Shimmering Skeleton Component
const HistorySkeleton = () => (
  <div className="space-y-4 w-full">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-surface rounded-xl p-4 border border-muted/10 flex flex-col gap-3 animate-pulse">
        <div className="flex flex-col border-b border-muted/10 pb-3">
          <div className="flex justify-between items-start mb-2">
            <div className="h-5 bg-muted/20 rounded w-1/2"></div>
            <div className="h-5 bg-muted/20 rounded w-16"></div>
          </div>
          <div className="h-3 bg-muted/20 rounded w-1/3"></div>
        </div>
        <div className="space-y-2 mt-1">
          <div className="flex justify-between">
            <div className="h-3 bg-muted/20 rounded w-1/3"></div>
            <div className="h-3 bg-muted/20 rounded w-8"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-3 bg-muted/20 rounded w-1/4"></div>
            <div className="h-3 bg-muted/20 rounded w-8"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function History() {
  const { currentUser } = useAuth();
  const { showConfirm, showAlert } = useUI(); // <-- Initialize UI hooks
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  useEffect(() => {
    async function loadWorkouts() {
      if (!currentUser) return;
      try {
        const data = await getUserWorkouts(currentUser.uid);
        setWorkouts(data);
      } catch (error) {
        console.error("Failed to load history");
      } finally {
        setTimeout(() => setIsLoading(false), 400); 
      }
    }
    loadWorkouts();
  }, [currentUser]);

  // --- NEW: Delete Handler ---
  const handleDeleteWorkout = async (e, workoutId) => {
    e.stopPropagation(); // Stops the click from opening the modal
    const confirmed = await showConfirm("Are you sure you want to delete this workout?");
    if (confirmed) {
      try {
        await deleteWorkout(currentUser.uid, workoutId);
        setWorkouts(prev => prev.filter(w => w.id !== workoutId));
        showAlert("Workout deleted.", "success");
      } catch (error) {
        showAlert("Failed to delete workout.", "error");
      }
    }
  };

  return (
    <div className="flex-1 w-full overflow-y-auto p-4 space-y-4 pb-24">
      <h2 className="text-xl font-bold mb-4 text-accent">Workout Log</h2>

      {isLoading ? (
        <HistorySkeleton />
      ) : workouts.length === 0 ? (
        <div className="text-center text-muted p-8 bg-surface rounded-xl border border-muted/10">
          No workouts logged yet. Get to lifting.
        </div>
      ) : (
        workouts.map((workout) => (
          <div 
            key={workout.id} 
            onClick={() => setSelectedWorkout(workout)}
            className="bg-surface rounded-xl p-4 border border-muted/10 flex flex-col gap-3 cursor-pointer hover:border-highlight/50 transition-all active:scale-[0.98] select-none relative overflow-hidden group"
          >
            {/* --- NEW: Delete Button --- */}
            <button 
              onClick={(e) => handleDeleteWorkout(e, workout.id)}
              className="absolute top-3 right-3 text-muted hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors z-10"
              title="Delete Session"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>

            <div className="flex flex-col border-b border-muted/10 pb-3 pointer-events-none pr-8">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-lg text-accent">
                  {workout.name}
                </span>
              </div>
              <div className="flex gap-2 text-xs font-medium text-highlight mb-2">
                <span className="bg-highlight/10 px-2 py-1 rounded-md">
                  Vol: {workout.totalVolume?.toLocaleString() || 0} kg
                </span>
              </div>
              <div className="flex gap-2 text-xs text-muted font-medium">
                <span>{workout.endTime ? workout.endTime.toDate().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Recent'}</span>
                <span>•</span>
                <span>{workout.endTime ? workout.endTime.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                <span>•</span>
                <span>⏱ {workout.duration || 0} min</span>
              </div>
            </div>
            
            <div className="space-y-1 pointer-events-none">
              {workout.exercises.map((exItem, idx) => {
                const completedSets = exItem.sets.filter(s => s.completed).length;
                if (completedSets === 0) return null;
                return (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted">{exItem.exercise.name}</span>
                    <span className="text-accent font-medium">{completedSets} sets</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <WorkoutDetailModal workout={selectedWorkout} onClose={() => setSelectedWorkout(null)} />
    </div>
  );
}