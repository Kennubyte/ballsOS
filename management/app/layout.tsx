import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarProvider } from "@/components/ui/sidebar";
import SidebarButton from "@/components/custom/sidebar/sidebarButton";
import { HomeIcon, ContainerIcon, MonitorIcon, ArchiveIcon, NetworkIcon, SettingsIcon, TerminalIcon, RouteIcon } from "lucide-react";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
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
              <Sidebar>
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
                    </SidebarMenu>
                  </SidebarGroup>
                </SidebarFooter>
              </Sidebar>
  
              {children}
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}