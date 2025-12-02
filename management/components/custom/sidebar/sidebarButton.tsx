import { SidebarMenuButton } from "@/components/ui/sidebar";

export default function sidebarButton({ title, icon, href }: { title: string; icon: React.ReactNode; href: string }) {
    return (
        <SidebarMenuButton asChild>
            <a href={href}>
                {icon}
                {title}
            </a>
        </SidebarMenuButton>
    )
}