import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function WorkoutDetailModal({ workout, onClose }) {
  // Pull in the userProfile to get the custom AI Name and Emoji
  const { userProfile } = useAuth();

  if (!workout) return null;

  const dateStr = workout.endTime 
    ? workout.endTime.toDate().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) 
    : 'Recent Workout';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Bottom Sheet */}
      <div className="relative bg-surface w-full max-w-md mx-auto rounded-t-3xl border-t border-muted/20 p-6 pb-12 max-h-[85vh] overflow-y-auto shadow-2xl transition-transform animate-slide-up">
        
        {/* Drag Handle & Header */}
        <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-6"></div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-accent">{workout.name || 'Workout Session'}</h2>
            <div className="flex gap-3 text-sm font-medium mt-1">
              <span className="text-muted">{dateStr}</span>
              <span className="text-highlight">⏱ {workout.duration || 0} min</span>
            </div>
          </div>
          <button onClick={onClose} className="bg-background p-2 rounded-full text-muted hover:text-accent">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* AI Coach Analysis Section */}
        {workout.aiInsight && (
          <div className="bg-highlight/10 border border-highlight/20 p-4 rounded-xl mb-6 relative overflow-hidden shadow-sm">
            {/* Dynamic Emoji Injection */}
            <div className="absolute -top-4 -right-2 text-6xl opacity-10 select-none pointer-events-none">
              {userProfile?.aiEmoji || '🤖'}
            </div>
            
            {/* Dynamic Name Injection */}
            <h3 className="text-xs font-bold tracking-wider text-highlight uppercase mb-2">
              {userProfile?.aiName || 'Coach'}'s Analysis
            </h3>
            
            <p className="text-sm text-accent font-medium leading-relaxed relative z-10">
              "{workout.aiInsight}"
            </p>
          </div>
        )}

        {/* Exercise Breakdown */}
        <div className="space-y-6">
          {workout.exercises.map((exItem, idx) => {
            const completedSets = exItem.sets.filter(s => s.completed);
            if (completedSets.length === 0) return null;

            return (
              <div key={idx} className="bg-background rounded-xl p-4 border border-muted/10 shadow-sm">
                <h3 className="font-bold text-accent mb-3">{exItem.exercise.name}</h3>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted mb-2 px-2">
                  <div>SET</div>
                  <div className="text-center">KG</div>
                  <div className="text-right">REPS</div>
                </div>
                <div className="space-y-1">
                  {completedSets.map((set, sIdx) => (
                    <div key={sIdx} className="grid grid-cols-3 gap-2 text-sm p-2 rounded-lg bg-surface/50 transition-colors">
                      <div className="font-medium text-muted">{sIdx + 1}</div>
                      <div className="text-center text-accent font-medium">{set.weight}</div>
                      <div className="text-right text-accent font-medium">{set.reps}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}