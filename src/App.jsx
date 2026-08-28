import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useUI } from './context/UIContext';
import Login from './pages/Login';
import History from './pages/History';
import ExerciseSelector from './components/features/ExerciseSelector';
import WorkoutLogger from './components/features/WorkoutLogger';
import { saveWorkout, getUserWorkouts } from './services/db';
import { generateWorkoutAnalysis } from './services/ai';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Workout from './pages/Workout';

function MiniTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    setElapsed(Date.now() - startTime); 
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60000).toString().padStart(2, '0');
  const secs = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
  return <span className="font-mono text-sm font-medium tracking-wide">{mins}:{secs} &rarr;</span>;
}

function ProtectedRoute({ children }) {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();

  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser && !userProfile && location.pathname !== '/onboarding') return <Navigate to="/onboarding" />;
  if (currentUser && userProfile && location.pathname === '/onboarding') return <Navigate to="/" />;
  return children;
}

function App() {
  const { currentUser, userProfile, logout } = useAuth();
  const { showAlert, showConfirm } = useUI(); 
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [isSelectingExercise, setIsSelectingExercise] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState({ name: '', startTime: null, exercises: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [completedInsight, setCompletedInsight] = useState(null);

  const handleLogout = async () => {
    if (await showConfirm("Are you sure you want to log out?")) logout();
  };

  const startRoutineWorkout = async (routine) => {
    if (activeWorkout.startTime && !(await showConfirm("Discard current workout and start this routine?"))) return;
    setActiveWorkout({
      name: routine.name, 
      startTime: Date.now(),
      exercises: routine.exercises.map(ex => ({ exercise: ex, sets: [{ weight: '', reps: '', completed: false }] }))
    });
    navigate('/'); 
  };

  const startEmptyWorkout = async () => {
    if (activeWorkout.startTime && !(await showConfirm("Discard active workout and start a new one?"))) return;
    setActiveWorkout({ name: '', startTime: Date.now(), exercises: [] });
    navigate('/'); 
  };

  const cancelWorkout = async () => {
    if (await showConfirm("Cancel this workout? All progress will be lost.")) {
      setActiveWorkout({ name: '', startTime: null, exercises: [] });
      navigate('/workout'); 
    }
  };

  const handleExerciseSelect = (exercise) => {
    const newWorkoutState = { ...activeWorkout };
    if (!newWorkoutState.startTime) newWorkoutState.startTime = Date.now();
    newWorkoutState.exercises.push({ exercise: exercise, sets: [{ weight: '', reps: '', completed: false }] });
    setActiveWorkout(newWorkoutState);
    setIsSelectingExercise(false);
  };

  const handleFinishWorkout = async () => {
    if (activeWorkout.exercises.length === 0) return;

    const cleanedExercises = activeWorkout.exercises
      .map(ex => ({ ...ex, sets: ex.sets.filter(set => set.completed) }))
      .filter(ex => ex.sets.length > 0); 

    if (cleanedExercises.length === 0) {
      showAlert("You haven't completed any valid sets yet.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const durationMinutes = Math.max(1, Math.round((Date.now() - activeWorkout.startTime) / 60000)); 
      const pastWorkouts = await getUserWorkouts(currentUser.uid);
      const workoutDataForAI = {
        name: activeWorkout.name?.trim() ? activeWorkout.name : "Workout Session",
        duration: durationMinutes,
        exercises: cleanedExercises
      };

      const aiAnalysis = await generateWorkoutAnalysis(workoutDataForAI, pastWorkouts);
      await saveWorkout(currentUser.uid, { ...workoutDataForAI, aiInsight: aiAnalysis });
      
      setActiveWorkout({ name: '', startTime: null, exercises: [] });
      setCompletedInsight(aiAnalysis); 
    } catch (error) {
      showAlert("Failed to save workout.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="*" element={
        <ProtectedRoute>
          <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-background border-x border-surface relative overflow-hidden">
            
            <header className="p-4 border-b border-surface flex justify-between items-center bg-background z-10 shrink-0">
              <h1 className="text-xl font-bold tracking-tight text-accent">1RepMax</h1>
              <div className="flex items-center gap-3">
                {location.pathname === '/' && activeWorkout.exercises.length > 0 && (
                  <button onClick={handleFinishWorkout} disabled={isSaving} className="text-sm font-bold bg-highlight text-white h-8 px-4 rounded-lg active:scale-95 transition-transform shadow-md shadow-highlight/20">
                    {isSaving ? 'Saving...' : 'Finish'}
                  </button>
                )}
                <button onClick={handleLogout} className="p-2 rounded-full text-muted hover:text-red-400">
                  <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </button>
              </div>
            </header>

            {/* AI LOADING OVERLAY */}
            {isSaving && (
              <div className="absolute inset-0 z-[100] bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                <div className="relative flex items-center justify-center w-20 h-20 mb-6">
                  <div className="absolute inset-0 border-4 border-muted/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-highlight rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">
                    {userProfile?.aiEmoji || '🤖'}
                  </div>
                </div>
                <p className="text-accent font-bold tracking-wide">{userProfile?.aiName || 'Coach'} is analyzing...</p>
                <p className="text-xs text-muted mt-1">Calculating progressive overload.</p>
              </div>
            )}

            {/* Post-Workout Modal */}
            {completedInsight && (
              <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-background/90 backdrop-blur-md"></div>
                <div className="relative bg-surface border border-highlight/20 p-6 rounded-3xl shadow-2xl max-w-sm w-full animate-slide-up flex flex-col items-center text-center">
                  <div className="text-6xl mb-4 drop-shadow-lg">{userProfile?.aiEmoji || '🤖'}</div>
                  <h2 className="text-2xl font-black text-accent mb-2">Workout Complete!</h2>
                  <div className="bg-highlight/10 border border-highlight/20 p-4 rounded-xl mb-6 w-full text-left relative overflow-hidden">
                    <h3 className="text-[10px] font-bold tracking-widest text-highlight uppercase mb-2">{userProfile?.aiName || 'Coach'}'s Analysis</h3>
                    <p className="text-sm text-accent font-medium leading-relaxed relative z-10">"{completedInsight}"</p>
                  </div>
                  <button onClick={() => { setCompletedInsight(null); navigate('/history'); }} className="w-full py-4 rounded-xl font-bold text-white bg-highlight shadow-lg active:scale-95 transition-transform">
                    Hell Yeah
                  </button>
                </div>
              </div>
            )}

            <Routes>
              <Route path="/" element={
                <div className="flex-1 relative w-full flex flex-col overflow-hidden">
                  <main className="flex-1 overflow-y-auto p-4 w-full">
                    <WorkoutLogger activeWorkout={activeWorkout} updateWorkout={setActiveWorkout} cancelWorkout={cancelWorkout} />
                  </main>
                  <button onClick={() => setIsSelectingExercise(true)} className="absolute bottom-6 right-6 w-14 h-14 bg-highlight text-white rounded-full shadow-lg flex items-center justify-center text-4xl font-light active:scale-90 transition-transform z-20 pb-2">
                    +
                  </button>
                </div>
              } />
              <Route path="/workout" element={<Workout startEmptyWorkout={startEmptyWorkout} startRoutineWorkout={startRoutineWorkout} />} />
              <Route path="/history" element={<main className="flex-1 overflow-y-auto p-4 w-full pb-24"><History /></main>} />
              <Route path="/profile" element={<main className="flex-1 overflow-y-auto w-full"><Profile /></main>} />
            </Routes>

            {activeWorkout.startTime && location.pathname !== '/' && (
              <div onClick={() => navigate('/')} className="absolute bottom-[88px] left-4 right-4 bg-highlight text-white p-3 px-4 rounded-xl shadow-lg flex justify-between items-center cursor-pointer active:scale-[0.98] transition-transform z-30">
                <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div><span className="font-bold text-sm">Resume Workout</span></div>
                <MiniTimer startTime={activeWorkout.startTime} />
              </div>
            )}

            <nav className="p-4 border-t border-surface bg-background shrink-0 z-10 flex gap-2 relative">
              <button onClick={() => navigate('/history')} className={`flex-1 text-sm font-medium py-3 rounded-lg transition-colors ${location.pathname === '/history' ? 'bg-highlight/20 text-highlight' : 'bg-surface text-accent'}`}>History</button>
              <button onClick={() => navigate('/workout')} className={`flex-1 text-sm font-medium py-3 rounded-lg transition-colors ${(location.pathname === '/' || location.pathname === '/workout') ? 'bg-highlight/20 text-highlight' : 'bg-surface text-accent'}`}>Workout</button>
              <button onClick={() => navigate('/profile')} className={`flex-1 text-sm font-medium py-3 rounded-lg transition-colors ${location.pathname === '/profile' ? 'bg-highlight/20 text-highlight' : 'bg-surface text-accent'}`}>Profile</button>
            </nav>

            {isSelectingExercise && <ExerciseSelector onClose={() => setIsSelectingExercise(false)} onSelect={handleExerciseSelect} addedExerciseIds={activeWorkout.exercises.map(item => item.exercise.id)} />}
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;