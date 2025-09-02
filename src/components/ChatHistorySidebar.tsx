"use client";

import React, { useState } from 'react';
import { History, Plus, MessageCircle, Clock } from 'lucide-react';

interface ChatItem {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

const mockChatHistory: ChatItem[] = [
  {
    id: '1',
    title: 'Karnataka Groundwater Analysis',
    timestamp: '2 hours ago',
    preview: 'Analyzing 5-year trends in groundwater depletion...'
  },
  {
    id: '2',
    title: 'Critical Units Assessment',
    timestamp: '5 hours ago',
    preview: 'Identifying over-exploited regions in Maharashtra...'
  },
  {
    id: '3',
    title: 'Western Ghats Water Study',
    timestamp: '1 day ago',
    preview: 'Extraction vs recharge comparison analysis...'
  },
  {
    id: '4',
    title: 'Monsoon Impact Report',
    timestamp: '2 days ago',
    preview: 'Seasonal variation patterns across South India...'
  },
  {
    id: '5',
    title: 'Urban Aquifer Status',
    timestamp: '3 days ago',
    preview: 'Bangalore metropolitan groundwater assessment...'
  },
  {
    id: '6',
    title: 'Drought Prediction Model',
    timestamp: '4 days ago',
    preview: 'AI-powered drought risk analysis for 2024...'
  },
  {
    id: '7',
    title: 'Policy Impact Analysis',
    timestamp: '1 week ago',
    preview: 'Effectiveness of groundwater regulation policies...'
  },
  {
    id: '8',
    title: 'Aquifer Recharge Planning',
    timestamp: '1 week ago',
    preview: 'Managed aquifer recharge site recommendations...'
  }
];

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({ isOpen, onToggle, className = '' }) => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleNewChat = () => {
    console.log('Starting new chat...');
  };

  return (
    <>
      {/* Sidebar Container - slides in from left */}
      <div
        className={`
          fixed left-0 top-0 h-screen z-50
          transition-all duration-500 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-80
        `}
      >
        {/* Premium Glass Background */}
        <div className="h-full glass-sidebar">
          {/* Header Section */}
          <div className="p-6 border-b border-gray-800/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                <History className="w-4 h-4 text-blue-400 icon-glow-soft" />
              </div>
              <h2 className="text-lg font-semibold text-white heading-premium">
                Chat History
              </h2>
            </div>
          </div>

          {/* New Chat Button - Perplexity Style */}
          <div className="p-4">
            <button
              onClick={handleNewChat}
              className="
                w-full flex items-center gap-3 p-3 rounded-xl
                glass-premium border border-gray-700/30
                hover:border-blue-500/30 hover:bg-blue-500/5
                text-gray-300 hover:text-white
                transition-elegant hover-lift
                group
                justify-start
              "
            >
              <Plus className="w-4 h-4 icon-glow-soft group-hover:rotate-90 transition-all duration-300" />
              <span className="font-medium text-premium">New Chat</span>
            </button>
          </div>

          {/* Chat History List - Clean and Minimal */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-1">
              {mockChatHistory.map((chat, index) => (
                <div
                  key={chat.id}
                  className={`
                    group cursor-pointer rounded-lg p-3
                    transition-elegant
                    hover:bg-gray-800/30
                    border border-transparent hover:border-gray-700/30
                    fade-in-elegant
                    ${selectedChatId === chat.id ? 'bg-gray-800/40 border-gray-700/40' : ''}
                  `}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => handleChatSelect(chat.id)}
                >
                  <div className="space-y-2">
                    {/* Chat Title */}
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-elegant mt-0.5 flex-shrink-0" />
                      <h3 className="text-sm font-medium text-gray-200 group-hover:text-white transition-elegant line-clamp-2 text-premium">
                        {chat.title}
                      </h3>
                    </div>
                    
                    {/* Chat Preview */}
                    <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-elegant line-clamp-2 ml-7 text-premium">
                      {chat.preview}
                    </p>
                    
                    {/* Timestamp */}
                    <div className="flex items-center gap-1 ml-7">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-elegant text-premium">
                        {chat.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Elegant divider at bottom */}
          <div className="divider-elegant mx-4 mb-4" />
        </div>
      </div>
    </>
  );
};