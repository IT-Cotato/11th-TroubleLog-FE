import Header from "@/layouts/Header/Header";
import NotificationToaster from "@/features/notification/NotificationToaster";
import { Outlet } from "react-router-dom";
import Footer from "./Footer/Footer";
import NotificationBootstrap from "@/features/notification/NotificationBootstrap";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white w-full">
      <Header />
      {/* center content with a sane max width + responsive padding */}
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
        <NotificationBootstrap />
        <Outlet />
        <NotificationToaster />
      </main>
      <Footer />
    </div>
  );
}
