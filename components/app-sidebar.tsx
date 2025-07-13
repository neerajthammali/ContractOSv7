"use client"

import { useState, useEffect } from "react"
import {
  Building2,
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  FileText,
  MessageSquare,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Users,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { createClient } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderOpen,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Budget",
    url: "/budget",
    icon: DollarSign,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Team Members",
    url: "/team",
    icon: Users,
  },
]

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { user } = useAuth()
  const { state } = useSidebar()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Sync with sidebar state
  useEffect(() => {
    setIsCollapsed(state === "collapsed")
  }, [state])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const getUserInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2)
  }

  const isActiveRoute = (url: string) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(url)
  }

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600 flex-shrink-0" />
            {!isCollapsed && (
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">ContractOS</h2>
                <p className="text-xs text-gray-600 truncate">Project Management</p>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => {
                  const isActive = isActiveRoute(item.url)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={`w-full ${isActive ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600" : ""}`}
                          >
                            <Link href={item.url} className="flex items-center gap-3">
                              <item.icon className="h-5 w-5 flex-shrink-0" />
                              {!isCollapsed && <span className="truncate">{item.title}</span>}
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right" align="center">
                            <p>{item.title}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <Link href="/projects/new" className="flex items-center gap-3">
                          <Plus className="h-5 w-5 flex-shrink-0" />
                          {!isCollapsed && <span className="truncate">New Project</span>}
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" align="center">
                        <p>New Project</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          {user && (
            <div className="space-y-2">
              {/* User Info */}
              <div
                className={`flex items-center gap-3 p-2 rounded-lg bg-gray-50 ${isCollapsed ? "justify-center" : ""}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {getUserInitials(user.email || "U")}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{user.user_metadata?.role || "Team Member"}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <SidebarMenu>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <Link href="/settings" className="flex items-center gap-3">
                          <Settings className="h-5 w-5 flex-shrink-0" />
                          {!isCollapsed && <span className="truncate">Settings</span>}
                        </Link>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" align="center">
                        <p>Settings</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        onClick={handleSignOut}
                        className="flex items-center gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="truncate">Sign Out</span>}
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" align="center">
                        <p>Sign Out</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
}
