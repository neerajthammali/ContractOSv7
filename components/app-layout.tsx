"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { ErrorBoundary } from "./error-boundary"

const publicRoutes = ["/", "/auth/login", "/auth/signup", "/setup"]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicRoute = publicRoutes.includes(pathname)

  if (isPublicRoute) {
    return <ErrorBoundary>{children}</ErrorBoundary>
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  )
}
