"use client";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", remember: false },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: values.username,
        password: values.password,
      });

      const { access_token, user } = response.data;
      toast.success("Successfully logged in!");
      login(user, access_token);
    } catch (error: any) {
      toast.error(typeof error.response?.data?.detail === "string" ? error.response.data.detail : "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-grow min-h-[calc(100vh-6rem)]">
      <aside className="hidden lg:flex lg:w-1/2 relative bg-surface-container-lowest overflow-hidden border-r border-outline-variant/30">
        {/* Decorative Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(79,70,229,0.15),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        </div>
        
        <div className="relative z-10 w-full h-full p-cxl flex flex-col justify-center max-w-2xl mx-auto">
          <div className="space-y-cmd">
            <h1 className="font-display-lg text-[3.5rem] leading-tight text-white font-bold tracking-tight">
              Master your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">video workflow</span> with precision.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant/90 max-w-lg leading-relaxed">
              The professional command center for enterprise video scheduling, automated distribution, and performance analytics.
            </p>
            <div className="pt-clg grid grid-cols-2 gap-gutter">
              <div className="p-cmd bg-surface-container-low/30 backdrop-blur-md border border-outline-variant/30 rounded-2xl shadow-xl hover:bg-surface-container-low/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                  <span className="material-symbols-outlined text-primary">speed</span>
                </div>
                <div className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-1">Performance</div>
                <div className="font-headline-md text-headline-md text-white">1.2s <span className="text-body-sm font-normal text-on-surface-variant">Sync</span></div>
              </div>
              <div className="p-cmd bg-surface-container-low/30 backdrop-blur-md border border-outline-variant/30 rounded-2xl shadow-xl hover:bg-surface-container-low/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 border border-secondary/20">
                  <span className="material-symbols-outlined text-secondary">hub</span>
                </div>
                <div className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-1">Reach</div>
                <div className="font-headline-md text-headline-md text-white">12+ <span className="text-body-sm font-normal text-on-surface-variant">Channels</span></div>
              </div>
            </div>
          </div>
        </div>
      </aside>
      <main className="w-full lg:w-1/2 flex items-center justify-center p-cmd bg-surface relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/3"></div>
        
        <div className="w-full max-w-[440px] z-10 bg-surface-container-lowest/50 backdrop-blur-xl p-8 rounded-3xl border border-outline-variant/50 shadow-2xl">
          <div className="mb-clg text-center">
            <h2 className="font-display-md text-3xl font-bold text-white mb-2 tracking-tight">Welcome back</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Enter your credentials to access your dashboard.</p>
          </div>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-cmd">
            <div className="space-y-cxs">
              <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="username">Work Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input 
                  {...form.register("username")}
                  className={`w-full bg-surface-container-low/80 border ${form.formState.errors.username ? 'border-error' : 'border-outline-variant/50'} rounded-xl py-3 pl-12 pr-4 font-body-md text-white placeholder:text-outline/50 transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none hover:bg-surface-container-low`} 
                  id="username" 
                  placeholder="name@company.com" 
                  type="email" 
                />
              </div>
              {form.formState.errors.username && <p className="text-error text-sm mt-1 ml-1">{form.formState.errors.username.message}</p>}
            </div>
            
            <div className="space-y-cxs">
              <div className="flex justify-between items-center px-1">
                <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="password">Password</label>
                <Link className="font-body-sm text-xs text-primary hover:text-primary/80 transition-colors font-medium" href="/forgot-password">Forgot password?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input 
                  {...form.register("password")}
                  className={`w-full bg-surface-container-low/80 border ${form.formState.errors.password ? 'border-error' : 'border-outline-variant/50'} rounded-xl py-3 pl-12 pr-12 font-body-md text-white placeholder:text-outline/50 transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none hover:bg-surface-container-low`} 
                  id="password" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"} 
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-white transition-colors" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {form.formState.errors.password && <p className="text-error text-sm mt-1 ml-1">{form.formState.errors.password.message}</p>}
            </div>
            
            <div className="flex items-center">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 bg-surface-container-low border border-outline-variant/50 rounded flex-shrink-0 group-hover:border-primary transition-colors overflow-hidden">
                  <input {...form.register("remember")} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer peer" type="checkbox" />
                  <div className="absolute inset-0 bg-primary translate-y-full peer-checked:translate-y-0 transition-transform duration-200"></div>
                  <span className="material-symbols-outlined text-[14px] text-white absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity duration-200" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
                <span className="font-body-sm text-sm text-on-surface-variant select-none group-hover:text-on-surface transition-colors">Remember me for 30 days</span>
              </label>
            </div>
            
            <div className="pt-2">
              <button disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-white font-headline-md text-body-md py-3.5 rounded-xl active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-70 disabled:active:scale-100 font-semibold" type="submit">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isLoading ? "Signing in..." : "Sign In"}
                {!isLoading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
              </button>
            </div>
          </form>
          
          <div className="relative my-clg">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/50"></div></div>
            <div className="relative flex justify-center"><span className="bg-surface-container-lowest px-4 font-label-md text-xs text-outline uppercase tracking-widest font-semibold backdrop-blur-xl">Or continue with</span></div>
          </div>
          
          <button className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-low/50 border border-outline-variant/50 rounded-xl hover:bg-surface-container-low transition-all active:scale-[0.98] group shadow-sm">
            <svg fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="font-body-md text-sm font-medium text-white group-hover:text-primary transition-colors">Google</span>
          </button>
          
          <p className="mt-clg text-center font-body-sm text-sm text-on-surface-variant">
            Don't have an account?
            <Link className="text-primary hover:text-primary/80 font-semibold ml-1.5 transition-colors" href="/register">Sign up for a free trial</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
