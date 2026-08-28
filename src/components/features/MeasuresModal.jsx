import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function MeasuresModal({ isOpen, onClose }) {
  const { userProfile } = useAuth();
  
  if (!isOpen) return null;

  // Static list for Phase 1. We will make these editable in Phase 3.
  const metrics = [
    { label: "Body Weight", value: userProfile?.weight ? `${userProfile.weight}kg` : "--", unit: "kg" },
    { label: "Body Fat", value: userProfile?.bodyFat ? `${userProfile.bodyFat}%` : "--", unit: "%" },
    { label: "Chest", value: userProfile?.chest ? `${userProfile.chest}cm` : "--", unit: "cm" },
    { label: "Arms", value: userProfile?.arms ? `${userProfile.arms}cm` : "--", unit: "cm" },
    { label: "Waist", value: userProfile?.waist ? `${userProfile.waist}cm` : "--", unit: "cm" },
    { label: "Legs", value: userProfile?.legs ? `${userProfile.legs}cm` : "--", unit: "cm" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-surface w-full max-w-md mx-auto rounded-t-3xl border-t border-muted/20 p-6 pb-12 max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up flex flex-col">
        <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-6 flex-shrink-0"></div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-accent">Measures</h2>
          <button onClick={onClose} className="bg-background p-2 rounded-full text-muted hover:text-accent">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="space-y-3">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-background p-4 rounded-xl border border-muted/10 flex justify-between items-center group cursor-pointer hover:border-highlight/50 transition-colors">
              <span className="font-medium text-accent">{metric.label}</span>
              <div className="flex items-center gap-3">
                <span className={`font-bold text-lg ${metric.value !== '--' ? 'text-highlight' : 'text-muted'}`}>
                  {metric.value}
                </span>
                <span className="text-muted group-hover:text-highlight transition-colors opacity-50 text-xl">+</span>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-6 py-3 bg-highlight/10 text-highlight font-medium rounded-xl hover:bg-highlight/20 transition-colors">
          View Progress Charts
        </button>

      </div>
    </div>
  );
}