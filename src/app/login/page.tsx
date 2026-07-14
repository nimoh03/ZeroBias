"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { login, signup } from './action';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('error');

  // Atmospheric mouse-tracking glow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const glow = document.getElementById('ai-glow');
      if (glow) {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        glow.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(37, 99, 235, 0.08) 0%, transparent 60%)`;
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <div 
        id="ai-glow" 
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-300"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.05) 0%, transparent 60%)' }}
      ></div>

      <div className="w-full max-w-[440px] relative z-10 flex flex-col gap-8">
        
        <Link href="/" className="flex flex-col items-center gap-4 group">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <Zap size={28} className="text-white" fill="currentColor" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight mb-1">HireFlow AI</h1>
            <p className="text-sm text-on-surface-variant">The future of intelligent recruitment.</p>
          </div>
        </Link>

        <div className="bg-surface/80 backdrop-blur-xl border border-outline-variant/50 shadow-2xl rounded-3xl p-8 overflow-hidden relative">
          
          {errorMessage && (
            <div className="mb-6 p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium flex items-center gap-2">
              <AlertCircle size={18} />
              {errorMessage}
            </div>
          )}
          
          {isLogin ? (
            <div className="animate-in slide-in-from-left-4 fade-in duration-300 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Welcome back</h2>
                <p className="text-sm text-on-surface-variant">Enter your credentials to access your dashboard.</p>
              </div>

              <form action={login} className="flex flex-col gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Email Address</label>
                  <input 
                    name="email"
                    type="email" 
                    required
                    placeholder="name@company.com" 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold">Password</label>
                    <Link href="#" className="text-xs font-bold text-primary hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <input 
                      name="password"
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••" 
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <SubmitButton defaultText="Sign In" pendingText="Signing In..." />
              </form>

              <p className="text-center text-sm text-on-surface-variant mt-2">
                Don't have an account?{' '}
                <button onClick={() => setIsLogin(false)} className="font-bold text-primary hover:underline">
                  Create an account
                </button>
              </p>
            </div>

          ) : (

            <div className="animate-in slide-in-from-right-4 fade-in duration-300 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Get started for free</h2>
                <p className="text-sm text-on-surface-variant">Join 5,000+ teams hiring faster with AI.</p>
              </div>

              <form action={signup} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">First Name</label>
                    <input 
                      name="firstName"
                      type="text" 
                      required
                      placeholder="Jane" 
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Last Name</label>
                    <input 
                      name="lastName"
                      type="text" 
                      required
                      placeholder="Doe" 
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold">Work Email</label>
                  <input 
                    name="email"
                    type="email" 
                    required
                    placeholder="jane@company.com" 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">Create Password</label>
                  <div className="relative">
                    <input 
                      name="password"
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="Min. 8 characters" 
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5 mt-1.5">
                    <ShieldCheck size={14} className="text-primary" /> Please keep your password safe and strong.
                  </p>
                </div>
                
                <SubmitButton defaultText="Create Account" pendingText="Creating..." />
              </form>

              <p className="text-center text-sm text-on-surface-variant mt-2">
                Already have an account?{' '}
                <button onClick={() => setIsLogin(true)} className="font-bold text-primary hover:underline">
                  Sign in instead
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Separate component to use the useFormStatus hook
function SubmitButton({ defaultText, pendingText }: { defaultText: string, pendingText: string }) {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full mt-4 bg-primary text-on-primary font-bold py-3.5 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          {pendingText}
        </>
      ) : (
        <>
          {defaultText} <ArrowRight size={18} />
        </>
      )}
    </button>
  );
}