import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        onCollapseChange={setSidebarCollapsed}
        isCollapsed={sidebarCollapsed}
      />
      <div 
        className="flex-1 transition-all duration-300"
        style={{ 
          marginLeft: sidebarCollapsed ? '80px' : '280px',
        }}
      >
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}