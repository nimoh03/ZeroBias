import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Desktop Sidebar (Fixed on the left) */}
      <Sidebar />
      
      {/* Main Wrapper: Pushed 64 units right on large screens to avoid the sidebar */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header />
        
        {/* Main Content Area: Added bottom padding on mobile so the MobileNav doesn't cover content */}
        <main className="flex-1 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Hidden on desktop) */}
      <MobileNav />
    </div>
  );
}