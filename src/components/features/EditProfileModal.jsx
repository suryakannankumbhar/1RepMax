import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveUserProfile } from '../../services/db';

export default function EditProfileModal({ isOpen, onClose }) {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // Added all the new measurement fields
  const [formData, setFormData] = useState({
    name: '', username: '', age: '', weight: '', height: '', goal: '',
    bodyFat: '', chest: '', arms: '', waist: '', legs: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        username: userProfile.username || '',
        age: userProfile.age || '',
        weight: userProfile.weight || '',
        height: userProfile.height || '',
        goal: userProfile.goal || '',
        bodyFat: userProfile.bodyFat || '',
        chest: userProfile.chest || '',
        arms: userProfile.arms || '',
        waist: userProfile.waist || '',
        legs: userProfile.legs || ''
      });
    }
  }, [userProfile, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) return alert("Username cannot be empty.");

    setIsSaving(true);
    try {
      await saveUserProfile(currentUser.uid, formData);
      await refreshProfile(currentUser.uid); 
      onClose();
    } catch (error) {
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-surface w-full max-w-md mx-auto rounded-t-3xl border-t border-muted/20 p-6 pb-12 max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        
        <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-6"></div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-accent">Edit Profile</h2>
          <button onClick={onClose} className="text-sm text-muted hover:text-accent font-medium">Cancel</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* General Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Display Name</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-background text-accent p-3 rounded-lg outline-none border border-muted/10 focus:border-highlight" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Username</label>
              <input required type="text" name="username" value={formData.username} onChange={handleChange} className="w-full bg-background text-accent p-3 rounded-lg outline-none border border-muted/10 focus:border-highlight" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Primary Goal</label>
              <input type="text" name="goal" value={formData.goal} onChange={handleChange} className="w-full bg-background text-accent p-3 rounded-lg outline-none border border-muted/10 focus:border-highlight" />
            </div>
          </div>

          {/* Measurements */}
          <div>
            <h3 className="text-sm font-bold text-accent mb-3 border-b border-muted/10 pb-2">Body Measurements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full bg-background text-accent p-3 rounded-lg outline-none border border-muted/10 focus:border-highlight" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Height (cm)</label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full bg-background text-accent p-3 rounded-lg outline-none border border-muted/10 focus:border-highlight" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Weight (kg)</label>
                <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} className="w-full bg-background text-accent p-3 rounded-lg outline-none border border-muted/10 focus:border-highlight" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Body Fat (%)</label>
                <input type="number" step="0.1" name="bodyFat" value={formData.bodyFat} onChange={handleChange} className="w-full bg-background text-accent p-3 rounded-lg outline-none border border-muted/10 focus:border-highlight" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Chest (cm)</label>
                <input type="number" step="0.1" name="chest" value={formData.chest} onChange={handleChange} className="w-full bg-background text-accent p-3 rounded-lg outline-none border border-muted/10 focus:border-highlight" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Arms (cm)</label>
                <input type="number" step="0.1" name="arms" value={formData.arms} onChange={handleChange} className="w-full bg-background text-accent p-3 rounded-lg outline-none border border-muted/10 focus:border-highlight" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Waist (cm)</label>
                <input type="number" step="0.1" name="waist" value={formData.waist} onChange={handleChange} className="w-full bg-background text-accent p-3 rounded-lg outline-none border border-muted/10 focus:border-highlight" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Legs (cm)</label>
                <input type="number" step="0.1" name="legs" value={formData.legs} onChange={handleChange} className="w-full bg-background text-accent p-3 rounded-lg outline-none border border-muted/10 focus:border-highlight" />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-highlight text-white font-semibold py-4 mt-4 rounded-xl active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-highlight/25"
          >
            {isSaving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}