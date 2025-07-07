import React from 'react';
import { Mic, BarChart3, Shield, Zap, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'record', label: 'Record Interview', icon: Mic },
    { id: 'analyze', label: 'Analysis', icon: BarChart3 },
  ];

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-violet-200/50 sticky top-0 z-50 shadow-lg shadow-violet-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="relative w-12 h-12 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
              <Sparkles className="w-7 h-7 text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent">
                Interview Intelligence
              </h1>
              <p className="text-xs text-violet-600 font-medium">AI-Powered Interview Coaching</p>
            </div>
          </div>
          
          <nav className="flex space-x-1">
            {/* Privacy Status Indicator */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg mr-4 border border-emerald-200">
              <Shield className="w-3 h-3" />
              <span className="font-medium">Secure & Private</span>
            </div>
            
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                      : 'text-gray-600 hover:text-violet-700 hover:bg-violet-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;