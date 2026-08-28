import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserWorkouts } from '../services/db';

// Modals
import WorkoutDetailModal from '../components/features/WorkoutDetailModal';
import EditProfileModal from '../components/features/EditProfileModal';
import StatisticsModal from '../components/features/StatisticsModal';
import ExercisesModal from '../components/features/ExercisesModal';
import CalendarModal from '../components/features/CalendarModal';
import MeasuresModal from '../components/features/MeasuresModal';

export default function Profile() {
  const { currentUser, userProfile } = useAuth();
  
  // States
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeDashboardModal, setActiveDashboardModal] = useState(null);

  // Fetch Data
  useEffect(() => {
    async function loadStats() {
      if (!currentUser) return;
      const data = await getUserWorkouts(currentUser.uid);
      setWorkouts(data);
    }
    loadStats();
  }, [currentUser]);

  // Dynamically calculate the last 7 days of volume
  const chartData = useMemo(() => {
    const days = [];
    const volumes = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      
      const dayStart = new Date(d.setHours(0,0,0,0));
      const dayEnd = new Date(d.setHours(23,59,59,999));
      
      const dailyVolume = workouts.reduce((sum, w) => {
        if (!w.endTime) return sum;
        const wDate = w.endTime.toDate();
        if (wDate >= dayStart && wDate <= dayEnd) {
          return sum + (w.totalVolume || 0);
        }
        return sum;
      }, 0);
      
      volumes.push(dailyVolume);
    }

    const maxVol = Math.max(...volumes, 1);
    const heights = volumes.map(v => (v / maxVol) * 100);

    return { days, volumes, heights, maxVol };
  }, [workouts]);

  const latestWorkout = workouts.length > 0 ? workouts[0] : null;

  return (
    <div className="flex-1 w-full overflow-y-auto pb-24 bg-background">
      
      {/* Top Header Row */}
      <div className="flex justify-between items-center p-4">
        <h1 className="text-xl font-bold text-accent">{userProfile?.username || '@user'}</h1>
        <div className="flex gap-4 text-accent">
          
          {/* Edit Profile Button */}
          <button 
            onClick={() => setIsEditingProfile(true)} 
            className="hover:text-highlight active:scale-90 transition-transform p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
          </button>
          
          {/* Share Icon (Visual Only) */}
          <button className="p-1 hover:text-highlight transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          </button>
          
          {/* Settings Icon (Visual Only) */}
          <button className="p-1 hover:text-highlight transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </button>
        </div>
      </div>

      {/* User Stats Row */}
      <div className="flex items-center px-4 mb-4">
        <div className="w-20 h-20 rounded-full bg-surface border border-muted/20 overflow-hidden flex-shrink-0">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl bg-highlight/20 text-highlight font-bold">
              {userProfile?.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
        <div className="flex-1 ml-6 flex flex-col justify-center">
          <span className="font-bold text-accent text-xl mb-1">{userProfile?.name || 'Lifter'}</span>
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted">Total Workouts</span>
              <span className="font-bold text-highlight text-lg">{workouts.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio / Goal */}
      <div className="px-4 mb-8">
        <p className="text-sm text-accent bg-surface p-3 rounded-lg border border-muted/10">
          🎯 {userProfile?.goal || 'General Strength'}
        </p>
      </div>

      {/* Dynamic Activity Chart */}
      <div className="px-4 mb-8">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-sm text-muted">7-Day Volume</h3>
          <span className="text-xs text-highlight font-medium">Max: {chartData.maxVol.toLocaleString()} kg</span>
        </div>
        
        <div className="h-32 w-full border-b border-surface relative flex items-end justify-between gap-2 pb-1">
          {chartData.heights.map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
               <div className="opacity-0 group-hover:opacity-100 absolute -top-8 text-[10px] bg-surface px-2 py-1 rounded text-accent transition-opacity whitespace-nowrap">
                 {chartData.volumes[i].toLocaleString()} kg
               </div>
               <div className="w-full bg-highlight rounded-t-md z-10 transition-all duration-500" style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}></div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between text-[10px] text-muted mt-2 px-1">
          {chartData.days.map((day, i) => <span key={i} className="flex-1 text-center">{day}</span>)}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="px-4 mb-8">
        <h3 className="text-sm text-muted mb-3">Dashboard</h3>
        <div className="grid grid-cols-2 gap-3">
          {['Statistics', 'Exercises', 'Measures', 'Calendar'].map((module) => (
            <button 
              key={module}
              onClick={() => setActiveDashboardModal(module)}
              className="bg-surface p-4 rounded-xl flex items-center gap-3 text-sm font-medium text-accent hover:bg-surface/80 transition-colors border border-transparent active:border-highlight"
            >
              <div className="w-2 h-2 rounded-full bg-highlight"></div>
              {module}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Workout */}
      {latestWorkout && (
        <div className="px-4 mb-4">
          <h3 className="text-sm text-muted mb-3">Latest Workout</h3>
          <div 
            onClick={() => setSelectedWorkout(latestWorkout)}
            className="bg-surface p-4 rounded-xl border border-muted/10 flex flex-col gap-2 hover:border-highlight/50 transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex justify-between items-center border-b border-muted/10 pb-2 pointer-events-none">
              <span className="font-semibold text-accent">
                {latestWorkout.endTime ? latestWorkout.endTime.toDate().toLocaleDateString() : 'Recent'}
              </span>
              <span className="text-xs font-medium bg-highlight/20 text-highlight px-2 py-1 rounded-md">View Details →</span>
            </div>
            <div className="flex gap-6 mt-1 pointer-events-none">
              <div className="flex flex-col">
                <span className="text-xs text-muted">Volume</span>
                <span className="font-bold text-accent">{latestWorkout.totalVolume?.toLocaleString()} kg</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted">Exercises</span>
                <span className="font-bold text-accent">{latestWorkout.exercises.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MOUNTED MODALS --- */}
      
      <WorkoutDetailModal 
        workout={selectedWorkout} 
        onClose={() => setSelectedWorkout(null)} 
      />
      
      <EditProfileModal 
        isOpen={isEditingProfile} 
        onClose={() => setIsEditingProfile(false)} 
      />
      
      <StatisticsModal 
        isOpen={activeDashboardModal === 'Statistics'} 
        onClose={() => setActiveDashboardModal(null)} 
        workouts={workouts} 
      />
      
      <ExercisesModal 
        isOpen={activeDashboardModal === 'Exercises'} 
        onClose={() => setActiveDashboardModal(null)} 
        workouts={workouts} 
      />
      
      <CalendarModal 
        isOpen={activeDashboardModal === 'Calendar'} 
        onClose={() => setActiveDashboardModal(null)} 
        workouts={workouts} 
      />
      
      <MeasuresModal 
        isOpen={activeDashboardModal === 'Measures'} 
        onClose={() => setActiveDashboardModal(null)} 
      />

    </div>
  );
}