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

const registerSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function RegisterPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", {
        email: values.email,
        password: values.password,
        name: values.full_name,
      });

      // After successful registration, log them in automatically
      const loginRes = await api.post("/auth/login", {
        email: values.email,
        password: values.password,
      });

      const { access_token, user } = loginRes.data;
      toast.success("Account created successfully!");
      login(user, access_token);
    } catch (error: any) {
      toast.error(typeof error.response?.data?.detail === "string" ? error.response.data.detail : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-grow min-h-[calc(100vh-6rem)]">
      <div className="w-full flex-grow flex">
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
                Join the future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">video automation.</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant/90 max-w-lg leading-relaxed">
                Scale your creative workflow with enterprise-grade scheduling, automated clip generation, and intelligent distribution.
              </p>
              <div className="mt-clg flex flex-col items-start gap-cmd">
                <div className="flex items-center gap-4 bg-surface-container-low/30 backdrop-blur-md px-6 py-4 rounded-2xl border border-outline-variant/30 shadow-xl">
                  <div className="flex -space-x-3">
                    <div className="w-12 h-12 rounded-full border-2 border-surface-container-lowest bg-slate-800 flex items-center justify-center text-xs font-bold text-white">N</div>
                    <div className="w-12 h-12 rounded-full border-2 border-surface-container-lowest bg-primary/20 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-sm">rocket_launch</span></div>
                    <div className="w-12 h-12 rounded-full border-2 border-surface-container-lowest bg-secondary/20 flex items-center justify-center text-secondary"><span className="material-symbols-outlined text-sm">schedule</span></div>
                  </div>
                  <div className="text-left">
                    <span className="block font-headline-sm text-white font-bold">2,000+</span>
                    <span className="block font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Trusted Enterprises</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
        
        <main className="w-full lg:w-1/2 flex items-center justify-center p-cmd bg-surface relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/3"></div>
          
          <div className="w-full max-w-[440px] z-10 bg-surface-container-lowest/50 backdrop-blur-xl p-8 rounded-3xl border border-outline-variant/50 shadow-2xl my-cxl">
            <div className="mb-clg text-center">
              <h2 className="font-display-md text-3xl font-bold text-white mb-2 tracking-tight">Create your account</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Start your 14-day professional trial.</p>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-cmd">
              <div className="space-y-cxs">
                <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="full_name">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <input 
                    {...form.register("full_name")}
                    className={`w-full bg-surface-container-low/80 border ${form.formState.errors.full_name ? 'border-error' : 'border-outline-variant/50'} rounded-xl py-3 pl-12 pr-4 font-body-md text-white placeholder:text-outline/50 transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none hover:bg-surface-container-low`} 
                    id="full_name" 
                    placeholder="John Doe" 
                    type="text" 
                  />
                </div>
                {form.formState.errors.full_name && <p className="text-error text-sm mt-1 ml-1">{form.formState.errors.full_name.message}</p>}
              </div>
              
              <div className="space-y-cxs">
                <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="email">Work Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input 
                    {...form.register("email")}
                    className={`w-full bg-surface-container-low/80 border ${form.formState.errors.email ? 'border-error' : 'border-outline-variant/50'} rounded-xl py-3 pl-12 pr-4 font-body-md text-white placeholder:text-outline/50 transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none hover:bg-surface-container-low`} 
                    id="email" 
                    placeholder="john@company.com" 
                    type="email" 
                  />
                </div>
                {form.formState.errors.email && <p className="text-error text-sm mt-1 ml-1">{form.formState.errors.email.message}</p>}
              </div>
              
              <div className="space-y-cxs">
                <label className="font-label-md text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1" htmlFor="password">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input 
                    {...form.register("password")}
                    className={`w-full bg-surface-container-low/80 border ${form.formState.errors.password ? 'border-error' : 'border-outline-variant/50'} rounded-xl py-3 pl-12 pr-12 font-body-md text-white placeholder:text-outline/50 transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none hover:bg-surface-container-low`} 
                    id="password" 
                    placeholder="Min. 8 characters" 
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
              
              <div className="pt-2">
                <button disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-white font-headline-md text-body-md py-3.5 rounded-xl active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-70 disabled:active:scale-100 font-semibold" type="submit">
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {isLoading ? "Creating Account..." : "Create Account"}
                  {!isLoading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
                </button>
              </div>
            </form>
            
            <div className="relative my-clg">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/50"></div></div>
              <div className="relative flex justify-center"><span className="bg-surface-container-lowest/50 px-4 font-label-md text-xs text-outline uppercase tracking-widest font-semibold backdrop-blur-xl">Or continue with</span></div>
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
              Already have an account?
              <Link className="text-primary hover:text-primary/80 font-semibold ml-1.5 transition-colors" href="/login">Log in</Link>
            </p>
            
            <p className="text-center font-label-md text-xs text-outline leading-relaxed mt-4">
              By signing up, you agree to our <a className="underline hover:text-on-surface transition-colors" href="#">Terms of Service</a> and <a className="underline hover:text-on-surface transition-colors" href="#">Privacy Policy</a>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
