"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { 
  Send, 
  Database, 
  BarChart3, 
  TrendingUp, 
  MapPin,
  ArrowRight,
  Loader2,
  FileText,
  Search,
  Sparkles,
  AlertCircle,
  Shield
} from "lucide-react";
import ChartRenderer, { ChartSpec } from "@/components/ChartRenderer";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  streaming?: boolean;
  error?: boolean;
  data?: any;
}

interface Source {
  id: string;
  title: string;
  type: 'assessment' | 'data' | 'report';
  year: number;
}

interface IngresChatProps {
  mousePosition: { x: number; y: number };
}

interface APIResponse {
  query: string;
  response: {
    type: string;
    region?: string;
    data: any;
    summary: string;
  };
  timestamp: string;
}

const EXAMPLE_QUERIES = [
  {
    icon: BarChart3,
    title: "Groundwater Status Analysis",
    query: "Show me the current groundwater status in Karnataka",
    description: "Get the latest assessment data and extraction ratios"
  },
  {
    icon: TrendingUp,
    title: "Critical Areas Identification",
    query: "Which regions are over-exploited or critically stressed?",
    description: "Identify at-risk areas requiring immediate intervention"
  },
  {
    icon: MapPin,
    title: "Regional Comparison",
    query: "Compare groundwater conditions between Punjab and Maharashtra",
    description: "Multi-region analysis with extraction vs recharge ratios"
  }
];

