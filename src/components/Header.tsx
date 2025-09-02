"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Database, Menu, Settings } from "lucide-react";

interface HeaderProps {
  onToggleSidebar: () => void;
  mousePosition: { x: number; y: number };
}

export default function Header({ onToggleSidebar, mousePosition }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-premium border-b border-gray-800/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Hamburger + Logo */}
          <div className="flex items-center space-x-4">
            {/* Hamburger menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="w-10 h-10 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-elegant"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Minimal logo */}
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <div className="w-8 h-8 glass-premium rounded-lg flex items-center justify-center border border-gray-700/30 group-hover:border-blue-500/30 transition-elegant">
                  <Database className="w-4 h-4 text-blue-400 icon-glow-soft" />
                </div>
                
                {/* Minimal accent dot */}
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500/30 rounded-full">
                  <div className="absolute inset-0.5 bg-blue-400 rounded-full pulse-subtle" />
                </div>
              </div>
              
              <h1 className="font-display font-semibold text-xl text-white heading-premium">
                INGRES
              </h1>
            </div>
          </div>

          {/* Center - Optional search bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <div 
                className={`glass-premium rounded-lg border transition-elegant overflow-hidden ${
                  searchFocused 
                    ? 'border-blue-500/40 shadow-lg shadow-blue-500/10' 
                    : 'border-gray-700/30 hover:border-gray-600/40'
                }`}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 icon-glow-soft" />
                <input
                  type="text"
                  placeholder="Ask about groundwater..."
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 rounded-lg focus:outline-none text-gray-200 placeholder-gray-400 text-premium text-sm"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </div>
            </div>
          </div>

          {/* Right side - Minimal actions */}
          <div className="flex items-center space-x-3">
            {/* Settings button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-elegant"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            {/* User avatar */}
            <div className="relative group">
              <Avatar className="w-8 h-8 border border-gray-700/30 hover:border-blue-500/30 transition-elegant cursor-pointer">
                <AvatarFallback className="bg-gray-800/50 text-gray-200 text-xs font-medium">
                  U
                </AvatarFallback>
              </Avatar>
              
              {/* Status indicator */}
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-gray-900">
                <div className="absolute inset-0.5 bg-emerald-300 rounded-full pulse-subtle" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}