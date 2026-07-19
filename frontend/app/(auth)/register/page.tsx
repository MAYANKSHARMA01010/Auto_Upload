"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
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
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
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
      setAuth(user, access_token);
      
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(typeof error.response?.data?.detail === "string" ? error.response.data.detail : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="w-full flex-grow grid lg:grid-cols-2">
        <section className="hidden lg:relative lg:flex items-center justify-center overflow-hidden bg-surface-container-lowest">
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-cover bg-center opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-lowest/80 via-transparent to-transparent"></div>
          </div>
          <div className="relative z-10 p-cxl flex flex-col items-start gap-clg max-w-xl">
            <div className="flex items-center gap-cmd">
              <div className="w-16 h-16 glass-effect rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[40px]">automation</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">ClipScheduler</h2>
            </div>
            <div className="space-y-csm">
              <h1 className="font-display-lg text-display-lg text-white">Join the future of video automation.</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">Scale your creative workflow with enterprise-grade scheduling, automated clip generation, and intelligent distribution.</p>
            </div>
            <div className="mt-clg flex items-center gap-cmd">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-slate-800"></div>
                <div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-slate-700"></div>
                <div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-slate-600"></div>
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant">TRUSTED BY 2,000+ ENTERPRISES</span>
            </div>
          </div>
        </section>
        
        <section className="relative flex flex-col justify-center items-center px-4 md:px-xl py-cxl bg-surface">
          <div className="w-full max-w-md space-y-clg">
            <div className="lg:hidden flex items-center justify-center mb-cxl">
              <div className="flex items-center gap-cxs">
                <span className="material-symbols-outlined text-primary-container text-[32px]">automation</span>
                <span className="font-headline-md text-headline-md font-bold tracking-tight text-white">ClipScheduler</span>
              </div>
            </div>
            
            <div className="space-y-cxs">
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Create your account</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Start your 14-day professional trial.</p>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-cmd">
              <div className="space-y-cxs">
                <label className="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider" htmlFor="full_name">Full Name</label>
                <div className="relative">
                  <input 
                    {...form.register("full_name")}
                    className={`w-full bg-surface-container-low border ${form.formState.errors.full_name ? 'border-error' : 'border-outline-variant'} text-on-surface font-body-md text-body-md rounded-lg px-cmd py-3 focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all outline-none placeholder:text-outline`} 
                    id="full_name" 
                    placeholder="John Doe" 
                    type="text" 
                  />
                </div>
                {form.formState.errors.full_name && <p className="text-error text-sm">{form.formState.errors.full_name.message}</p>}
              </div>
              
              <div className="space-y-cxs">
                <label className="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider" htmlFor="email">Work Email</label>
                <div className="relative">
                  <input 
                    {...form.register("email")}
                    className={`w-full bg-surface-container-low border ${form.formState.errors.email ? 'border-error' : 'border-outline-variant'} text-on-surface font-body-md text-body-md rounded-lg px-cmd py-3 focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all outline-none placeholder:text-outline`} 
                    id="email" 
                    placeholder="john@company.com" 
                    type="email" 
                  />
                </div>
                {form.formState.errors.email && <p className="text-error text-sm">{form.formState.errors.email.message}</p>}
              </div>
              
              <div className="space-y-cxs">
                <label className="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider" htmlFor="password">Password</label>
                <div className="relative flex items-center">
                  <input 
                    {...form.register("password")}
                    className={`w-full bg-surface-container-low border ${form.formState.errors.password ? 'border-error' : 'border-outline-variant'} text-on-surface font-body-md text-body-md rounded-lg px-cmd py-3 pr-12 focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all outline-none placeholder:text-outline`} 
                    id="password" 
                    placeholder="Min. 8 characters" 
                    type={showPassword ? "text" : "password"} 
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-on-surface-variant hover:text-primary transition-colors flex items-center" 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {form.formState.errors.password && <p className="text-error text-sm">{form.formState.errors.password.message}</p>}
              </div>
              
              <button disabled={isLoading} className="w-full bg-primary-container hover:bg-inverse-primary text-white font-headline-md text-headline-md py-4 rounded-xl shadow-lg shadow-primary-container/20 active:scale-[0.98] transition-all duration-200 mt-csm disabled:opacity-70 flex justify-center items-center" type="submit">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
            
            <div className="relative flex items-center py-cmd">
              <div className="flex-grow border-t border-outline-variant"></div>
              <span className="flex-shrink mx-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-outline-variant"></div>
            </div>
            
            <button className="w-full flex items-center justify-center gap-cmd bg-surface-container-high border border-outline-variant text-on-surface font-body-md text-body-md py-3 rounded-xl hover:bg-surface-variant transition-colors active:scale-[0.98]">
              <svg fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
            
            <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
              Already have an account?
              <Link className="text-primary hover:text-secondary font-medium transition-colors ml-1" href="/login">Log in</Link>
            </p>
            
            <p className="text-center font-label-md text-label-md text-outline leading-relaxed mt-clg">
              By signing up, you agree to our <a className="underline hover:text-on-surface" href="#">Terms of Service</a> and <a className="underline hover:text-on-surface" href="#">Privacy Policy</a>.
            </p>
          </div>
          
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/5 blur-[100px] rounded-full -z-10 pointer-events-none"></div>
        </section>
      </div>
    </div>
  );
}
