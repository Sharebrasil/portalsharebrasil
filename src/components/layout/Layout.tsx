import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { RightSidebar } from "./RightSidebar";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";

interface LayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
}

export function Layout({ children, showRightSidebar = true }: LayoutProps) {
  // Enable real-time message notifications
  useMessageNotifications();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
        {showRightSidebar && <RightSidebar />}
      </div>
    </div>
  );
}
