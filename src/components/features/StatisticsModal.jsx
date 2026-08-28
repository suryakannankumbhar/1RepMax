import React, { useMemo } from 'react';

export default function StatisticsModal({ isOpen, onClose, workouts }) {
  const stats = useMemo(() => {
    if (!workouts || workouts.length === 0) return null;
    
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    let totalDuration = 0;
    
    const muscleSetCounts = {};
    const muscleVolumeCounts = {};
    const monthlyVolume = {};
    const dayOfWeekCounts = new Array(7).fill(0);
    const timeOfDayCounts = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    const exerciseCounts = {};
    
    let workoutsThisMonth = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    workouts.forEach(w => {
      totalVolume += (w.totalVolume || 0);
      totalDuration += (w.duration || 0);
      
      // Parse dates for time-based graphs
      if (w.endTime) {
        const date = w.endTime.toDate();
        const monthKey = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        
        monthlyVolume[monthKey] = (monthlyVolume[monthKey] || 0) + (w.totalVolume || 0);
        dayOfWeekCounts[date.getDay()] += 1;
        
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          workoutsThisMonth += 1;
        }

        // Time of Day Logic
        const hour = date.getHours();
        if (hour >= 5 && hour < 12) timeOfDayCounts['Morning'] += 1;
        else if (hour >= 12 && hour < 17) timeOfDayCounts['Afternoon'] += 1;
        else if (hour >= 17 && hour < 21) timeOfDayCounts['Evening'] += 1;
        else timeOfDayCounts['Night'] += 1;
      }

      w.exercises.forEach(exItem => {
        const muscle = exItem.exercise?.muscleGroup || exItem.exercise?.muscle || 'Other';
        const exName = exItem.exercise?.name || 'Unknown';
        const completedSets = exItem.sets.filter(s => s.completed);
        
        totalSets += completedSets.length;
        if (!exerciseCounts[exName]) exerciseCounts[exName] = { sets: 0, volume: 0 };
        
        completedSets.forEach(set => {
          const reps = parseInt(set.reps, 10) || 0;
          const weight = parseFloat(set.weight) || 0;
          const setVolume = reps * weight;

          totalReps += reps;
          muscleSetCounts[muscle] = (muscleSetCounts[muscle] || 0) + 1;
          muscleVolumeCounts[muscle] = (muscleVolumeCounts[muscle] || 0) + setVolume;
          
          exerciseCounts[exName].sets += 1;
          exerciseCounts[exName].volume += setVolume;
        });
      });
    });

    // 1. Muscle Distribution (By Sets & Load)
    const muscleDistribution = Object.entries(muscleSetCounts)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / totalSets) * 100) }))
      .sort((a, b) => b.count - a.count);

    const maxMuscleVol = Math.max(...Object.values(muscleVolumeCounts), 1);
    const volumeDistribution = Object.entries(muscleVolumeCounts)
      .map(([name, volume]) => ({ name, volume, percentage: (volume / maxMuscleVol) * 100 }))
      .sort((a, b) => b.volume - a.volume);

    // 2. Monthly Rolling Graph
    const monthlyLabels = [];
    const monthlyValues = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      monthlyLabels.push(key);
      monthlyValues.push(monthlyVolume[key] || 0);
    }
    const maxMonthVol = Math.max(...monthlyValues, 1);
    const monthlyHeights = monthlyValues.map(v => (v / maxMonthVol) * 100);

    // 3. Day of Week Heatmap
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const maxDayCount = Math.max(...dayOfWeekCounts, 1);
    const dayOfWeekChart = days.map((day, i) => ({
      day, count: dayOfWeekCounts[i], height: (dayOfWeekCounts[i] / maxDayCount) * 100
    }));

    // 4. Time of Day Distribution
    const maxTimeCount = Math.max(...Object.values(timeOfDayCounts), 1);
    const timeOfDayDistribution = Object.entries(timeOfDayCounts)
      .map(([period, count]) => ({ period, count, percentage: (count / maxTimeCount) * 100 }))
      .filter(t => t.count > 0)
      .sort((a, b) => b.count - a.count);

    // 5. Top Exercises Leaderboard
    const topExercises = Object.entries(exerciseCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sets - a.sets)
      .slice(0, 3);

    // 6. Advanced Averages & Classifications
    const avgRepsPerSet = totalSets > 0 ? (totalReps / totalSets).toFixed(1) : 0;
    let trainingStyle = "Hybrid";
    if (avgRepsPerSet > 0 && avgRepsPerSet < 6) trainingStyle = "Strength / Power";
    else if (avgRepsPerSet >= 6 && avgRepsPerSet <= 12) trainingStyle = "Hypertrophy";
    else if (avgRepsPerSet > 12) trainingStyle = "Endurance";

    const volPerMinute = totalDuration > 0 ? Math.round(totalVolume / totalDuration) : 0;

    return {
      totalWorkouts: workouts.length,
      workoutsThisMonth,
      totalVolume,
      totalSets,
      totalReps,
      avgDuration: Math.round(totalDuration / workouts.length) || 0,
      avgVolume: Math.round(totalVolume / workouts.length) || 0,
      avgRepsPerSet,
      volPerMinute,
      trainingStyle,
      muscleDistribution,
      volumeDistribution,
      timeOfDayDistribution,
      topExercises,
      monthlyChart: { labels: monthlyLabels, heights: monthlyHeights, values: monthlyValues },
      dayOfWeekChart
    };
  }, [workouts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-surface w-full max-w-md mx-auto rounded-t-3xl border-t border-muted/20 p-6 pb-12 max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up flex flex-col">
        <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-6 flex-shrink-0"></div>
        
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-accent">Analytics</h2>
          <button onClick={onClose} className="bg-background p-2 rounded-full text-muted hover:text-accent">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {stats ? (
          <div className="space-y-6">
            
            {/* Primary Volume & Consistency Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background p-4 rounded-xl border border-muted/10">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-muted mb-1">Lifetime Volume</span>
                <span className="text-lg font-bold text-highlight">{stats.totalVolume.toLocaleString()} kg</span>
              </div>
              <div className="bg-background p-4 rounded-xl border border-muted/10">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-muted mb-1">Total Workouts</span>
                <span className="text-lg font-bold text-accent">{stats.totalWorkouts}</span>
              </div>
              <div className="bg-background p-4 rounded-xl border border-muted/10">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-muted mb-1">Total Sets</span>
                <span className="text-lg font-bold text-accent">{stats.totalSets.toLocaleString()}</span>
              </div>
              <div className="bg-background p-4 rounded-xl border border-muted/10">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-muted mb-1">Total Reps</span>
                <span className="text-lg font-bold text-accent">{stats.totalReps.toLocaleString()}</span>
              </div>
            </div>

            {/* Performance & Physiological Markers */}
            <div className="bg-background p-4 rounded-xl border border-muted/10">
              <h3 className="text-xs font-bold tracking-wider text-muted uppercase mb-4 border-b border-muted/5 pb-2">Physiological Profile</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div>
                  <span className="block text-xs text-muted">Primary Style</span>
                  <span className="font-bold text-highlight text-sm">{stats.trainingStyle}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted">Avg Reps/Set</span>
                  <span className="font-bold text-accent text-sm">{stats.avgRepsPerSet} reps</span>
                </div>
                <div>
                  <span className="block text-xs text-muted">Avg Session</span>
                  <span className="font-bold text-accent text-sm">⏱ {stats.avgDuration} min</span>
                </div>
                <div>
                  <span className="block text-xs text-muted">Intensity Level</span>
                  <span className="font-bold text-accent text-sm">{stats.volPerMinute.toLocaleString()} kg/min</span>
                </div>
              </div>
            </div>

            {/* Top Exercises Leaderboard */}
            <div className="bg-background p-4 rounded-xl border border-muted/10">
              <h3 className="text-xs font-bold tracking-wider text-muted uppercase mb-3 border-b border-muted/5 pb-2">Top 3 Exercises</h3>
              <div className="space-y-3">
                {stats.topExercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-highlight/10 text-highlight flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 flex justify-between items-center text-sm">
                      <span className="font-medium text-accent truncate pr-2">{ex.name}</span>
                      <div className="text-right shrink-0">
                        <span className="block font-bold text-accent">{ex.sets} sets</span>
                        <span className="block text-[10px] text-muted">{ex.volume.toLocaleString()} kg</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time of Day Preference */}
            <div className="bg-background p-4 rounded-xl border border-muted/10 space-y-3">
              <h3 className="text-xs font-bold tracking-wider text-muted uppercase border-b border-muted/5 pb-2">Time of Day Preference</h3>
              {stats.timeOfDayDistribution.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-accent">{item.period}</span>
                    <span className="text-muted">{item.count} sessions</span>
                  </div>
                  <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-highlight rounded-full transition-all duration-500" style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Day of Week Heatmap */}
            <div className="bg-background p-4 rounded-xl border border-muted/10">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xs font-bold tracking-wider text-muted uppercase">Activity by Day</h3>
                <span className="text-[10px] text-muted">Frequency</span>
              </div>
              <div className="h-20 w-full flex items-end justify-between gap-2 border-b border-surface pb-1">
                {stats.dayOfWeekChart.map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-6 text-[10px] bg-surface border border-muted/20 px-1.5 py-0.5 rounded text-accent transition-opacity z-30">
                      {item.count}
                    </div>
                    <div className="w-full bg-highlight/60 rounded-t transition-all duration-500 hover:bg-highlight" style={{ height: `${item.height}%`, minHeight: item.height > 0 ? '4px' : '0' }}></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted mt-2 font-medium">
                {stats.dayOfWeekChart.map((item, idx) => <span key={idx} className="flex-1 text-center">{item.day}</span>)}
              </div>
            </div>

            {/* 6-Month Macro Progress Graph */}
            <div className="bg-background p-4 rounded-xl border border-muted/10">
              <h3 className="text-xs font-bold tracking-wider text-muted uppercase mb-4">Monthly Volume Trend</h3>
              <div className="h-28 w-full flex items-end justify-between gap-3 px-2 border-b border-surface pb-1">
                {stats.monthlyChart.heights.map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-7 text-[9px] bg-surface border border-muted/20 px-1.5 py-0.5 rounded text-accent transition-opacity whitespace-nowrap z-30">
                      {stats.monthlyChart.values[i].toLocaleString()} kg
                    </div>
                    <div className="w-full bg-highlight rounded-t bg-gradient-to-t from-highlight to-highlight/70 transition-all duration-500" style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted mt-2 font-medium">
                {stats.monthlyChart.labels.map((lbl, idx) => <span key={idx} className="flex-1 text-center">{lbl}</span>)}
              </div>
            </div>

            {/* Workload Distribution (By Volume/KG) */}
            <div className="bg-background p-4 rounded-xl border border-muted/10 space-y-3">
              <h3 className="text-xs font-bold tracking-wider text-muted uppercase border-b border-muted/5 pb-2">Load Distribution (KG)</h3>
              {stats.volumeDistribution.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-accent">{item.name}</span>
                    <span className="text-muted">{item.volume.toLocaleString()} kg</span>
                  </div>
                  <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-highlight/50 rounded-full transition-all duration-500" style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Muscle Group Split (By Sets) */}
            <div className="bg-background p-4 rounded-xl border border-muted/10 space-y-3">
              <h3 className="text-xs font-bold tracking-wider text-muted uppercase border-b border-muted/5 pb-2">Set Distribution</h3>
              {stats.muscleDistribution.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-accent">{item.name}</span>
                    <span className="text-muted">{item.count} sets</span>
                  </div>
                  <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-highlight rounded-full transition-all duration-500" style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          <p className="text-center text-muted py-8">No workout benchmarks computed yet.</p>
        )}
      </div>
    </div>
  );
}