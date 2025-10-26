import api from "@/api/axios";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@components/shadcn-ui/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { ChevronUp, FileIcon, Home, LogOut, Truck, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./shadcn-ui/DropdownMenu";
import { setCookie } from "@/lib/utils";
import { Link } from "react-router";

const menuItems = [
  {
    groupName: "Geral",
    items: [
      { title: "Início", url: "/main", icon: Home },
    ]
  },
  {
    groupName: "Logística",
    items: [
      { title: "Caminhões", url: "/trucks", icon: Truck },
      { title: "Frotas", url: "/fleets", icon: FileIcon }
    ]
  }
];

interface UserData {
  email: string;
  name: string;
}

async function fetchUserData() {
  const response = await api.get('/users/me');
  return response.data as UserData;
}

async function handleLogout() {
  setCookie("accessToken", "", -1);
  setCookie("refreshToken", "", -1);
  setCookie("passwordChangeRequired", "", -1);
  delete api.defaults.headers.common["Authorization"];
  window.location.href = "/login";
};

export default function AppSidebar() {
  const { data, isPending } = useQuery({
    queryKey: ['user-me'],
    queryFn: fetchUserData
  })

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        {menuItems.map((group, index) => (
          <SidebarGroup key={index}>
            <SidebarGroupLabel>{group.groupName}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        {isPending ? (
          <div>Carregando...</div>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="cursor-pointer">
                    <User />
                    {data?.name}
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="end"
                  className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg"
                  sideOffset={6}
                >
                  <DropdownMenuLabel className="p-1.5 font-normal">
                    <div className="grid text-left leading-tight">
                      <span className="truncate font-medium">{data?.name}</span>
                      <span className="truncate text-sm text-muted-foreground">{data?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 hover:bg-red-600/10 focus:bg-red-600/10"
                  onClick={handleLogout}>
                    <LogOut className="text-red-600" />
                    <span>Sair da conta</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
