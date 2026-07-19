import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background font-body-md">
      <PublicNavbar />
      <main className="flex-grow flex flex-col pt-24">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
