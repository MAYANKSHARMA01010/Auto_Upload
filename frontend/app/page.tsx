"use client";

import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background">
        <Link className="flex items-center justify-center gap-2" href="/">
          <Video className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">ClipScheduler</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#pricing">
            Pricing
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Login
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 max-w-[800px]">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  The Enterprise Video Scheduler
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Schedule, manage, and publish your short-form videos across YouTube, Instagram, TikTok, Facebook, Threads, and X from a single dashboard.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-12 px-8">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4 text-center border p-8 rounded-xl bg-card">
                <Video className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Write Once, Publish Anywhere</h3>
                <p className="text-muted-foreground">Upload your video once and deploy it to all major platforms simultaneously with custom metadata for each.</p>
              </div>
              <div className="flex flex-col justify-center space-y-4 text-center border p-8 rounded-xl bg-card">
                <Calendar className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Smart Scheduling</h3>
                <p className="text-muted-foreground">Plan your content calendar weeks in advance. Our resilient background workers ensure your posts go live precisely on time.</p>
              </div>
              <div className="flex flex-col justify-center space-y-4 text-center border p-8 rounded-xl bg-card">
                <CheckCircle className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Reliable Execution</h3>
                <p className="text-muted-foreground">Built on FastAPI and PostgreSQL for enterprise-grade reliability, with automatic retries for failed API uploads.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-background">
        <p className="text-xs text-muted-foreground">
          © 2026 ClipScheduler. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
