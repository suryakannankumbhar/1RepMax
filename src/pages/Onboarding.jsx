import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveUserProfile } from '../services/db';
import { useUI } from '../context/UIContext'; // Added for custom alerts

const EMOJI_OPTIONS = ['🤖', '🦍', '🧠', '🧙‍♂️', '🦖', '🥷', '🐻', '🔥', '🦉'];

export default function Onboarding() {
  const { currentUser, refreshProfile, logout } = useAuth();
  const { showAlert } = useUI(); // Upgraded from native alerts
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: currentUser?.displayName || '',
    username: '',
    age: '', weight: '', height: '', goal: '',
    bodyFat: '', chest: '', arms: '', waist: '', legs: ''
  });

  // New AI state
  const [aiName, setAiName] = useState('Coach');
  const [aiEmoji, setAiEmoji] = useState('🤖');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username) return showAlert("Username is required", "error");
    if (!aiName.trim()) return showAlert("Please give your AI coach a name", "error");
    
    setIsSaving(true);
    try {
      const profileData = {
        ...formData,
        aiName: aiName.trim(),
        aiEmoji: aiEmoji,
        routines: [],
        createdAt: new Date()
      };
      
      await saveUserProfile(currentUser.uid, profileData);
      await refreshProfile(currentUser.uid);
    } catch (error) {
      showAlert("Failed to save profile.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col h-full relative pb-12">
      
      <button 
        onClick={logout}
        className="absolute top-6 right-6 text-sm text-muted hover:text-red-400 font-medium"
      >
        Cancel & Logout
      </button>

      <div className="mb-6 mt-12">
        <h1 className="text-3xl font-bold text-accent mb-2">Welcome to 1RepMax</h1>
        <p className="text-sm text-muted">Let's set up your lifting profile.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Core Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Display Name *</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-surface text-accent p-3 rounded-lg outline-none focus:ring-1 focus:ring-highlight" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Username *</label>
            <input required type="text" name="username" placeholder="@" value={formData.username} onChange={handleChange} className="w-full bg-surface text-accent p-3 rounded-lg outline-none focus:ring-1 focus:ring-highlight" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Primary Goal</label>
            <input type="text" name="goal" placeholder="e.g. Building a V-Taper, General Strength..." value={formData.goal} onChange={handleChange} className="w-full bg-surface text-accent p-3 rounded-lg outline-none focus:ring-1 focus:ring-highlight" />
          </div>
        </div>

        {/* Detailed Measurements (Optional) */}
        <div>
          <h3 className="text-sm font-bold text-accent mb-3 border-b border-muted/10 pb-2">Measurements (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full bg-surface text-accent p-3 rounded-lg outline-none focus:ring-1 focus:ring-highlight" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Height (cm)</label>
              <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full bg-surface text-accent p-3 rounded-lg outline-none focus:ring-1 focus:ring-highlight" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Weight (kg)</label>
              <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} className="w-full bg-surface text-accent p-3 rounded-lg outline-none focus:ring-1 focus:ring-highlight" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Body Fat (%)</label>
              <input type="number" step="0.1" name="bodyFat" value={formData.bodyFat} onChange={handleChange} className="w-full bg-surface text-accent p-3 rounded-lg outline-none focus:ring-1 focus:ring-highlight" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Chest (cm)</label>
              <input type="number" step="0.1" name="chest" value={formData.chest} onChange={handleChange} className="w-full bg-surface text-accent p-3 rounded-lg outline-none focus:ring-1 focus:ring-highlight" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Arms (cm)</label>
              <input type="number" step="0.1" name="arms" value={formData.arms} onChange={handleChange} className="w-full bg-surface text-accent p-3 rounded-lg outline-none focus:ring-1 focus:ring-highlight" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Waist (cm)</label>
              <input type="number" step="0.1" name="waist" value={formData.waist} onChange={handleChange} className="w-full bg-surface text-accent p-3 rounded-lg outline-none focus:ring-1 focus:ring-highlight" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Legs (cm)</label>
              <input type="number" step="0.1" name="legs" value={formData.legs} onChange={handleChange} className="w-full bg-surface text-accent p-3 rounded-lg outline-none focus:ring-1 focus:ring-highlight" />
            </div>
          </div>
        </div>

        {/* AI Customization */}
        <div>
          <h3 className="text-sm font-bold text-accent mb-3 border-b border-muted/10 pb-2">Your AI Spotter</h3>
          <div className="space-y-4 bg-highlight/5 p-5 rounded-2xl border border-highlight/10 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 text-8xl opacity-5 select-none pointer-events-none">{aiEmoji}</div>
            
            <div className="space-y-3 relative z-10">
              <label className="text-xs font-bold tracking-wider text-highlight uppercase">Name your AI Coach</label>
              <input 
                type="text" 
                placeholder="e.g., Siri, Ronnie, Jarvis" 
                value={aiName}
                onChange={(e) => setAiName(e.target.value)}
                className="w-full bg-surface p-3 rounded-xl border border-muted/20 text-accent font-medium outline-none focus:border-highlight transition-colors"
              />
            </div>

            <div className="space-y-3 relative z-10 pt-2">
              <label className="text-xs font-bold tracking-wider text-highlight uppercase">Choose an Avatar</label>
              <div className="grid grid-cols-5 gap-2">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    type="button" // MUST be type="button" so it doesn't submit the form when clicking an emoji
                    key={emoji}
                    onClick={() => setAiEmoji(emoji)}
                    className={`text-2xl p-2 rounded-xl transition-all active:scale-95 ${aiEmoji === emoji ? 'bg-highlight shadow-md shadow-highlight/20' : 'bg-surface hover:bg-surface/80 border border-muted/10'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className="w-full bg-highlight text-white font-semibold py-4 mt-6 rounded-xl shadow-lg shadow-highlight/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Complete Profile'}
        </button>
      </form>
    </div>
  );
}