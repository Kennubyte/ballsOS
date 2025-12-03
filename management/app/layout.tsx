"use server";

import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarInset, SidebarMenu, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import SidebarButton from "@/components/custom/sidebar/sidebarButton";
import { HomeIcon, ContainerIcon, MonitorIcon, ArchiveIcon, NetworkIcon, SettingsIcon, TerminalIcon, RouteIcon } from "lucide-react";
import LoginPage from "./login";
import { getLogin } from "@/lib/loginManager";
import LogoutButton from "@/components/custom/sidebar/logoutButton";
import "./globals.css";

export default async function RootLayout({ children }: { children: ReactNode }) {

  const token = await getLogin();
  if (!token) {
    return (
      <>
        <html lang="en" suppressHydrationWarning>
          <head />
          <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LoginPage />
          </ThemeProvider>
          </body>
        </html>
      </>
    )
  }


  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <Sidebar variant="inset">
                <SidebarHeader>
                  <h1 className="text-2xl font-bold">ballsOS</h1>
                </SidebarHeader>

                <SidebarContent>
                  <SidebarGroup>
                    <SidebarMenu>
                      <SidebarButton title="Home" icon={<HomeIcon />} href="/" />
                      <SidebarButton title="Host Shell" icon={<TerminalIcon />} href="/shell" />
                      <SidebarButton title="Containers" icon={<ContainerIcon />} href="/containers" />
                      <SidebarButton title="Virtual Machines" icon={<MonitorIcon />} href="/virtual-machines" />
                      <SidebarButton title="Proxy" icon={<RouteIcon />} href="/proxy" />
                      <SidebarButton title="Networks" icon={<NetworkIcon />} href="/networks" />
                      <SidebarButton title="Storage" icon={<ArchiveIcon />} href="/storage" />
                    </SidebarMenu>
                  </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                  <SidebarGroup>
                    <SidebarMenu>
                      <SidebarButton title="Settings" icon={<SettingsIcon />} href="/settings" />
                      <LogoutButton />
                    </SidebarMenu>
                  </SidebarGroup>
                </SidebarFooter>
              </Sidebar>
  
              <SidebarInset>
              <SidebarTrigger className="p-5 rounded-full"/>
              {children}
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}