"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import IngresChat from "@/components/IngresChat";
import { ChatHistorySidebar } from "@/components/ChatHistorySidebar";

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [floatingParticles, setFloatingParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Elegant cursor tracking for spotlight effect
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  // Generate subtle floating particles
  useEffect(() => {
    const generateParticles = () => {
      const particles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        delay: Math.random() * 6
      }));
      setFloatingParticles(particles);
    };

    generateParticles();
    window.addEventListener('resize', generateParticles);
    return () => window.removeEventListener('resize', generateParticles);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0a0f1c' }}>
      {/* Elegant cursor spotlight */}
      <div 
        className="cursor-spotlight"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
      />

      {/* Subtle floating particles */}
      {floatingParticles.map(particle => (
        <div
          key={particle.id}
          className="floating-particle"
          style={{
            left: particle.x,
            top: particle.y,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}

      {/* Collapsible sidebar */}
      <ChatHistorySidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main content - centered by default, shifts when sidebar opens */}
      <div className={`transition-all duration-500 ease-out ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <Header onToggleSidebar={toggleSidebar} mousePosition={mousePosition} />
        <main className="pt-16">
          <IngresChat mousePosition={mousePosition} />
        </main>
      </div>

      {/* Mobile backdrop overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}