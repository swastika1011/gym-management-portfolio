import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/Sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFEADE] [font-family:var(--font-raleway),sans-serif]">
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="sticky top-0 hidden h-screen lg:block">
          <Sidebar />
        </div>
        <div className="min-w-0">
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
