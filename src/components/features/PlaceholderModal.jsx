import React from 'react';

export default function PlaceholderModal({ isOpen, onClose, title }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-surface w-full max-w-md mx-auto rounded-t-3xl border-t border-muted/20 p-8 shadow-2xl animate-slide-up text-center">
        <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-highlight mb-2">{title}</h2>
        <div className="text-5xl mb-4 mt-6">🚧</div>
        <p className="text-muted text-sm mb-8">This module is currently under construction. Data visualization arriving in Phase 2.</p>
        <button onClick={onClose} className="w-full py-3 bg-highlight/20 text-highlight font-medium rounded-xl">Close</button>
      </div>
    </div>
  );
}