export default function IngresChat({ mousePosition }: IngresChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [typedText, setTypedText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session, isPending } = useSession();

  // Professional typewriter effect
  useEffect(() => {
    if (messages.length === 0) {
      const text = "AI-powered groundwater analysis for researchers and policymakers";
      let index = 0;
      const timer = setInterval(() => {
        setTypedText(text.slice(0, index));
        index++;
        if (index > text.length) {
          clearInterval(timer);
        }
      }, 50);
      return () => clearInterval(timer);
    }
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // API call helper with authentication
  const makeAPICall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("bearer_token");
    
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  };

  const handleSendMessage = useCallback(async () => {
    if (!currentMessage.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userQuery = currentMessage;
    setCurrentMessage("");
    setIsStreaming(true);

    // Create streaming assistant message
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Step 1: Processing query
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: "🔍 Processing your groundwater query..." }
          : msg
      ));

      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Call the chat query API
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: "🔍 Processing your groundwater query...\n\n📊 Analyzing INGRES database..." }
          : msg
      ));

      const apiResponse = await makeAPICall('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          query: userQuery,
          context: session?.user ? { userId: session.user.id } : undefined
        }),
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Parse Gemini response for JSON block
      const fullText: string = apiResponse.text || "";
      let parsed: any | null = null;
      const jsonMatch = fullText.match(/```json\n([\s\S]*?)\n```/i) || fullText.match(/\{[\s\S]*\}$/);
      if (jsonMatch) {
        const jsonStr = Array.isArray(jsonMatch) ? (jsonMatch[1] || jsonMatch[0]) : jsonMatch as any;
        try {
          parsed = JSON.parse(jsonStr);
        } catch (_) {
          // ignore JSON parse errors
        }
      }

      // Build message content and data
      const explanation = parsed?.explanation || fullText;
      const chartSpec: ChartSpec | undefined = parsed?.chart && parsed?.chart?.data
        ? {
            type: parsed.chart.type || 'bar',
            title: parsed.chart.title,
            xKey: parsed.chart.xKey || 'name',
            yKey: parsed.chart.yKey || 'value',
            data: parsed.chart.data,
          }
        : undefined;
      const stats: Array<{ label: string; value: number; unit?: string }> = Array.isArray(parsed?.stats) ? parsed.stats : [];

      // Fallback demo data when model doesn't supply structured JSON
      let finalStats = stats;
      let finalChart = chartSpec;
      if (!finalStats || finalStats.length === 0) {
        finalStats = [
          { label: 'Extraction Ratio', value: 92, unit: '%' },
          { label: 'Recharge Rate', value: 58, unit: 'mm/yr' },
          { label: 'Critical Units', value: 12 }
        ];
      }
      if (!finalChart) {
        finalChart = {
          type: 'bar',
          title: 'Demo: Extraction vs Recharge',
          xKey: 'name',
          yKey: 'value',
          data: [
            { name: 'Extraction', value: 92 },
            { name: 'Recharge', value: 58 }
          ]
        } as ChartSpec;
      }

      // Step 4: Set final response with structured data
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: explanation,
              streaming: false,
              sources: [],
              data: { stats: finalStats, chart: finalChart }
            }
          : msg
      ));

    } catch (error) {
      console.error('Chat API Error:', error);
      
      // Handle specific error cases
      let errorMessage = "I encountered an issue processing your request. ";
      
      if (error instanceof Error) {
        if (error.message.includes('region')) {
          errorMessage += "Please specify a valid Indian state, district, or region (e.g., 'Karnataka', 'Maharashtra', 'Rajasthan').";
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage += "Authentication required. Please sign in to access detailed groundwater data.";
        } else {
          errorMessage += "Please try again or rephrase your question.";
        }
      }

      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: `⚠️ **Error Processing Request**\n\n${errorMessage}\n\n**Example queries:**\n• "Show groundwater status in Punjab"\n• "Compare Karnataka and Tamil Nadu"\n• "Which areas are over-exploited?"`,
              streaming: false,
              error: true
            }
          : msg
      ));
      
      toast.error("Failed to process groundwater query. Please try again.");
    } finally {
      setIsStreaming(false);
    }
  }, [currentMessage, isStreaming, session]);

  const handleExampleQuery = useCallback((query: string) => {
    setCurrentMessage(query);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Helper functions for response formatting
  const getStatusAnalysis = (stage: string, ratio: number) => {
    if (stage === "Over-Exploited") {
      return "🔴 **Critical Intervention Required:** Groundwater extraction exceeds recharge significantly. Immediate conservation measures needed.";
    } else if (stage === "Critical") {
      return "🟡 **Warning Status:** Extraction approaching sustainable limits. Monitor closely and implement conservation strategies.";
    } else if (stage === "Semi-Critical") {
      return "🟠 **Caution Required:** Extraction levels are concerning. Preventive measures recommended.";
    } else {
      return "🟢 **Sustainable Status:** Current extraction levels are within safe limits for long-term sustainability.";
    }
  };

  const getCriticalRecommendations = (status: string, ratio: number) => {
    const recommendations = [
      "• Implement managed aquifer recharge (MAR) systems",
      "• Enhance rainwater harvesting infrastructure", 
      "• Deploy real-time groundwater monitoring networks",
      "• Regulate groundwater extraction through permits"
    ];

    if (ratio > 100) {
      recommendations.unshift("• **Immediate action required:** Reduce extraction by " + Math.round(ratio - 90) + "%");
    }

    return recommendations.join('\n');
  };

  const getHistoricalSummary = (records: any[]) => {
    const parameterTypes = [...new Set(records.map(r => r.parameterType))];
    return parameterTypes.map(type => `• **${type.charAt(0).toUpperCase() + type.slice(1)}** measurements available`).join('\n');
  };

  useEffect(() => {
    const onNewChat = () => {
      setMessages([]);
      setCurrentMessage("");
      textareaRef.current?.focus();
    };
    window.addEventListener("ingres:new-chat", onNewChat as EventListener);
    return () => window.removeEventListener("ingres:new-chat", onNewChat as EventListener);
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Main content container - spacious and elegant */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {messages.length === 0 ? (
          /* Welcome screen - Perplexity inspired */
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12">
            {/* Professional logo and title */}
            <div className="text-center space-y-6 fade-in-elegant">
              <div className="relative mx-auto w-16 h-16">
                <div className="w-16 h-16 glass-premium rounded-2xl flex items-center justify-center border border-gray-700/30 group hover:border-blue-500/30 transition-elegant">
                  <Database className="w-8 h-8 text-blue-400 icon-glow-soft" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500/20 rounded-full">
                  <div className="absolute inset-1 bg-blue-400 rounded-full pulse-subtle" />
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-display font-semibold text-white heading-premium">
                  <span className="gradient-accent">INGRES AI</span>
                </h1>
                
                <div className="h-8 flex items-center justify-center">
                  <p className="text-xl text-gray-300 text-premium max-w-2xl">
                    {typedText}<span className="animate-pulse text-blue-400">|</span>
                  </p>
                </div>
                
                <p className="text-sm text-gray-400 max-w-xl mx-auto text-premium">
                  Advanced AI analysis of groundwater data from the Integrated Groundwater Resource Estimation System
                </p>

                {/* Authentication status indicator */}
                {!isPending && (
                  <div className="flex items-center justify-center space-x-2 mt-4">
                    {session?.user ? (
                      <div className="flex items-center space-x-2 glass-premium px-3 py-1.5 rounded-full border border-green-500/20">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-300">Authenticated as {session.user.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 glass-premium px-3 py-1.5 rounded-full border border-yellow-500/20">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-yellow-300">Limited access - Sign in for full features</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Example queries - clean cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl">
              {EXAMPLE_QUERIES.map((example, index) => {
                const Icon = example.icon;
                return (
                  <Card
                    key={index}
                    className="p-6 cursor-pointer glass-premium border border-gray-700/30 hover:border-blue-500/30 hover-lift transition-elegant group"
                    onClick={() => handleExampleQuery(example.query)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                          <Icon className="w-5 h-5 text-blue-400 icon-glow-soft" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-elegant" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-semibold text-white text-premium group-hover:text-blue-100 transition-elegant">
                          {example.title}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed text-premium">
                          {example.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Professional call to action */}
            <div className="glass-premium rounded-xl px-6 py-4 border border-gray-700/30 fade-in-elegant">
              <p className="text-gray-300 font-medium text-sm flex items-center space-x-3 text-premium">
                <Search className="w-4 h-4 text-blue-400 icon-glow-soft" />
                <span>Ask about groundwater status, trends, or critical areas across India</span>
                <Sparkles className="w-4 h-4 text-blue-300 pulse-subtle" />
              </p>
            </div>
          </div>
        ) : (
          /* Chat messages - clean and spacious */
          <div className="space-y-8 py-8">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'} fade-in-elegant`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {message.type === 'assistant' && (
                  <Avatar className="w-10 h-10 border border-gray-700/30 flex-shrink-0">
                    <AvatarFallback className="bg-blue-500/10 text-blue-400 font-semibold text-sm border border-blue-500/20">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-3xl ${message.type === 'user' ? 'order-first' : ''}`}>
                  <Card className={`p-6 ${
                    message.type === 'user' 
                      ? 'bg-blue-500/10 border-blue-500/20 text-white' 
                      : message.error
                        ? 'glass-premium border-red-500/20'
                        : 'glass-premium border-gray-700/30'
                  } transition-elegant`}>
                    <div className="prose prose-sm max-w-none">
                      <div className={`whitespace-pre-wrap leading-relaxed text-premium ${
                        message.type === 'user' 
                          ? 'text-white' 
                          : message.error 
                            ? 'text-red-200'
                            : 'text-gray-200'
                      }`}>
                        {message.content}
                      </div>

                      {/* Render mocked stats + charts if available */}
                      {message.type === 'assistant' && message.data && !message.streaming && (
                        <div className="mt-5 space-y-4">
                          {Array.isArray(message.data.stats) && message.data.stats.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {message.data.stats.map((s: any, i: number) => (
                                <div key={i} className="glass-premium border border-gray-700/30 rounded-xl p-4">
                                  <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                                  <div className="text-2xl font-semibold text-white">{s.value}<span className="text-sm text-gray-400 ml-1">{s.unit || ''}</span></div>
                                </div>
                              ))}
                            </div>
                          )}

                          {message.data.chart && (
                            <div className="glass-premium border border-gray-700/30 rounded-xl p-4">
                              <ChartRenderer spec={message.data.chart as ChartSpec} height={280} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {message.sources && !message.streaming && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700/30">
                        {message.sources.map((source) => (
                          <Badge 
                            key={source.id} 
                            className="glass-premium border border-gray-700/30 text-gray-300 hover:border-blue-500/30 hover:text-blue-300 transition-elegant cursor-pointer"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            {source.title} ({source.year})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
                
                {message.type === 'user' && (
                  <Avatar className="w-10 h-10 border border-gray-700/30 flex-shrink-0">
                    <AvatarFallback className="bg-gray-800/50 text-gray-200 font-semibold text-sm">
                      {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Professional input area */}
      <div className="fixed bottom-0 left-0 right-0 z-30 glass-premium border-t border-gray-800/30">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="relative">
            <div className="glass-premium rounded-2xl border border-gray-700/30 hover:border-gray-600/40 transition-elegant focus-within:border-blue-500/40 focus-within:shadow-lg focus-within:shadow-blue-500/10">
              <textarea
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about groundwater status, trends, or critical areas..."
                className="w-full p-6 pr-16 bg-transparent border-0 rounded-2xl focus:outline-none resize-none text-gray-200 placeholder-gray-400 text-premium min-h-[80px] max-h-40"
                disabled={isStreaming}
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                }}
              />
              
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isStreaming}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 p-0 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-elegant hover-lift"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-center mt-4">
              <p className="text-gray-500 text-xs text-premium">
                INGRES AI provides data-driven insights from official groundwater monitoring networks. Verify critical decisions with source data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}