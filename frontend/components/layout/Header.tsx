import Link from "next/link";

export function Header() {
  return (
    <header className="h-20 flex items-center justify-between px-clg border-b border-outline-variant bg-surface-container-lowest/80 backdrop-blur-md z-30">
      <div className="relative w-64 md:w-96 hidden sm:block">
        <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input className="w-full bg-surface-container-high border-outline-variant rounded-full pl-cxl pr-cmd py-cxs text-body-sm focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Search..." type="text" />
      </div>
      <div className="flex items-center gap-cmd ml-auto">
        <button className="relative p-cxs text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border border-surface"></span>
        </button>
        <Link href="/upload" className="bg-primary-container text-white px-cmd py-cxs rounded-full font-label-md flex items-center gap-cxs hover:opacity-90 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Upload
        </Link>
      </div>
    </header>
  );
}
