import AppSidebar from "@components/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@components/shadcn-ui/Sidebar";
import { Outlet } from "react-router";
import { getCookie } from "@/lib/utils";

export default function MainLayout() {
  const defaultOpen = getCookie("sidebar_state") === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <main>
          <div className="sticky top-0 z-30 p-2 ">
            <SidebarTrigger />
          </div>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
