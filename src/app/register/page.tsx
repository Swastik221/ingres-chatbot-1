"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Lock, UserPlus, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirm) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authClient.signUp.email({
        email,
        name,
        password,
      });

      if (error?.code) {
        const errorMap: Record<string, string> = {
          USER_ALREADY_EXISTS: "Email already registered",
        };
        toast.error(errorMap[error.code] || "Registration failed");
        setLoading(false);
        return;
      }

      toast.success("Account created! Please check your email to verify.");
      router.push("/login?registered=true");
    } catch (err: any) {
      toast.error("Registration failed. Try again.");
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
          <h1 className="text-2xl font-semibold text-white heading-premium">Create your INGRES AI account</h1>
          <p className="text-sm text-gray-400 mt-1 text-premium">Sign up with your name, email and password</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300 text-premium">Full Name</Label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 icon-glow-soft" />
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="pl-9 bg-transparent border-gray-700/40 focus-visible:ring-blue-500/40 transition-elegant"
                autoComplete="name"
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-gray-300 text-premium">Confirm Password</Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 icon-glow-soft" />
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="pl-9 bg-transparent border-gray-700/40 focus-visible:ring-blue-500/40 transition-elegant"
                autoComplete="off"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl transition-elegant magnetic-btn btn-premium">
            {loading ? "Creating account..." : (
              <span className="inline-flex items-center gap-2 text-premium">
                <UserPlus className="w-4 h-4" /> Create Account
              </span>
            )}
          </Button>

          <p className="text-center text-xs text-gray-500 mt-1 text-premium">
            Already have an account? <Link href="/login" className="text-blue-400 hover:underline transition-elegant">Sign in</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}