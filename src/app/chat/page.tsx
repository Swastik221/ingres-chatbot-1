"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import IngresChat from "@/components/IngresChat";
import { ChatHistorySidebar } from "@/components/ChatHistorySidebar";

interface MousePosition {
  x: number;
  y: number;
}

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export default function ChatPage(): JSX.Element {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [floatingParticles, setFloatingParticles] = useState<FloatingParticle[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Mouse tracking effect for spotlight
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const particles: FloatingParticle[] = [];
      for (let i = 0; i < 20; i++) {
        particles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          delay: Math.random() * 6
        });
      }
      setFloatingParticles(particles);
    };

    generateParticles();
    const interval = setInterval(generateParticles, 30000); // Regenerate every 30s

    return () => clearInterval(interval);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0a0f1c' }}>
      {/* Spotlight effect */}
      <div 
        className="cursor-spotlight"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`
        }}
      />
      
      {/* Floating particles */}
      {floatingParticles.map((particle) => (
        <div
          key={particle.id}
          className="floating-particle"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}

      {/* Sidebar */}
      <ChatHistorySidebar 
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
      />

      {/* Main content */}
      <div 
        className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-80' : 'ml-0'}`}
      >
        <Header 
          onToggleSidebar={handleToggleSidebar}
          mousePosition={mousePosition}
        />
        <IngresChat mousePosition={mousePosition} />
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={handleToggleSidebar}
        />
      )}
    </div>
  );
}