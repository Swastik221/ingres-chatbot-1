"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Lock, Mail, LogIn, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe: remember,
        callbackURL: "/chat",
      } as any);

      if ((error as any)?.code) {
        toast.error("Invalid email or password. Please make sure you have already registered an account and try again.");
        setLoading(false);
        return;
      }

      toast.success("Welcome back!");
      router.push("/chat");
    } catch (err: any) {
      toast.error("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 fade-in-elegant" style={{ background: "#0a0f1c" }}>
      <div className="cursor-spotlight fixed" style={{ left: "50%", top: "15%" }} />
      <Card className="w-full max-w-md glass-premium border border-gray-700/30 p-8 transition-elegant">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 glass-premium rounded-xl flex items-center justify-center border border-gray-700/30 mb-3 hover-lift">
            <Sparkles className="w-6 h-6 text-blue-400 icon-glow-soft" />
          </div>
          <h1 className="text-2xl font-semibold text-white heading-premium">Sign in to INGRES AI</h1>
          <p className="text-sm text-gray-400 mt-1 text-premium">Use your email and password</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300 text-premium">Email</Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 icon-glow-soft" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pl-9 bg-transparent border-gray-700/40 focus-visible:ring-blue-500/40 transition-elegant"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300 text-premium">Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 icon-glow-soft" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 bg-transparent border-gray-700/40 focus-visible:ring-blue-500/40 transition-elegant"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" checked={remember} onCheckedChange={(v:any) => setRemember(!!v)} className="transition-elegant" />
              <Label htmlFor="remember" className="text-gray-400 text-sm text-premium">Remember me</Label>
            </div>
            <div className="text-xs text-gray-500 text-premium">No account? <Link href="/register" className="text-blue-400 hover:underline transition-elegant">Register</Link></div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl transition-elegant magnetic-btn btn-premium">
            {loading ? "Signing in..." : (<span className="inline-flex items-center gap-2 text-premium"><LogIn className="w-4 h-4" /> Sign In</span>)}
          </Button>
        </form>
      </Card>
    </div>
  );
}