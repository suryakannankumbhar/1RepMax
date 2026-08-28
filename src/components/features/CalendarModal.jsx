import React, { useMemo, useState } from 'react';

export default function CalendarModal({ isOpen, onClose, workouts }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateObj, setSelectedDateObj] = useState(null);

  // Generate the calendar grid logic and attach workout data to specific days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    const totalDays = lastDay.getDate();

    // Map workouts to their specific day of the month
    const workoutsByDay = {};
    if (workouts) {
      workouts.forEach(w => {
        if (w.endTime) {
          const d = w.endTime.toDate();
          if (d.getMonth() === month && d.getFullYear() === year) {
            const day = d.getDate();
            if (!workoutsByDay[day]) workoutsByDay[day] = [];
            workoutsByDay[day].push(w);
          }
        }
      });
    }

    const days = [];
    // Pad empty days at the start of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add actual days with attached workout data
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        workouts: workoutsByDay[i] || [],
        hasWorkout: !!workoutsByDay[i],
        isToday: i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
      });
    }
    return days;
  }, [currentDate, workouts]);

  // Handle changing months (and clear selection)
  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    setSelectedDateObj(null);
  };

  if (!isOpen) return null;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-surface w-full max-w-md mx-auto rounded-t-3xl border-t border-muted/20 p-6 pb-12 shadow-2xl animate-slide-up flex flex-col">
        <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-6"></div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-accent">Calendar</h2>
          <button onClick={onClose} className="bg-background p-2 rounded-full text-muted hover:text-accent">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-6 bg-background p-3 rounded-xl border border-muted/10">
          <button 
            onClick={() => changeMonth(-1)}
            className="p-1 text-muted hover:text-accent active:scale-90 transition-transform"
          >&larr;</button>
          <span className="font-bold text-accent">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <button 
            onClick={() => changeMonth(1)}
            className="p-1 text-muted hover:text-accent active:scale-90 transition-transform"
          >&rarr;</button>
        </div>

        {/* Grid Header */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-muted">
          {weekDays.map(day => <div key={day}>{day}</div>)}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarDays.map((dateObj, idx) => (
            <div key={idx} className="aspect-square flex flex-col items-center justify-center relative p-1">
              {dateObj ? (
                <button 
                  onClick={() => dateObj.hasWorkout ? setSelectedDateObj(dateObj) : setSelectedDateObj(null)}
                  className={`w-full h-full flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    dateObj.isToday ? 'border border-highlight' : ''
                  } ${
                    selectedDateObj?.day === dateObj.day 
                      ? 'bg-highlight text-white shadow-md shadow-highlight/20 scale-105'
                      : dateObj.hasWorkout 
                        ? 'bg-highlight/20 text-highlight hover:bg-highlight/30' 
                        : 'bg-background hover:bg-surface text-accent'
                  }`}
                >
                  {dateObj.day}
                </button>
              ) : null}
            </div>
          ))}
        </div>
        
        {/* Conditional Footer: Workout Summary OR Legend */}
        {selectedDateObj && selectedDateObj.hasWorkout ? (
          <div className="mt-6 animate-slide-up">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold tracking-wider text-muted uppercase">
                {new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDateObj.day).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <button onClick={() => setSelectedDateObj(null)} className="text-xs text-muted hover:text-accent font-medium">Clear</button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {selectedDateObj.workouts.map((w, idx) => (
                <div key={idx} className="bg-background p-3 rounded-xl border border-muted/10 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-accent">{w.name || 'Workout Session'}</span>
                    <span className="text-xs text-highlight font-medium bg-highlight/10 px-2 py-0.5 rounded-md">⏱ {w.duration || 0} min</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted font-medium mt-1">
                    <span>Vol: {w.totalVolume?.toLocaleString() || 0} kg</span>
                    <span>Exercises: {w.exercises?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-6 justify-center text-xs text-muted">
            <div className="w-3 h-3 rounded bg-highlight/20 border border-highlight/50"></div>
            <span>Workout Logged</span>
          </div>
        )}

      </div>
    </div>
  );
}