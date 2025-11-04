import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { RightSidebar } from "./RightSidebar";
import { useState } from "react";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";

interface LayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
}

export function Layout({ children, showRightSidebar = true }: LayoutProps) {
  // Enable real-time message notifications
  useMessageNotifications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={() => setIsSidebarOpen((s) => !s)} />
      <div className="flex">
        <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 ml-px">{children}</main>
        {showRightSidebar && <RightSidebar />}
      </div>
    </div>
  );
}
