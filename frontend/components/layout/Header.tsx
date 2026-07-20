import Link from "next/link";

export function Header() {
  return (
    <header className="h-20 flex items-center justify-between px-clg border-b border-outline-variant bg-surface-container-lowest/80 backdrop-blur-md z-30">
      <div></div>
      <div className="flex items-center gap-cmd ml-auto">
        <Link href="/upload" className="bg-primary-container text-white px-cmd py-cxs rounded-full font-label-md flex items-center gap-cxs hover:opacity-90 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Upload
        </Link>
      </div>
    </header>
  );
}
