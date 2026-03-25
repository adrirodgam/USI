import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AppProvider } from "./context/AppContext";
import { useState } from "react";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AppProvider>
      <RouterProvider 
        router={router} 
        future={{
          v7_startTransition: true,
        }}
      />
    </AppProvider>
  );
}