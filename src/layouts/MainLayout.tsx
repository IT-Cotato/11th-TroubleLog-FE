import type { ReactNode } from "react";
import Header from "@/components/Header";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 max-w-screen-xl mx-auto w-full">{children}</main>
    </div>
  );
}
