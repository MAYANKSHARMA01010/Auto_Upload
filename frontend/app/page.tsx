import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function Home() {
    return (
        <div className="bg-background min-h-screen font-body-md text-on-background">

            {/* TopAppBar */}
            <PublicNavbar />
            <main className="pt-32">
                {/* Hero Section */}
                <section className="max-w-container_max mx-auto px-clg pb-cxl text-center relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 blur-[120px] opacity-20 bg-primary-container w-[600px] h-[400px] rounded-full"></div>
                    <h1 className="font-display-lg text-display-lg max-w-4xl mx-auto mb-cmd leading-tight">
                        The Operating System for <span className="text-primary">Video Growth</span>
                    </h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-clg">
                        Scale your reach across every platform. Schedule, automate, and optimize your video content strategy from a single high-performance dashboard.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-cmd">
                        <Link href="/register" className="flex items-center justify-center bg-primary-container text-on-primary-container px-clg py-cmd rounded-xl font-headline-md text-headline-md font-bold hover:shadow-[0_0_24px_rgba(79,70,229,0.3)] transition-all">
                            Start Free Trial
                        </Link>
                        <button className="border border-outline text-on-surface px-clg py-cmd rounded-xl font-headline-md text-headline-md font-medium hover:bg-surface-variant transition-colors">
                            View Demo
                        </button>
                    </div>
                </section>
                {/* Demo Section (Dashboard Preview) */}
                <section className="max-w-container_max mx-auto px-clg pb-cxl">
                    <div className="tonal-layer-1 rounded-xl p-base overflow-hidden shadow-2xl">
                        <div className="bg-surface-container-high px-csm py-cxs border-b border-outline-variant flex items-center gap-cxs">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-error"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-tertiary"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                            </div>
                            <div className="bg-surface-container-low rounded px-cmd py-0.5 text-[10px] text-on-surface-variant flex-1 max-w-sm mx-auto text-center font-mono-sm">
                                app.clipscheduler.com/dashboard
                            </div>
                        </div>
                        <div className="aspect-video relative group">
                            <img className="w-full h-full object-cover" data-alt="A sophisticated dark-mode enterprise software dashboard interface for video scheduling and management. The UI features a left sidebar with navigation icons, a central calendar grid filled with video thumbnail previews and engagement graphs, and a social media management panel on the right. The color palette is dominated by deep indigo and charcoal grays, with bright purple accents for active states and data visualizations. Professional, high-contrast, and data-rich aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKzPCC0uX_r3Rhg25IWPNuENvTfCPvwbr6UcTIfEebeiMLE7cpIn1warMQJiLJI5GZwN78EykyJT5GC68vxQSoVDhy3uY5uJTHQGd07yutJkN0kmieQyuTA7wwUjiW9ophlK_GjtUhr325DKinWwaRkOwMMFFbYKV0l2KePMlmciWp99ycg_5o84QATZ9HW4e-y4dR3Mcv9KYdkhKuIzklDapyYDG01NTRtLXg4nTx8S5ndLcl8hWdo2drRbv_pqDjcmCg9Gu95EM" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                </section>
                {/* Trust Bar */}
                <section className="bg-surface-container-low py-clg mb-cxl">
                    <div className="max-w-container_max mx-auto px-clg flex flex-col md:flex-row items-center justify-between gap-clg">
                        <p className="font-label-md text-label-md uppercase tracking-[0.2em] text-on-surface-variant font-bold">Trusted by brands on</p>
                        <div className="flex flex-wrap justify-center gap-cxl opacity-60">
                            <div className="flex items-center gap-cxs group">
                                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                                <span className="font-bold text-on-surface">YouTube</span>
                            </div>
                            <div className="flex items-center gap-cxs group">
                                <span className="material-symbols-outlined text-tertiary">camera</span>
                                <span className="font-bold text-on-surface">Instagram</span>
                            </div>
                            <div className="flex items-center gap-cxs group">
                                <span className="material-symbols-outlined text-primary">movie_edit</span>
                                <span className="font-bold text-on-surface">TikTok</span>
                            </div>
                            <div className="flex items-center gap-cxs group">
                                <span className="material-symbols-outlined text-secondary-container">face_nod</span>
                                <span className="font-bold text-on-surface">Facebook</span>
                            </div>
                            <div className="flex items-center gap-cxs group">
                                <span className="material-symbols-outlined text-on-surface">close</span>
                                <span className="font-bold text-on-surface">X</span>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Features Section (Bento Grid Style) */}
                <section className="max-w-container_max mx-auto px-clg pb-cxl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                        {/* Drag-and-Drop Feature */}
                        <div className="tonal-layer-1 rounded-xl p-clg flex flex-col group indigo-glow transition-all">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-cmd group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
                            </div>
                            <h3 className="font-headline-md text-headline-md mb-csm text-on-surface">Drag-and-Drop</h3>
                            <p className="text-on-surface-variant font-body-sm text-body-sm leading-relaxed">
                                Seamlessly upload and organize your entire content library. Our enterprise-grade asset manager handles 4K exports with zero latency.
                            </p>
                        </div>
                        {/* AI Video Processing Feature */}
                        <div className="tonal-layer-1 rounded-xl p-clg flex flex-col group indigo-glow transition-all">
                            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-cmd group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-secondary text-3xl">auto_fix_high</span>
                            </div>
                            <h3 className="font-headline-md text-headline-md mb-csm text-on-surface">AI Video Processing</h3>
                            <p className="text-on-surface-variant font-body-sm text-body-sm leading-relaxed">
                                Auto-optimize resolution, aspect ratios, and file formats for every social platform simultaneously using our proprietary AI engine.
                            </p>
                        </div>
                        {/* Bulk Scheduling Feature */}
                        <div className="tonal-layer-1 rounded-xl p-clg flex flex-col group indigo-glow transition-all">
                            <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center mb-cmd group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-tertiary text-3xl">calendar_month</span>
                            </div>
                            <h3 className="font-headline-md text-headline-md mb-csm text-on-surface">Bulk Scheduling</h3>
                            <p className="text-on-surface-variant font-body-sm text-body-sm leading-relaxed">
                                Plan weeks of cross-platform content in minutes. Our intuitive visual calendar provides a birds-eye view of your entire growth strategy.
                            </p>
                        </div>
                    </div>
                </section>
                {/* Call to Action Splash */}
                <section className="max-w-container_max mx-auto px-clg pb-cxl">
                    <div className="relative rounded-xl overflow-hidden bg-primary-container p-cxl flex flex-col md:flex-row items-center justify-between">
                        <div className="relative z-10 text-center md:text-left mb-clg md:mb-0">
                            <h2 className="font-headline-lg text-headline-lg text-white mb-cxs">Ready to scale your video presence?</h2>
                            <p className="text-on-primary-container font-body-md text-body-md opacity-90 max-w-md">Join 500+ enterprises automating their social growth with ClipScheduler.</p>
                        </div>
                        <div className="flex gap-cmd relative z-10">
                            <Link href="/register" className="flex items-center justify-center bg-white text-primary-container px-clg py-cmd rounded-xl font-bold hover:bg-on-primary-container transition-colors shadow-lg">Get Started Now</Link>
                        </div>
                        {/* Abstract Background Detail */}
                        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-400 opacity-20 blur-3xl"></div>
                        <div className="absolute top-0 left-1/2 w-full h-full -translate-x-1/2 pointer-events-none overflow-hidden opacity-10">
                            <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
                                <path d="M0 100 Q 25 0 50 100 T 100 100" fill="none" stroke="white" strokeWidth="0.5" />
                            </svg>
                        </div>
                    </div>
                </section>
            </main>
            {/* Footer */}
            <PublicFooter />

        </div>
    );
}
