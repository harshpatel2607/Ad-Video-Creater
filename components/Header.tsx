
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">
            h
          </div>
          <span className="text-xl font-bold tracking-tight">
            hApI<span className="text-blue-500">tech</span> <span className="text-sm font-medium text-white/40 ml-2">Director</span>
          </span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-white/60">
          <a href="#" className="hover:text-white transition-colors">Campaigns</a>
          <a href="#" className="hover:text-white transition-colors">Templates</a>
          <a href="#" className="hover:text-white transition-colors">Analytics</a>
          <div className="h-4 w-px bg-white/10"></div>
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-5 py-2 transition-all">
            Settings
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
