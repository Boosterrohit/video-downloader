import React from 'react';
import { Video, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
   <header className="border-b border-sky-100 header-bg-img px-6 py-4 shadow-sm fixed top-0 w-full z-50">
  <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
    
    <div className="flex items-center gap-3">
      <div className="bg-gradient-to-br from-sky-500 via-blue-600 to-violet-600 p-2 rounded-lg text-white shadow-md shadow-blue-200">
        <Video className="w-6 h-6" />
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-wide">
          Browser Video Studio
        </h1>
        <p className="text-xs text-slate-500">
          Edit locally, download from the web
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full">
      <ShieldCheck className="w-4 h-4" />
      <span>Private & Secure: Files never leave your browser</span>
    </div>

  </div>
</header>
  );
};

