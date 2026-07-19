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
        <div className="relative z-10 w-full h-full p-cxl flex flex-col justify-between">
          <div className="flex items-center space-x-3">
            <img alt="ClipScheduler Logo" className="w-10 h-10 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAu1sOlfOcGGQkzzvvwJdTLEFrgXzrI1XtNZHHQIvWtjboYCamJ8jdBR773F-PAcu75XqqKccY5JgRM8nMwOuWcRiQ4NPUX5d8gNbKiYJvyy_CWNGYf9qEDe4jepmntAGLnXDhSZ9VHYbjnAsxOh9Tmi2gjtjjsNpY9K8Q42Nvp9njqrpCDkvqsHlsAwQowLYawxxfET8alwvceAIDFLo26i8ba-RrnnH74wD3kjbzNCJ-9fAUN0opKZ4D7TMx8KqTWmnVkoIhcMV4" />
            <span className="font-headline-md text-headline-md font-bold tracking-tight text-primary">ClipScheduler</span>
          </div>
          <div className="space-y-cmd max-w-xl">
            <h1 className="font-display-lg text-display-lg leading-tight text-on-surface">
              Master your <span className="text-primary">video workflow</span> with precision.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant/80">
              The professional command center for enterprise video scheduling, automated distribution, and performance analytics.
            </p>
            <div className="pt-cmd grid grid-cols-2 gap-gutter">
              <div className="p-cmd bg-surface-container-low/50 border border-outline-variant/20 rounded-xl">
                <span className="material-symbols-outlined text-primary mb-2">speed</span>
                <div className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Performance</div>
                <div className="font-headline-md text-headline-md">1.2s <span className="text-body-sm font-normal text-on-surface-variant">Sync</span></div>
              </div>
              <div className="p-cmd bg-surface-container-low/50 border border-outline-variant/20 rounded-xl">
                <span className="material-symbols-outlined text-secondary mb-2">hub</span>
                <div className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">Reach</div>
                <div className="font-headline-md text-headline-md">12+ <span className="text-body-sm font-normal text-on-surface-variant">Channels</span></div>
              </div>
            </div>
          </div>
          <div className="font-body-sm text-body-sm text-on-surface-variant">
            © 2024 ClipScheduler Inc. Professional Grade Automation.
          </div>
        </div>
      </aside>
      <main className="w-full lg:w-1/2 flex items-center justify-center p-cmd bg-surface relative">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary-container/5 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="w-full max-w-[440px] z-10">
          <div className="lg:hidden flex justify-center mb-cxl">
            <div className="flex items-center space-x-3">
              <img alt="ClipScheduler Logo" className="w-12 h-12 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAu1sOlfOcGGQkzzvvwJdTLEFrgXzrI1XtNZHHQIvWtjboYCamJ8jdBR773F-PAcu75XqqKccY5JgRM8nMwOuWcRiQ4NPUX5d8gNbKiYJvyy_CWNGYf9qEDe4jepmntAGLnXDhSZ9VHYbjnAsxOh9Tmi2gjtjjsNpY9K8Q42Nvp9njqrpCDkvqsHlsAwQowLYawxxfET8alwvceAIDFLo26i8ba-RrnnH74wD3kjbzNCJ-9fAUN0opKZ4D7TMx8KqTWmnVkoIhcMV4" />
              <span className="font-headline-md text-headline-md font-bold tracking-tight text-primary">ClipScheduler</span>
            </div>
          </div>
          <div className="mb-cxl">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-cxs">Welcome back</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Enter your credentials to access your dashboard.</p>
          </div>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-cmd">
            <div className="space-y-base">
              <label className="font-label-md text-label-md text-on-surface-variant ml-1" htmlFor="username">WORK EMAIL</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-cmd flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input 
                  {...form.register("username")}
                  className={`w-full bg-surface-container-low border ${form.formState.errors.username ? 'border-error' : 'border-outline-variant'} rounded-lg py-cmd pl-12 pr-cmd font-body-md text-body-md text-on-surface placeholder:text-outline/50 transition-all focus:ring-2 focus:ring-primary-container outline-none`} 
                  id="username" 
                  placeholder="name@company.com" 
                  type="email" 
                />
              </div>
              {form.formState.errors.username && <p className="text-error text-sm mt-1">{form.formState.errors.username.message}</p>}
            </div>
            
            <div className="space-y-base">
              <div className="flex justify-between items-center px-1">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">PASSWORD</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-cmd flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input 
                  {...form.register("password")}
                  className={`w-full bg-surface-container-low border ${form.formState.errors.password ? 'border-error' : 'border-outline-variant'} rounded-lg py-cmd pl-12 pr-cmd font-body-md text-body-md text-on-surface placeholder:text-outline/50 transition-all focus:ring-2 focus:ring-primary-container outline-none`} 
                  id="password" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"} 
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-cmd flex items-center text-outline hover:text-primary transition-colors" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {form.formState.errors.password && <p className="text-error text-sm mt-1">{form.formState.errors.password.message}</p>}
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 bg-surface-container-low border border-outline-variant rounded group-hover:border-primary transition-colors">
                  <input {...form.register("remember")} className="absolute inset-0 opacity-0 cursor-pointer peer" type="checkbox" />
                  <span className="material-symbols-outlined text-[16px] text-primary hidden peer-checked:block" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant select-none">Remember me</span>
              </label>
              <Link className="font-body-sm text-body-sm text-primary hover:text-primary/80 transition-colors font-medium" href="/forgot-password">Forgot password?</Link>
            </div>
            
            <div className="pt-csm">
              <button disabled={isLoading} className="w-full bg-primary-container text-on-primary-container font-headline-md text-body-md py-cmd rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary-container/20 disabled:opacity-70" type="submit">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? "Signing In..." : "Sign In"}
                {!isLoading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
              </button>
            </div>
          </form>
          
          <div className="relative my-cxl">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant"></div></div>
            <div className="relative flex justify-center"><span className="bg-surface px-cmd font-label-md text-label-md text-outline uppercase tracking-widest">or continue with</span></div>
          </div>
          
          <button className="w-full flex items-center justify-center gap-3 py-cmd px-cmd bg-surface border border-outline-variant rounded-lg hover:bg-surface-container-low transition-all active:scale-[0.98] group">
            <svg fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">Sign in with Google</span>
          </button>
          
          <p className="mt-cxl text-center font-body-sm text-body-sm text-on-surface-variant">
            Don't have an account?
            <Link className="text-primary hover:underline font-semibold ml-1" href="/register">Sign up for a free trial</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
