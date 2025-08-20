import Header from "@/components/Header/Header";
import NotificationToaster from "@/components/Notification/NotificationToaster";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white w-full">
      <Header />
      {/* center content with a sane max width + responsive padding */}
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
        <Outlet />
        <NotificationToaster />
      </main>
    </div>
  );
}
