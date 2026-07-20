import Link from "next/link";

export function PublicNavbar() {
    return (
        <header className="bg-surface-container-lowest fixed top-0 w-full z-50 border-b border-outline-variant">
            <div className="max-w-container_max mx-auto flex justify-between items-center px-clg py-cmd">
                <Link href="/" className="flex items-center">
                    <img 
                        alt="ClipScheduler Logo" 
                        className="h-10 w-auto object-contain" 
                        src="/logo.png" 
                    />
                </Link>
                <nav className="hidden md:flex items-center gap-clg">
                    <a className="text-primary font-bold border-b-2 border-primary pb-1 font-label-md text-label-md" href="#">Features</a>
                    <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 font-label-md text-label-md" href="#">Pricing</a>
                    <a className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 font-label-md text-label-md" href="#">Enterprise</a>
                </nav>
                <div className="flex items-center gap-cmd">
                    <Link href="/login" className="text-on-surface-variant font-bold hover:text-primary transition-colors duration-200 font-label-md text-label-md">Log In</Link>
                    <Link href="/register" className="bg-primary-container text-on-primary-container px-cmd py-cxs rounded-lg font-label-md text-label-md font-bold active:scale-95 transition-transform flex items-center justify-center">
                        Start Free Trial
                    </Link>
                </div>
            </div>
        </header>
    );
}
