"use client";

// Shell for the whole authenticated /app area: a fixed left Sidebar
// (desktop) / top bar (mobile) + the page content to its right. The
// login screen is pre-auth, so it opts out of the shell.

import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/app/login") {
    return <>{children}</>;
  }

  return (
    <div className="md:pl-56">
      <Sidebar />
      {children}
    </div>
  );
}
