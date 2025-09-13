"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Database, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [floatingParticles, setFloatingParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    const generateParticles = () => {
      const particles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        delay: Math.random() * 6,
      }));
      setFloatingParticles(particles);
    };

    generateParticles();
    window.addEventListener("resize", generateParticles);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("resize", generateParticles);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#0a0f1c" }}>
      {/* Spotlight */}
      <div className="cursor-spotlight" style={{ left: mousePosition.x, top: mousePosition.y }} />

      {/* Particles */}
      {floatingParticles.map((p) => (
        <div
          key={p.id}
          className="floating-particle"
          style={{ left: p.x, top: p.y, animationDelay: `${p.delay}s` }}
        />
      ))}

      {/* Hero Section */}
      <section className="relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-28 md:py-36">
          <div className="text-center space-y-8 fade-in-elegant">
            <div className="mx-auto w-20 h-20 glass-premium rounded-2xl flex items-center justify-center border border-gray-700/30">
              <Database className="w-9 h-9 text-blue-400 icon-glow-soft" />
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-semibold heading-premium gradient-text-premium">
              INGRES AI
            </h1>
            <p className="max-w-2xl mx-auto text-gray-300 text-premium text-lg">
              AI-powered groundwater analysis for India. Ask in English, Hindi, or your preferred language and get concise insights with visual charts and demo stats.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/chat" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto px-6 py-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white btn-premium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Start Groundwater Analysis
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link href="/login" className="flex-1 sm:flex-none">
                  <Button variant="ghost" className="w-full sm:w-auto rounded-xl text-gray-200 hover:text-white hover:bg-gray-800/50">
                    Login
                  </Button>
                </Link>
                <Link href="/register" className="flex-1 sm:flex-none">
                  <Button variant="outline" className="w-full sm:w-auto rounded-xl border-gray-700/40 hover:border-blue-500/40">
                    Register
                  </Button>
                </Link>
              </div>
            </div>

            <div className="max-w-3xl mx-auto glass-premium border border-gray-700/30 rounded-2xl p-5 mt-8">
              <p className="text-gray-400 text-sm text-premium">
                Ask things like "Groundwater status in Karnataka", "Compare Punjab vs Maharashtra", or "Over-exploited regions today". You'll get short explanations, demo metrics, and a chart you can interpret at a glance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}