import Header from "@/components/Header/Header";
import NotificationToaster from "@/components/Notification/NotificationToaster";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white w-full">
      <Header />
      <main className="flex-1 max-w-screen-[1920px] px-4 sm:px-6 md:px-8">
        <Outlet />
        <NotificationToaster />
      </main>
    </div>
  );
}
