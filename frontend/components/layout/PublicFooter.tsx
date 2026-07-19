export function PublicFooter() {
    return (
        <footer className="bg-surface-container border-t border-outline-variant w-full mt-auto">
            <div className="max-w-container_max mx-auto px-clg py-cxl grid grid-cols-2 md:grid-cols-4 gap-gutter">
                <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center gap-cxs mb-cmd">
                        <img alt="ClipScheduler Logo" className="h-6 w-6 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAu1sOlfOcGGQkzzvvwJdTLEFrgXzrI1XtNZHHQIvWtjboYCamJ8jdBR773F-PAcu75XqqKccY5JgRM8nMwOuWcRiQ4NPUX5d8gNbKiYJvyy_CWNGYf9qEDe4jepmntAGLnXDhSZ9VHYbjnAsxOh9Tmi2gjtjjsNpY9K8Q42Nvp9njqrpCDkvqsHlsAwQowLYawxxfET8alwvceAIDFLo26i8ba-RrnnH74wD3kjbzNCJ-9fAUN0opKZ4D7TMx8KqTWmnVkoIhcMV4" />
                        <span className="text-headline-sm font-headline-sm font-bold text-on-surface tracking-tight">ClipScheduler</span>
                    </div>
                    <p className="text-on-surface-variant font-body-sm text-body-sm mb-clg max-w-xs">
                        The professional choice for cross-platform video automation and scheduling. Built for creators, designed for growth.
                    </p>
                </div>
                <div>
                    <h4 className="text-on-surface font-bold font-label-md text-label-md mb-cmd uppercase tracking-wider">Product</h4>
                    <ul className="flex flex-col gap-csm">
                        <li><a className="text-on-surface-variant font-body-sm text-body-sm hover:text-secondary transition-colors duration-200" href="#">Features</a></li>
                        <li><a className="text-on-surface-variant font-body-sm text-body-sm hover:text-secondary transition-colors duration-200" href="#">Pricing</a></li>
                        <li><a className="text-on-surface-variant font-body-sm text-body-sm hover:text-secondary transition-colors duration-200" href="#">Enterprise</a></li>
                        <li><a className="text-on-surface-variant font-body-sm text-body-sm hover:text-secondary transition-colors duration-200" href="#">Security</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-on-surface font-bold font-label-md text-label-md mb-cmd uppercase tracking-wider">Legal</h4>
                    <ul className="flex flex-col gap-csm">
                        <li><a className="text-on-surface-variant font-body-sm text-body-sm hover:text-secondary transition-colors duration-200" href="#">Privacy Policy</a></li>
                        <li><a className="text-on-surface-variant font-body-sm text-body-sm hover:text-secondary transition-colors duration-200" href="#">Terms of Service</a></li>
                    </ul>
                </div>
                <div className="flex flex-col gap-cmd">
                    <h4 className="text-on-surface font-bold font-label-md text-label-md mb-cmd uppercase tracking-wider">Connect</h4>
                    <div className="flex gap-cmd">
                        <a className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" href="#">public</a>
                        <a className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" href="#">campaign</a>
                        <a className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" href="#">hub</a>
                    </div>
                    <div className="mt-auto">
                        <p className="text-on-surface-variant font-body-sm text-body-sm opacity-60">
                            © 2024 ClipScheduler Inc. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
