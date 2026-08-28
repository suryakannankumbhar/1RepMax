import React, { useMemo, useState } from 'react';

export default function ExercisesModal({ isOpen, onClose, workouts }) {
  const [expandedExercise, setExpandedExercise] = useState(null);

  const exerciseRecords = useMemo(() => {
    if (!workouts || workouts.length === 0) return [];
    const records = {};

    // Sort from oldest to newest to plot accurate progression timelines
    [...workouts].reverse().forEach(w => {
      const dateStr = w.endTime 
        ? w.endTime.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
        : 'Recent';

      w.exercises.forEach(exItem => {
        const name = exItem.exercise.name;
        if (!records[name]) {
          records[name] = { maxWeight: 0, estimated1RM: 0, totalSets: 0, history: [] };
        }
        
        let workoutMax1RM = 0;
        let workoutMaxWeight = 0;

        exItem.sets.forEach(set => {
          if (set.completed && set.weight && set.reps) {
            const wVal = parseFloat(set.weight);
            const rVal = parseInt(set.reps, 10);
            
            records[name].totalSets += 1;
            if (wVal > records[name].maxWeight) records[name].maxWeight = wVal;
            if (wVal > workoutMaxWeight) workoutMaxWeight = wVal;
            
            // Epley 1RM Formula: Weight * (1 + Reps / 30)
            const e1rm = Math.round(wVal * (1 + (rVal / 30)));
            if (e1rm > records[name].estimated1RM) records[name].estimated1RM = e1rm;
            if (e1rm > workoutMax1RM) workoutMax1RM = e1rm;
          }
        });

        if (workoutMax1RM > 0) {
          records[name].history.push({
            date: dateStr,
            maxWeight: workoutMaxWeight,
            estimated1RM: workoutMax1RM
          });
        }
      });
    });

    // Format array and rank from most targeted to least targeted movement pattern
    return Object.entries(records)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalSets - a.totalSets);
  }, [workouts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-surface w-full max-w-md mx-auto rounded-t-3xl border-t border-muted/20 p-6 pb-12 max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up flex flex-col">
        <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-6 flex-shrink-0"></div>
        
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-accent">Exercises</h2>
          <button onClick={onClose} className="bg-background p-2 rounded-full text-muted hover:text-accent">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto pr-1">
          {exerciseRecords.length === 0 ? (
            <p className="text-center text-muted py-8">No specific exercise volume logs captured yet.</p>
          ) : (
            exerciseRecords.map((ex, idx) => {
              const isExpanded = expandedExercise === ex.name;
              
              return (
                <div 
                  key={idx} 
                  className="bg-background rounded-xl border border-muted/10 overflow-hidden transition-all"
                >
                  {/* Summary Card Header Triggers Dropdown Accordion */}
                  <div 
                    onClick={() => setExpandedExercise(isExpanded ? null : ex.name)}
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-surface/30 active:bg-surface/50 transition-colors select-none"
                  >
                    <div>
                      <h3 className="font-bold text-accent text-base">{ex.name}</h3>
                      <span className="text-xs text-muted font-medium">{ex.totalSets} total sets performed</span>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Peak 1RM</div>
                        <div className="font-black text-highlight text-lg">{ex.estimated1RM} kg</div>
                      </div>
                      <span className={`text-muted text-xs transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Expanding Progressive Overload History Map */}
                  {isExpanded && (
                    <div className="bg-surface/30 border-t border-muted/5 p-4 px-6 space-y-3 animate-slide-up">
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Progressive Overload Timeline</h4>
                      <div className="relative border-l-2 border-surface pl-4 ml-2 space-y-4">
                        {[...ex.history].reverse().map((entry, hIdx) => (
                          <div key={hIdx} className="relative">
                            {/* Circle Indicator */}
                            <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full bg-highlight border-2 border-background"></div>
                            <div className="flex justify-between items-start text-xs">
                              <div>
                                <span className="font-bold text-accent block text-sm">{entry.estimated1RM} kg <span className="text-[10px] font-normal text-muted">Est. Max</span></span>
                                <span className="text-muted text-[11px]">Top Load: {entry.maxWeight} kg</span>
                              </div>
                              <span className="text-muted font-medium bg-background border border-muted/10 px-2 py-0.5 rounded-md text-[10px]">{entry.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}